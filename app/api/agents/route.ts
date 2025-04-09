import { NextResponse } from 'next/server';
import { DbConnection } from '../../../src/lib/db/connection';
import { DbUtils } from '../../../src/lib/db/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    const status = searchParams.get('status');
    const agentType = searchParams.get('agent_type');
    const searchTerm = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortDir = searchParams.get('sort_dir') || 'desc';
    
    const dbConnection = DbConnection.getInstance();
    const dbUtils = new DbUtils(dbConnection);
    
    let agents = [];
    
    try {
      // Check table structure first
      const tableInfo = dbUtils.queryMany(`PRAGMA table_info(agents)`);
      
      // If agents table exists
      if (tableInfo.length > 0) {
        const columnNames = tableInfo.map(col => col.name);
        
        // Build a dynamic query based on existing columns
        let query = 'SELECT id';
        
        // Add columns that exist in the schema
        if (columnNames.includes('name')) query += ', name';
        if (columnNames.includes('agent_id')) query += ', agent_id';
        if (columnNames.includes('status')) query += ', status';
        if (columnNames.includes('type')) query += ', type';
        if (columnNames.includes('category')) query += ', category';
        if (columnNames.includes('last_active')) query += ', last_active';
        if (columnNames.includes('created_at')) query += ', created_at';
        if (columnNames.includes('updated_at')) query += ', updated_at';
        if (columnNames.includes('event_count')) query += ', event_count';
        
        query += ' FROM agents ORDER BY id DESC';
        
        // Try to query the database with columns that exist
        const dbAgents = dbUtils.queryMany(query);
        
        // Process and transform the agent data to ensure all fields exist
        agents = dbAgents.map(agent => {
          // Ensure agent has all the properties we need
          return {
            agent_id: agent.agent_id || `agent-${agent.id}`,
            name: agent.name || 'Unnamed Agent',
            type: agent.type || agent.category || '-',
            status: agent.status || 'inactive',
            created_at: agent.created_at || new Date().toISOString(),
            updated_at: agent.updated_at || agent.last_active || new Date().toISOString(),
            request_count: agent.event_count || 0,
            token_usage: agent.token_usage || 0,
            error_count: agent.error_count || 0
          };
        });
      } else {
        // Table doesn't exist, return empty results
        console.error('Agents table does not exist');
      }
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      // Return empty result set - no fallback data
    }
    
    // Filter agents based on request parameters
    let filteredAgents = [...agents];
    
    if (status) {
      filteredAgents = filteredAgents.filter(agent => agent.status === status);
    }
    
    if (agentType) {
      filteredAgents = filteredAgents.filter(agent => agent.type === agentType);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(search) || 
        agent.agent_id.toLowerCase().includes(search)
      );
    }
    
    // Sort agents
    if (filteredAgents.length > 0) {
      filteredAgents.sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a];
        const bValue = b[sortBy as keyof typeof b];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDir === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return sortDir === 'asc' 
          ? (aValue < bValue ? -1 : 1) 
          : (bValue < aValue ? -1 : 1);
      });
    }
    
    // Paginate the results
    const totalItems = filteredAgents.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filteredAgents.slice(startIndex, endIndex);
    
    // Format according to expected response structure
    const response = {
      items,
      pagination: {
        page,
        page_size: pageSize,
        total: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { 
        items: [],
        pagination: {
          page: 1,
          page_size: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 