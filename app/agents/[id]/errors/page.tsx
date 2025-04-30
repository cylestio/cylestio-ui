'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, BarChart } from '@tremor/react';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '../../../components/drilldown/BreadcrumbNavigation';
import LoadingState from '../../../components/LoadingState';
import ErrorMessage from '../../../components/ErrorMessage';

// Types
type ErrorData = {
  error_id: string;
  timestamp: string;
  error_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  session_id?: string;
};

interface AgentErrorsPageProps {
  params: {
    id: string;
  };
}

export default function AgentErrorsPage({ params }: AgentErrorsPageProps) {
  const agentId = params.id;
  
  // State
  const [agentName, setAgentName] = useState<string>('');
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch agent basic info for the name
        const agentResponse = await fetch(`/api/agents/${agentId}`);
        if (!agentResponse.ok) {
          throw new Error(`Failed to fetch agent: ${agentResponse.statusText}`);
        }
        const agentData = await agentResponse.json();
        setAgentName(agentData.name);
        
        // For MVP, we'll create some sample error data
        // In the future, this should be fetched from a real API endpoint
        const now = new Date();
        const errorTypes = ['API Error', 'Timeout', 'Validation Error', 'Runtime Exception', 'Memory Limit'];
        const messages = [
          'Failed to connect to external API',
          'Request timed out after 30 seconds',
          'Invalid input format provided',
          'Unexpected error during execution',
          'Memory limit exceeded during operation'
        ];
        const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        
        const sampleErrors: ErrorData[] = [];
        for (let i = 0; i < 10; i++) {
          const date = new Date(now);
          date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7)); // Random time in the last week
          const errorTypeIndex = Math.floor(Math.random() * errorTypes.length);
          
          sampleErrors.push({
            error_id: `err-${i.toString().padStart(5, '0')}`,
            timestamp: date.toISOString(),
            error_type: errorTypes[errorTypeIndex],
            message: messages[errorTypeIndex],
            severity: severities[Math.floor(Math.random() * severities.length)],
            session_id: `sess-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`
          });
        }
        
        // Sort by timestamp, newest first
        sampleErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setErrors(sampleErrors);
        
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, timeRange]);

  // Calculate error breakdown by type
  const errorBreakdown = errors.reduce((acc: {[key: string]: number}, curr) => {
    acc[curr.error_type] = (acc[curr.error_type] || 0) + 1;
    return acc;
  }, {});
  
  const chartData = Object.entries(errorBreakdown).map(([type, count]) => ({
    type,
    count
  }));
  
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  const SeverityBadge = ({ severity }: { severity: string }) => {
    switch (severity) {
      case 'high':
        return <Badge color="red">High</Badge>;
      case 'medium':
        return <Badge color="amber">Medium</Badge>;
      case 'low':
        return <Badge color="green">Low</Badge>;
      default:
        return <Badge color="gray">{severity}</Badge>;
    }
  };

  if (loading) {
    return <LoadingState message="Loading error data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <BreadcrumbNavigation
        items={[
          { label: 'Agents', href: '/agents' },
          { label: agentName, href: `/agents/${agentId}` },
          { label: 'Errors', href: `/agents/${agentId}/errors` },
        ]}
        includeHome={true}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title className="text-2xl font-bold">Agent Errors</Title>
          <Text>Error analysis for this agent</Text>
        </div>
        <Link href={`/agents/${agentId}`}>
          <div className="flex items-center text-blue-500 hover:underline cursor-pointer">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to Agent Overview</span>
          </div>
        </Link>
      </div>
      
      <Card className="mb-6">
        <div className="mb-4">
          <Title>Error Type Distribution</Title>
          <Text>Breakdown of errors by type</Text>
        </div>
        
        <div className="h-80">
          <BarChart
            data={chartData}
            index="type"
            categories={["count"]}
            colors={["red"]}
            valueFormatter={(value) => `${value}`}
            yAxisWidth={40}
            showLegend={false}
          />
        </div>
      </Card>
      
      <Card>
        <div className="mb-4">
          <Title>Recent Errors</Title>
          <Text>Detailed list of recent errors</Text>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Error Type</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
              <TableHeaderCell>Severity</TableHeaderCell>
              <TableHeaderCell>Session ID</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.map((err) => (
              <TableRow key={err.error_id}>
                <TableCell>{formatTimestamp(err.timestamp)}</TableCell>
                <TableCell>{err.error_type}</TableCell>
                <TableCell className="max-w-md truncate">{err.message}</TableCell>
                <TableCell><SeverityBadge severity={err.severity} /></TableCell>
                <TableCell>
                  {err.session_id && (
                    <Link href={`/agents/${agentId}/sessions/${err.session_id}`}>
                      <span className="text-blue-500 hover:underline">{err.session_id}</span>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 