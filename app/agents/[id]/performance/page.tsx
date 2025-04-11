'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Grid, AreaChart, Flex } from '@tremor/react';
import { ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BreadcrumbNavigation from '../../../components/drilldown/BreadcrumbNavigation';
import LoadingState from '../../../components/LoadingState';
import ErrorMessage from '../../../components/ErrorMessage';

// Types
type PerformanceData = {
  timestamp: string;
  response_time_ms: number;
  throughput: number;
};

interface AgentPerformancePageProps {
  params: {
    id: string;
  };
}

export default function AgentPerformancePage({ params }: AgentPerformancePageProps) {
  const agentId = params.id;
  
  // State
  const [agentName, setAgentName] = useState<string>('');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
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
        
        // For MVP, we'll create some sample performance data
        // In the future, this should be fetched from a real API endpoint
        const now = new Date();
        const sampleData: PerformanceData[] = [];
        for (let i = 0; i < 10; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          sampleData.push({
            timestamp: date.toISOString(),
            response_time_ms: Math.random() * 1000 + 500,
            throughput: Math.floor(Math.random() * 100) + 10
          });
        }
        setPerformanceData(sampleData.reverse());
        
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, timeRange]);

  // Format chart data
  const chartData = performanceData.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    "Response Time (ms)": item.response_time_ms,
    "Throughput (req/min)": item.throughput
  }));

  if (loading) {
    return <LoadingState message="Loading performance data..." />;
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
          { label: 'Performance', href: `/agents/${agentId}/performance` },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title className="text-2xl font-bold">Performance Metrics</Title>
          <Text>Performance analysis for this agent</Text>
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
          <Title>Response Time Trend</Title>
          <Text>Average response time over time</Text>
        </div>
        
        <div className="h-80">
          <AreaChart
            data={chartData}
            index="date"
            categories={["Response Time (ms)"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value.toFixed(2)} ms`}
            yAxisWidth={60}
            showLegend={true}
          />
        </div>
      </Card>
      
      <Card>
        <div className="mb-4">
          <Title>Throughput Trend</Title>
          <Text>Requests processed over time</Text>
        </div>
        
        <div className="h-80">
          <AreaChart
            data={chartData}
            index="date"
            categories={["Throughput (req/min)"]}
            colors={["green"]}
            valueFormatter={(value) => `${value.toFixed(0)} req/min`}
            yAxisWidth={60}
            showLegend={true}
          />
        </div>
      </Card>
    </div>
  );
} 