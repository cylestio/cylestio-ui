'use client';

import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';

interface Trace {
  id: string;
  trace_id: string;
  agent_id: string;
  parent_id?: string;
  type: string;
  operation: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

interface AgentTracesProps {
  agentId: string;
  timeRange?: string;
}

export function AgentTraces({ agentId, timeRange = '7d' }: AgentTracesProps) {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTraces = async () => {
      try {
        setLoading(true);
        
        // Build the endpoint with time range parameter
        const params = { time_range: timeRange };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.TRACES(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetchAPI<{ traces: Trace[] }>(endpoint);
        
        if (!isMounted) return;
        
        setTraces(response.traces || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching traces:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load trace data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchTraces();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);
  
  if (loading) {
    return <LoadingState message="Loading trace data..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (traces.length === 0) {
    return (
      <Card className="mt-4">
        <Text>No traces found for this agent in the selected time range.</Text>
      </Card>
    );
  }
  
  return (
    <Card className="mt-4">
      <Title>Execution Traces</Title>
      <Text className="mb-4">Detailed operation traces for this agent</Text>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Trace ID</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Operation</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Duration</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {traces.map((trace) => (
            <TableRow key={trace.id}>
              <TableCell className="font-mono text-xs">{trace.trace_id}</TableCell>
              <TableCell>{trace.type}</TableCell>
              <TableCell>{trace.operation}</TableCell>
              <TableCell>{new Date(trace.start_time).toLocaleString()}</TableCell>
              <TableCell>{trace.duration_ms ? `${trace.duration_ms.toLocaleString()} ms` : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 