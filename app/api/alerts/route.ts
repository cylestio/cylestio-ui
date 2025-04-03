import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../src/lib/db/connection';
import { DbUtils } from '../../../src/lib/db/utils';
import { config } from '../../lib/config';
import { generateMockAlerts } from '../../lib/mockData';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search') || '';
    const severity = searchParams.get('severity') || '';
    const alertType = searchParams.get('type') || '';
    const agentId = searchParams.get('agentId') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const sort = searchParams.get('sort') || 'timestamp';
    const order = searchParams.get('order') || 'desc';

    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let alerts = [];
    let total = 0;
    let critical = 0;
    let pagination = {
      currentPage: page,
      pageSize,
      totalPages: 1,
      totalItems: 0
    };
    let error = null;
    
    try {
      // Check if the security_alerts table exists first
      const tableCheck = dbUtils.queryOne(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='security_alerts'
      `);
      
      if (!tableCheck) {
        throw new Error('Security alerts table does not exist in the database');
      }
      
      // Check what columns are available in the security_alerts table
      const columnsCheck = dbUtils.queryMany(`
        PRAGMA table_info(security_alerts)
      `);
      
      // Get column names
      const columns = columnsCheck.map((col: any) => col.name);
      
      // Check if required columns exist
      const hasId = columns.includes('id');
      const hasSeverity = columns.includes('severity');
      const hasAlertType = columns.includes('alert_type');
      const hasTimestamp = columns.includes('timestamp');
      const hasEventId = columns.includes('event_id');
      
      if (!hasId) {
        throw new Error('Security alerts table is missing required id column');
      }
      
      if (!hasAlertType) {
        throw new Error('Security alerts table is missing required alert_type column');
      }
      
      if (!hasSeverity) {
        throw new Error('Security alerts table is missing required severity column');
      }
      
      // Build a safe query based on available columns
      const selectColumns = ['id'];
      if (hasSeverity) selectColumns.push('severity');
      if (hasAlertType) selectColumns.push('alert_type');
      if (hasTimestamp) selectColumns.push('timestamp');
      if (hasEventId) selectColumns.push('event_id');
      
      // Add other columns if they exist
      if (columns.includes('description')) selectColumns.push('description');
      if (columns.includes('matched_terms')) selectColumns.push('matched_terms');
      if (columns.includes('action_taken')) selectColumns.push('action_taken');
      
      // Try to join with events table to get agent info if possible
      let joinWithEvents = false;
      let eventsTableExists = false;
      let hasAgentIdInEvents = false;

      try {
        const eventsTableCheck = dbUtils.queryOne(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='events'
        `);
        
        if (eventsTableCheck) {
          eventsTableExists = true;
          
          const eventsColumnsCheck = dbUtils.queryMany(`
            PRAGMA table_info(events)
          `);
          
          const eventsColumns = eventsColumnsCheck.map((col: any) => col.name);
          if (eventsColumns.includes('agent_id')) {
            hasAgentIdInEvents = true;
            joinWithEvents = true;
          }
        }
      } catch (error) {
        console.warn('Could not check events table:', error);
      }
      
      // Build WHERE clauses for filtering
      const whereClauses = [];
      const queryParams: Record<string, any> = {};
      
      // Search filter (check across multiple columns)
      if (search) {
        const searchClauses = [];
        if (columns.includes('description'))
          searchClauses.push('sa.description LIKE @search');
        if (columns.includes('alert_type'))
          searchClauses.push('sa.alert_type LIKE @search');
        
        if (searchClauses.length > 0) {
          whereClauses.push(`(${searchClauses.join(' OR ')})`);
          queryParams.search = `%${search}%`;
        }
      }
      
      // Severity filter
      if (severity && severity !== 'all' && hasSeverity) {
        whereClauses.push('UPPER(sa.severity) = UPPER(@severity)');
        queryParams.severity = severity;
      }
      
      // Alert type filter
      if (alertType && alertType !== 'all' && hasAlertType) {
        whereClauses.push('UPPER(sa.alert_type) = UPPER(@alertType)');
        queryParams.alertType = alertType;
      }
      
      // Agent filter
      if (agentId && agentId !== 'all' && joinWithEvents && hasAgentIdInEvents) {
        whereClauses.push('e.agent_id = @agentId');
        queryParams.agentId = parseInt(agentId);
      }
      
      // Date range filter
      if (from && hasTimestamp) {
        whereClauses.push('sa.timestamp >= @from');
        queryParams.from = from;
      }
      
      if (to && hasTimestamp) {
        whereClauses.push('sa.timestamp <= @to');
        queryParams.to = to;
      }
      
      // Build the WHERE clause string
      const whereClause = whereClauses.length > 0 
        ? `WHERE ${whereClauses.join(' AND ')}` 
        : '';
      
      // Validate sort field exists in columns
      let sortField = 'id';
      if (sort === 'timestamp' && hasTimestamp) sortField = 'sa.timestamp';
      else if (sort === 'severity' && hasSeverity) sortField = 'sa.severity';
      else if (sort === 'alert_type' && hasAlertType) sortField = 'sa.alert_type';
      else if (columns.includes(sort)) sortField = `sa.${sort}`;
      
      // Build ORDER BY clause
      const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
      const orderClause = `ORDER BY ${sortField} ${orderDirection}`;
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const limitClause = `LIMIT ${pageSize} OFFSET ${offset}`;
      
      // Build join clause if needed
      let joinClause = '';
      let selectAgentFields = '';
      
      if (joinWithEvents && hasAgentIdInEvents) {
        joinClause = 'LEFT JOIN events e ON sa.event_id = e.id';
        selectAgentFields = ', e.agent_id';
        
        // Try to join with agents table if it exists
        try {
          const agentsTableCheck = dbUtils.queryOne(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='agents'
          `);
          
          if (agentsTableCheck) {
            joinClause += ' LEFT JOIN agents a ON e.agent_id = a.id';
            selectAgentFields += ', a.name as agent_name';
          }
        } catch (error) {
          console.warn('Could not check agents table:', error);
        }
      }
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM security_alerts sa
        ${joinClause ? joinClause : ''}
        ${whereClause}
      `;
      
      try {
        const countResult = dbUtils.queryOne(countQuery, queryParams);
        total = countResult?.total || 0;
        pagination.totalItems = total;
        pagination.totalPages = Math.ceil(total / pageSize);
      } catch (countError) {
        console.error('Error counting alerts:', countError);
        throw new Error('Failed to count security alerts');
      }
      
      // Check if there are any alerts at all
      if (total === 0) {
        return NextResponse.json({
          alerts: [],
          pagination: {
            currentPage: 1,
            pageSize: 25,
            totalPages: 0,
            totalItems: 0
          },
          total: 0,
          critical: 0,
          message: 'No security alerts found in the database'
        });
      }
      
      // Get critical alerts count
      if (hasSeverity) {
        let criticalQuery = `
          SELECT COUNT(*) as critical 
          FROM security_alerts 
          WHERE UPPER(severity) = 'CRITICAL'
        `;
        
        try {
          const criticalResult = dbUtils.queryOne(criticalQuery);
          critical = criticalResult?.critical || 0;
        } catch (criticalError) {
          console.error('Error counting critical alerts:', criticalError);
          critical = 0;
        }
      }
      
      // Build and execute the final query
      const query = `
        SELECT sa.${selectColumns.join(', sa.')}${selectAgentFields} 
        FROM security_alerts sa
        ${joinClause}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `;
      
      alerts = dbUtils.queryMany(query, queryParams);
      
      if (alerts.length === 0) {
        error = 'No security alerts found that match your filters';
      }
      
      // Process any JSON data that might be stored as strings
      alerts = alerts.map((alert: any) => {
        const processed = { ...alert };
        
        // Try to parse matched_terms if it's a string
        if (processed.matched_terms && typeof processed.matched_terms === 'string') {
          try {
            processed.matched_terms = JSON.parse(processed.matched_terms);
          } catch (e) {
            // Keep as string if it's not valid JSON
          }
        }
        
        // Ensure all expected properties exist with defaults
        return {
          id: processed.id || 0,
          event_id: processed.event_id || null,
          timestamp: processed.timestamp || new Date().toISOString(),
          severity: processed.severity || 'LOW',
          alert_type: processed.alert_type || 'UNKNOWN',
          description: processed.description || 'No description',
          matched_terms: processed.matched_terms || null,
          agent_id: processed.agent_id || null,
          agent_name: processed.agent_name || null,
          action_taken: processed.action_taken || 'logged',
        };
      });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Only use mock data if explicitly configured to do so
      if (config.useMockData) {
        console.log('Using mock data as fallback due to configuration setting');
        alerts = generateMockAlerts(page, pageSize);
        total = 100; // Mock total
        critical = 5; // Mock critical count
        pagination.totalItems = total;
        pagination.totalPages = Math.ceil(total / pageSize);
      } else {
        // Otherwise, return an error
        return NextResponse.json(
          { 
            error: `Database error: ${dbError.message}`, 
            alerts: [],
            pagination: {
              currentPage: 1,
              pageSize: 25,
              totalPages: 0,
              totalItems: 0
            },
            total: 0,
            critical: 0
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      alerts,
      pagination,
      total,
      critical,
      error
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json(
      { 
        error: `Failed to fetch security alerts: ${error.message}`, 
        alerts: [],
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalPages: 0,
          totalItems: 0
        },
        total: 0,
        critical: 0
      },
      { status: 500 }
    );
  }
}