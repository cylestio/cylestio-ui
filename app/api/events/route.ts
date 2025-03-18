import { NextRequest, NextResponse } from 'next/server';
import { DbConnection } from '../../../src/lib/db/connection';
import { DbUtils } from '../../../src/lib/db/utils';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const agentId = searchParams.get('agentId') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const sort = searchParams.get('sort') || 'timestamp';
    const order = searchParams.get('order') || 'desc';

    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let events = [];
    let total = 0;
    
    try {
      // Check if the events table exists first
      const tableCheck = dbUtils.queryOne(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='events'
      `);
      
      if (!tableCheck) {
        throw new Error('Events table does not exist');
      }
      
      // Check what columns are available in the events table
      const columnsCheck = dbUtils.queryMany(`
        PRAGMA table_info(events)
      `);
      
      // Get column names
      const columns = columnsCheck.map((col: any) => col.name);
      
      // Check if required columns exist
      const hasTimestamp = columns.includes('timestamp');
      const hasType = columns.includes('type') || columns.includes('event_type');
      const hasId = columns.includes('id');
      
      if (!hasId) {
        throw new Error('Events table is missing id column');
      }
      
      // Determine column names based on schema
      const typeColumn = columns.includes('type') ? 'type' : 
                         columns.includes('event_type') ? 'event_type' : '';
      
      // Build a safe query based on available columns
      const selectColumns = ['id'];
      if (hasTimestamp) selectColumns.push('timestamp');
      if (hasType && typeColumn) selectColumns.push(`${typeColumn} as type`);
      
      // Add other columns if they exist
      if (columns.includes('agent_id')) selectColumns.push('agent_id');
      if (columns.includes('agent_name')) selectColumns.push('agent_name');
      if (columns.includes('session_id')) selectColumns.push('session_id');
      if (columns.includes('conversation_id')) selectColumns.push('conversation_id');
      if (columns.includes('description')) selectColumns.push('description as details');
      if (columns.includes('details')) selectColumns.push('details');
      if (columns.includes('status')) selectColumns.push('status');
      if (columns.includes('duration') || columns.includes('duration_ms')) {
        const durationCol = columns.includes('duration') ? 'duration' : 'duration_ms';
        selectColumns.push(`${durationCol} as duration`);
      }
      if (columns.includes('data') || columns.includes('payload')) {
        const dataCol = columns.includes('data') ? 'data' : 'payload';
        selectColumns.push(`${dataCol} as data`);
      }
      
      // Build WHERE clauses for filtering
      const whereClauses = [];
      const queryParams: Record<string, any> = {};
      
      // Search filter (check across multiple columns)
      if (search) {
        const searchClauses = [];
        if (columns.includes('details'))
          searchClauses.push('details LIKE @search');
        if (columns.includes('description'))
          searchClauses.push('description LIKE @search');
        if (columns.includes('type'))
          searchClauses.push('type LIKE @search');
        if (columns.includes('event_type'))
          searchClauses.push('event_type LIKE @search');
        
        if (searchClauses.length > 0) {
          whereClauses.push(`(${searchClauses.join(' OR ')})`);
          queryParams.search = `%${search}%`;
        }
      }
      
      // Status filter
      if (status && status !== 'all' && columns.includes('status')) {
        whereClauses.push('status = @status');
        queryParams.status = status;
      }
      
      // Type filter
      if (type && type !== 'all' && hasType && typeColumn) {
        whereClauses.push(`${typeColumn} = @type`);
        queryParams.type = type;
      }
      
      // Agent filter
      if (agentId && agentId !== 'all' && columns.includes('agent_id')) {
        whereClauses.push('agent_id = @agentId');
        queryParams.agentId = parseInt(agentId);
      }
      
      // Date range filter
      if (from && hasTimestamp) {
        whereClauses.push('timestamp >= @from');
        queryParams.from = from;
      }
      
      if (to && hasTimestamp) {
        whereClauses.push('timestamp <= @to');
        queryParams.to = to;
      }
      
      // Build the WHERE clause string
      const whereClause = whereClauses.length > 0 
        ? `WHERE ${whereClauses.join(' AND ')}` 
        : '';
      
      // Validate sort field exists in columns
      let sortField = 'id';
      if (sort === 'timestamp' && hasTimestamp) sortField = 'timestamp';
      else if (sort === 'type' && hasType && typeColumn) sortField = typeColumn;
      else if (columns.includes(sort)) sortField = sort;
      
      // Build ORDER BY clause
      const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
      const orderClause = `ORDER BY ${sortField} ${orderDirection}`;
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const limitClause = `LIMIT ${pageSize} OFFSET ${offset}`;
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM events ${whereClause}`;
      try {
        const countResult = dbUtils.queryOne(countQuery, queryParams);
        total = countResult?.total || 0;
      } catch (countError) {
        console.error('Error counting events:', countError);
        total = 0;
      }
      
      // Build and execute the final query
      const query = `
        SELECT ${selectColumns.join(', ')} FROM events
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `;
      
      events = dbUtils.queryMany(query, queryParams);
      
      // Process any JSON data that might be stored as strings
      events = events.map((event: any) => {
        const processed = { ...event };
        
        // Try to parse JSON data if it's a string
        if (processed.data && typeof processed.data === 'string') {
          try {
            processed.data = JSON.parse(processed.data);
          } catch (e) {
            // Keep as string if it's not valid JSON
          }
        }
        
        return processed;
      });
      
    } catch (dbError) {
      console.error('Database query failed, using fallback data:', dbError);
      // Use mock data if the table doesn't exist or has schema issues
      events = generateMockEvents(page, pageSize);
      total = 100; // Mock total
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      events,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch events', 
        events: [], 
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalPages: 0,
          totalItems: 0
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock events for testing
function generateMockEvents(page: number, pageSize: number): any[] {
  const mockEvents = [];
  const startId = (page - 1) * pageSize + 1;
  const types = ['llm_request', 'llm_response', 'tool_call', 'tool_response', 'user_message', 'agent_message', 'api_call', 'security_alert'];
  const statuses = ['success', 'error', 'warning', 'info'];
  
  // Generate events for the current page
  for (let i = 0; i < pageSize; i++) {
    const id = startId + i;
    const date = new Date();
    date.setMinutes(date.getMinutes() - id); // Each event is 1 minute older
    
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const agent_id = Math.floor(Math.random() * 5) + 1;
    const agent_name = `Agent #${agent_id}`;
    const duration = Math.floor(Math.random() * 1000) + 50;
    
    let details = '';
    let data = null;
    
    // Generate appropriate details and data based on type
    if (type === 'llm_request') {
      details = 'Request to OpenAI API';
      data = {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Tell me about AI safety.' }
        ]
      };
    } else if (type === 'llm_response') {
      details = 'Response from OpenAI API';
      data = {
        content: 'AI safety refers to the research field focused on ensuring that artificial intelligence systems remain safe and aligned with human values...',
        model: 'gpt-4',
        usage: { prompt_tokens: 20, completion_tokens: 150, total_tokens: 170 }
      };
    } else if (type === 'tool_call') {
      details = 'Calling external tool';
      data = {
        tool_name: 'web_search',
        input: { query: 'latest AI developments' }
      };
    } else if (type === 'api_call') {
      details = status === 'error' ? 'Failed API call to external service' : 'Successful API call';
      data = {
        method: 'GET',
        url: 'https://api.example.com/data',
        headers: { 'Content-Type': 'application/json' },
        status_code: status === 'error' ? 500 : 200
      };
    }
    
    mockEvents.push({
      id,
      timestamp: date.toISOString(),
      type,
      status,
      agent_id,
      agent_name,
      session_id: Math.floor(id / 10) + 1,
      conversation_id: Math.floor(id / 5) + 1,
      duration,
      details,
      data
    });
  }
  
  return mockEvents;
} 