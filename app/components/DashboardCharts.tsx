'use client';

import { useEffect, useState } from 'react';
import { Card, Title, AreaChart, DonutChart, BarChart, Flex } from '@tremor/react';

// In a real implementation, this would fetch from the API
async function fetchChartData() {
  try {
    const response = await fetch('/api/charts');
    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching chart data:', error);
    // Return fallback data for development
    return {
      callsPerMinute: [
        { minute: '12:00', calls: 42 },
        { minute: '12:01', calls: 38 },
        { minute: '12:02', calls: 45 },
        { minute: '12:03', calls: 53 },
        { minute: '12:04', calls: 49 },
        { minute: '12:05', calls: 62 },
        { minute: '12:06', calls: 58 },
        { minute: '12:07', calls: 71 },
        { minute: '12:08', calls: 67 },
        { minute: '12:09', calls: 64 },
        { minute: '12:10', calls: 59 },
        { minute: '12:11', calls: 52 },
        { minute: '12:12', calls: 48 },
        { minute: '12:13', calls: 55 },
        { minute: '12:14', calls: 61 },
        { minute: '12:15', calls: 68 },
      ],
      alertDistribution: [
        { name: 'Info', value: 456 },
        { name: 'Warning', value: 48 },
        { name: 'Error', value: 12 },
      ],
      alertsOverTime: [
        { date: '2025-03-05', count: 6 },
        { date: '2025-03-06', count: 4 },
        { date: '2025-03-07', count: 7 },
        { date: '2025-03-08', count: 3 },
        { date: '2025-03-09', count: 8 },
        { date: '2025-03-10', count: 5 },
        { date: '2025-03-11', count: 2 },
      ],
    };
  }
}

export default function DashboardCharts() {
  const [chartData, setChartData] = useState({
    callsPerMinute: [],
    alertDistribution: [],
    alertsOverTime: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getChartData = async () => {
      setLoading(true);
      const data = await fetchChartData();
      setChartData(data);
      setLoading(false);
    };

    getChartData();
    
    // Set up polling every 60 seconds
    const interval = setInterval(getChartData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Custom colors for the charts
  const colors = {
    area: ['blue'],
    donut: {
      Info: 'emerald',
      Warning: 'amber',
      Error: 'red'
    },
    bar: ['amber']
  };

  return (
    <div className="space-y-6">
      <Flex className="gap-6">
        <Card className="flex-1">
          <Title>Calls Per Minute</Title>
          <AreaChart
            className="h-72 mt-4"
            data={chartData.callsPerMinute}
            index="minute"
            categories={["calls"]}
            colors={colors.area}
            showLegend={false}
            showAnimation={true}
            valueFormatter={(value) => `${value} calls`}
          />
        </Card>
        
        <Card className="flex-1">
          <Title>Alert Distribution</Title>
          <DonutChart
            className="h-72 mt-4"
            data={chartData.alertDistribution}
            category="value"
            index="name"
            colors={Object.values(colors.donut)}
            showAnimation={true}
            valueFormatter={(value) => `${value} events`}
          />
        </Card>
      </Flex>
      
      <Card>
        <Title>Alerts Over Time</Title>
        <BarChart
          className="h-72 mt-4"
          data={chartData.alertsOverTime}
          index="date"
          categories={["count"]}
          colors={colors.bar}
          showLegend={false}
          showAnimation={true}
          valueFormatter={(value) => `${value} alerts`}
        />
      </Card>
    </div>
  );
} 