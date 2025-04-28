'use client';

import { useState } from 'react';
import {
  Card,
  Title,
  AreaChart,
  Flex,
  Text,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  BarChart,
} from '@tremor/react';
import { formatISOToLocalDisplay } from '../../lib/dateUtils';

// Type for timeline data
type TimelineInterval = {
  timestamp: string;
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
};

type EventsTimelineProps = {
  timelineData: TimelineInterval[];
  timeRange: string;
  loading: boolean;
};

export function EventsTimeline({
  timelineData,
  timeRange,
  loading,
}: EventsTimelineProps) {
  const [activeTab, setActiveTab] = useState(0);

  // Format timestamp based on time range
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (timeRange) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' });
      case '30d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return formatISOToLocalDisplay(timestamp);
    }
  };

  // Prepare data for total events chart
  const totalChartData = timelineData.map((interval) => ({
    timestamp: formatTimestamp(interval.timestamp),
    Events: interval.total,
  }));

  // Prepare data for events by type chart
  const typeChartData = timelineData.map((interval) => {
    const data: Record<string, any> = {
      timestamp: formatTimestamp(interval.timestamp),
    };
    
    // Add all event types
    Object.entries(interval.by_type).forEach(([type, count]) => {
      // Format type name to be more readable
      const formattedType = type.split('.').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      data[formattedType] = count;
    });
    
    return data;
  });

  // Prepare data for events by status chart
  const statusChartData = timelineData.map((interval) => {
    const data: Record<string, any> = {
      timestamp: formatTimestamp(interval.timestamp),
    };
    
    // Add all status types
    Object.entries(interval.by_status).forEach(([status, count]) => {
      // Format status name to be more readable
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      data[formattedStatus] = count;
    });
    
    return data;
  });

  // Get categories for type chart
  const typeCategories = Array.from(
    new Set(
      timelineData.flatMap((interval) =>
        Object.keys(interval.by_type).map((type) =>
          type.split('.').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        )
      )
    )
  );

  // Get categories for status chart
  const statusCategories = Array.from(
    new Set(
      timelineData.flatMap((interval) =>
        Object.keys(interval.by_status).map((status) =>
          status.charAt(0).toUpperCase() + status.slice(1)
        )
      )
    )
  );

  return (
    <>
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList variant="solid" className="mb-4">
          <Tab>Total</Tab>
          <Tab>By Type</Tab>
          <Tab>By Status</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            {loading || totalChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <Text>
                  {loading ? 'Loading chart data...' : 'No data available for the selected time range'}
                </Text>
              </div>
            ) : (
              <AreaChart
                className="h-64"
                data={totalChartData}
                index="timestamp"
                categories={['Events']}
                colors={['blue']}
                showLegend={false}
                valueFormatter={(value) => value.toString()}
                showAnimation
                showXAxis
                showYAxis
                showGridLines
                showTooltip
                autoMinValue
              />
            )}
          </TabPanel>

          <TabPanel>
            {loading || typeChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <Text>
                  {loading ? 'Loading chart data...' : 'No data available for the selected time range'}
                </Text>
              </div>
            ) : (
              <BarChart
                className="h-64"
                data={typeChartData}
                index="timestamp"
                categories={typeCategories}
                colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia', 'green', 'emerald']}
                valueFormatter={(value) => value.toString()}
                showAnimation
                showLegend
                stack
              />
            )}
          </TabPanel>

          <TabPanel>
            {loading || statusChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <Text>
                  {loading ? 'Loading chart data...' : 'No data available for the selected time range'}
                </Text>
              </div>
            ) : (
              <BarChart
                className="h-64"
                data={statusChartData}
                index="timestamp"
                categories={statusCategories}
                colors={['green', 'yellow', 'red']}
                valueFormatter={(value) => value.toString()}
                showAnimation
                showLegend
                stack
              />
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  );
} 