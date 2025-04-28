'use client';

import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';

interface LLMRequest {
  id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
  status: string;
  error?: string;
  duration_ms: number;
}

interface AgentLLMRequestsTableProps {
  agentId: string;
  timeRange?: string;
}

export function AgentLLMRequestsTable({ agentId, timeRange = '7d' }: AgentLLMRequestsTableProps) {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRequests = async () => {
      try {
        setLoading(true);
        
        // Build the endpoint with time range parameter
        const params = { time_range: timeRange };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.LLM_REQUESTS(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetchAPI<{ requests: LLMRequest[] }>(endpoint);
        
        if (!isMounted) return;
        
        setRequests(response.requests || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching LLM requests:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load LLM requests');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchRequests();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);
  
  if (loading) {
    return <LoadingState message="Loading LLM requests..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (requests.length === 0) {
    return (
      <Card className="mt-4">
        <Text>No LLM requests found for this agent in the selected time range.</Text>
      </Card>
    );
  }
  
  return (
    <Card className="mt-4">
      <Title>LLM Requests</Title>
      <Text className="mb-4">Recent LLM requests made by this agent</Text>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Model</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Tokens</TableHeaderCell>
            <TableHeaderCell>Duration</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.id}</TableCell>
              <TableCell>{request.model}</TableCell>
              <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
              <TableCell>{request.total_tokens.toLocaleString()}</TableCell>
              <TableCell>{request.duration_ms.toLocaleString()} ms</TableCell>
              <TableCell>
                <Badge color={request.status === 'success' ? 'green' : 'red'}>
                  {request.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 