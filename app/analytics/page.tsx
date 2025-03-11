'use client';

import { Card, Title, BarChart, LineChart, DonutChart, Grid, Text } from '@tremor/react';
import { useEffect, useState } from 'react';

const performanceData = [
  {
    date: '2025-03-11 09:00',
    responseTime: 120,
    errorRate: 0.5,
  },
  {
    date: '2025-03-11 09:05',
    responseTime: 150,
    errorRate: 0.8,
  },
  {
    date: '2025-03-11 09:10',
    responseTime: 110,
    errorRate: 0.3,
  },
  {
    date: '2025-03-11 09:15',
    responseTime: 180,
    errorRate: 1.2,
  },
];

const requestDistribution = [
  { name: 'Text Generation', value: 45 },
  { name: 'Code Analysis', value: 30 },
  { name: 'Data Processing', value: 15 },
  { name: 'Other', value: 10 },
];

const usageByEndpoint = [
  { endpoint: '/api/generate', requests: 2340 },
  { endpoint: '/api/analyze', requests: 1670 },
  { endpoint: '/api/process', requests: 890 },
  { endpoint: '/api/validate', requests: 560 },
  { endpoint: '/api/transform', requests: 450 },
];

const valueFormatter = (value: number) => {
  if (value >= 100) {
    return `${value}ms`;
  }
  return `${value}%`;
};

export default function Analytics() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        {currentTime && (
          <div className="text-sm text-gray-500">
            Last updated: {currentTime}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Title>Total API Requests</Title>
          <Text className="text-4xl font-bold mt-4">12,543</Text>
        </Card>

        <Card>
          <Title>Average Response Time</Title>
          <Text className="text-4xl font-bold mt-4">142ms</Text>
        </Card>
      </div>

      <Card>
        <Title>Performance Metrics</Title>
        <LineChart
          className="mt-6"
          data={performanceData}
          index="date"
          categories={['responseTime', 'errorRate']}
          colors={['blue', 'red']}
          valueFormatter={valueFormatter}
          yAxisWidth={40}
        />
      </Card>

      <Card>
        <Title>Request Distribution</Title>
        <DonutChart
          className="mt-6"
          data={requestDistribution}
          category="value"
          index="name"
          valueFormatter={(value) => `${value}%`}
          colors={["emerald", "blue", "amber", "gray"]}
        />
      </Card>

      <Card>
        <Title>Usage by Endpoint</Title>
        <BarChart
          className="mt-6"
          data={usageByEndpoint}
          index="endpoint"
          categories={["requests"]}
          colors={["blue"]}
          valueFormatter={(value) => value.toLocaleString()}
          yAxisWidth={48}
        />
      </Card>
    </div>
  );
} 