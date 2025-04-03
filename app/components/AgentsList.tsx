import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { ErrorDisplay } from '@/components/ui/error-display';
import { createEnhancedApiError } from '@/lib/api/client';

interface Agent {
  id: number;
  agent_id: string;
  name: string;
  description: string;
  version: string;
  active: boolean;
  last_active: string;
  creation_time: string;
}

interface AgentsListProps {
  // ... props if any
}

export default function AgentsList({ /* props */ }: AgentsListProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Explicitly log the request URL for debugging
      console.log(`Fetching agents from: ${apiClient.defaults.baseURL}/agents/ with params:`, { 
        page, 
        page_size: pageSize 
      });
      
      const response = await apiClient.get('/agents/', {
        params: {
          page,
          page_size: pageSize
        }
      });
      
      // Detailed logging of the response structure
      console.log('Agents response structure:', {
        hasItems: Boolean(response.data?.items),
        hasTotal: Boolean(response.data?.total),
        hasPage: Boolean(response.data?.page),
        keys: Object.keys(response.data || {})
      });
      
      // Handle different API response formats
      let agentsData: Agent[] = [];
      let totalCount = 0;
      
      if (response.data?.items && Array.isArray(response.data.items)) {
        // Format: { items: Agent[], total: number, page: number }
        agentsData = response.data.items;
        totalCount = response.data.total || 0;
      } else if (Array.isArray(response.data)) {
        // Format: Agent[]
        agentsData = response.data;
        totalCount = response.data.length;
      } else if (response.data && typeof response.data === 'object') {
        // Try to extract agents data from other formats
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          // Use the first array found
          agentsData = possibleArrays[0] as any[];
          totalCount = agentsData.length;
        }
      }
      
      setAgents(agentsData);
      setTotalItems(totalCount);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(createEnhancedApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, pageSize]);

  // ... rest of the component rendering
} 