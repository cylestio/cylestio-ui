'use client';

import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';

interface ToolExecution {
  id: string;
  tool_name: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: string;
  created_at: string;
  duration_ms: number;
  error?: string;
}

interface AgentToolExecutionsProps {
  agentId: string;
  timeRange?: string;
}

export function AgentToolExecutions({ agentId, timeRange = '7d' }: AgentToolExecutionsProps) {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchToolExecutions = async () => {
      try {
        setLoading(true);
        
        // Build the endpoint with time range parameter
        const params = { time_range: timeRange };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.TOOL_EXECUTIONS(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetchAPI<{ executions: ToolExecution[] }>(endpoint);
        
        if (!isMounted) return;
        
        setExecutions(response.executions || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching tool executions:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load tool executions');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchToolExecutions();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);
  
  if (loading) {
    return <LoadingState message="Loading tool executions..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (executions.length === 0) {
    return (
      <Card className="mt-4">
        <Text>No tool executions found for this agent in the selected time range.</Text>
      </Card>
    );
  }
  
  // Helper function to format JSON data
  const formatJson = (data: Record<string, any> | undefined): string => {
    if (!data) return 'No data';
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return 'Invalid data';
    }
  };
  
  return (
    <Card className="mt-4">
      <Title>Tool Executions</Title>
      <Text className="mb-4">Recent tool executions by this agent</Text>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Tool</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Duration</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Inputs</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {executions.map((execution) => (
            <TableRow key={execution.id}>
              <TableCell>{execution.tool_name}</TableCell>
              <TableCell>{new Date(execution.created_at).toLocaleString()}</TableCell>
              <TableCell>{execution.duration_ms.toLocaleString()} ms</TableCell>
              <TableCell>
                <Badge color={execution.status === 'success' ? 'green' : execution.status === 'pending' ? 'blue' : 'red'}>
                  {execution.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate">
                  {Object.keys(execution.inputs || {}).join(', ')}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 