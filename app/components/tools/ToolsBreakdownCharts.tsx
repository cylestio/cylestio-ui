'use client';

import { 
  Card, 
  Title, 
  Text, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels, 
  BarChart, 
  DonutChart, 
  AreaChart,
  Legend, 
  Flex
} from '@tremor/react';

// Types based on API response
type ToolSummary = {
  total_executions: number;
  success_rate: number;
  avg_duration_ms: number;
  by_tool_type: Record<string, {
    count: number;
    success_rate: number;
    avg_duration_ms: number;
  }>;
  by_status: Record<string, number>;
  top_tools: Array<{
    name: string;
    count: number;
    success_rate: number;
    avg_duration_ms: number;
  }>;
};

type ToolTimelinePoint = {
  timestamp: string;
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
};

type ToolAgentBreakdown = {
  agent_id: string;
  agent_name: string;
  total_executions: number;
  success_rate: number;
  avg_duration_ms: number;
  top_tools: Array<{
    name: string;
    count: number;
    success_rate: number;
  }>;
};

type ToolsBreakdownChartsProps = {
  summary: ToolSummary | null;
  timeline: ToolTimelinePoint[];
  agentBreakdown: ToolAgentBreakdown[];
};

// Format utility for timestamps
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

// Format duration utility
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function ToolsBreakdownCharts({ 
  summary, 
  timeline, 
  agentBreakdown 
}: ToolsBreakdownChartsProps) {
  
  // Prepare data for the tool usage by type chart
  const toolTypeData = summary ? Object.entries(summary.by_tool_type).map(([type, data]) => ({
    type,
    count: data.count,
    percentage: data.count / summary.total_executions * 100
  })) : [];
  
  // Prepare data for success/failure rates by tool type
  const successRateData = summary ? Object.entries(summary.by_tool_type).map(([type, data]) => ({
    type,
    success: data.success_rate * 100,
    failure: 100 - (data.success_rate * 100)
  })) : [];
  
  // Prepare data for top tools chart
  const topToolsData = summary?.top_tools.slice(0, 5).map(tool => ({
    name: tool.name,
    count: tool.count
  })) || [];
  
  // Prepare data for average duration chart
  const durationData = summary ? Object.entries(summary.by_tool_type).map(([type, data]) => ({
    type,
    duration: data.avg_duration_ms
  })) : [];
  
  // Prepare timeline data
  const timelineData = timeline.map(point => {
    // Convert timestamp to date format for chart
    const formattedTime = formatTimestamp(point.timestamp);
    
    // Extract top 3 tool types (if any)
    const types = Object.entries(point.by_type)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // Create data point with formatted timestamp and total
    const dataPoint: any = {
      time: formattedTime,
      Total: point.total
    };
    
    // Add top tool types to the data point
    types.forEach(([type, count]) => {
      dataPoint[type] = count;
    });
    
    return dataPoint;
  });
  
  // Format values for charts
  const valueFormatter = (value: number) => value.toLocaleString();
  const percentFormatter = (value: number) => `${value.toFixed(1)}%`;
  const durationFormatter = (value: number) => formatDuration(value);
  
  return (
    <div className="space-y-6">
      <TabGroup>
        <TabList className="mt-8">
          <Tab>Usage Breakdown</Tab>
          <Tab>Performance</Tab>
          <Tab>Timeline</Tab>
          <Tab>By Agent</Tab>
        </TabList>
        
        <TabPanels>
          {/* Usage Breakdown Tab */}
          <TabPanel>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Title>Tool Usage by Type</Title>
                <Text>Distribution of tool executions by category</Text>
                <DonutChart
                  className="mt-6 h-60"
                  data={toolTypeData}
                  category="count"
                  index="type"
                  valueFormatter={valueFormatter}
                  colors={["indigo", "violet", "fuchsia", "cyan", "emerald", "amber"]}
                />
                <Legend
                  className="mt-3"
                  categories={toolTypeData.map(item => item.type)}
                  colors={["indigo", "violet", "fuchsia", "cyan", "emerald", "amber"]}
                />
              </Card>
              
              <Card>
                <Title>Top 5 Most Used Tools</Title>
                <Text>Tools with the highest execution count</Text>
                <BarChart
                  className="mt-6 h-60"
                  data={topToolsData}
                  index="name"
                  categories={["count"]}
                  colors={["blue"]}
                  valueFormatter={valueFormatter}
                  layout="vertical"
                  yAxisWidth={150}
                />
              </Card>
              
              <Card>
                <Title>Success/Failure Rates by Tool Type</Title>
                <Text>Percentage of successful and failed executions</Text>
                <BarChart
                  className="mt-6 h-60"
                  data={successRateData}
                  index="type"
                  categories={["success", "failure"]}
                  colors={["emerald", "rose"]}
                  valueFormatter={percentFormatter}
                  stack={true}
                />
              </Card>
              
              <Card>
                <Title>Status Distribution</Title>
                <Text>Tool executions by status</Text>
                <DonutChart
                  className="mt-6 h-60"
                  data={summary ? [
                    { status: 'Success', value: summary.by_status.success || 0 },
                    { status: 'Error', value: summary.by_status.error || 0 },
                    { status: 'Timeout', value: summary.by_status.timeout || 0 },
                    { status: 'Pending', value: summary.by_status.pending || 0 },
                    { status: 'Canceled', value: summary.by_status.canceled || 0 }
                  ] : []}
                  category="value"
                  index="status"
                  valueFormatter={valueFormatter}
                  colors={["emerald", "rose", "amber", "blue", "gray"]}
                />
                <Legend
                  className="mt-3"
                  categories={["Success", "Error", "Timeout", "Pending", "Canceled"]}
                  colors={["emerald", "rose", "amber", "blue", "gray"]}
                />
              </Card>
            </div>
          </TabPanel>
          
          {/* Performance Tab */}
          <TabPanel>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Title>Average Duration by Tool Type</Title>
                <Text>Average execution time in milliseconds</Text>
                <BarChart
                  className="mt-6 h-60"
                  data={durationData}
                  index="type"
                  categories={["duration"]}
                  colors={["amber"]}
                  valueFormatter={durationFormatter}
                />
              </Card>
              
              <Card>
                <Title>Slowest Tools</Title>
                <Text>Tools with the highest average execution time</Text>
                <BarChart
                  className="mt-6 h-60"
                  data={summary?.top_tools
                    .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
                    .slice(0, 5)
                    .map(tool => ({
                      name: tool.name,
                      duration: tool.avg_duration_ms
                    })) || []}
                  index="name"
                  categories={["duration"]}
                  colors={["orange"]}
                  valueFormatter={durationFormatter}
                  layout="vertical"
                  yAxisWidth={150}
                />
              </Card>
            </div>
          </TabPanel>
          
          {/* Timeline Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Tool Executions Over Time</Title>
              <Text>Distribution of tool usage over the selected time period</Text>
              
              <AreaChart
                className="mt-6 h-72"
                data={timelineData}
                index="time"
                categories={['Total', ...Object.keys(timelineData[0] || {}).filter(key => key !== 'time' && key !== 'Total')]}
                colors={["blue", "indigo", "violet", "purple"]}
                valueFormatter={valueFormatter}
                showLegend={true}
                showGridLines={false}
                showAnimation={true}
              />
            </Card>
          </TabPanel>
          
          {/* By Agent Tab */}
          <TabPanel>
            <div className="mt-4 grid grid-cols-1 gap-6">
              {agentBreakdown.map((agent) => (
                <Card key={agent.agent_id} className="p-4">
                  <Flex justifyContent="between" alignItems="center">
                    <div>
                      <Title>{agent.agent_name}</Title>
                      <Text>{agent.total_executions.toLocaleString()} executions, {(agent.success_rate * 100).toFixed(1)}% success rate</Text>
                    </div>
                    <Text>{formatDuration(agent.avg_duration_ms)} avg. duration</Text>
                  </Flex>
                  
                  <div className="mt-4">
                    <Text className="font-medium">Top Tools</Text>
                    <BarChart
                      className="mt-2 h-32"
                      data={agent.top_tools.map(tool => ({
                        name: tool.name,
                        count: tool.count,
                        success_rate: tool.success_rate * 100
                      }))}
                      index="name"
                      categories={["count"]}
                      colors={["indigo"]}
                      valueFormatter={valueFormatter}
                      layout="vertical"
                      yAxisWidth={120}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 