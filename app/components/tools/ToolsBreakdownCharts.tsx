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
import { ModelDistributionChart } from '../ModelDistributionChart';

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
  
  // Format data for ModelDistributionChart
  const toolTypeChartData = toolTypeData.map(item => ({
    name: item.type,
    count: item.count
  }));
  
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
  
  // Define custom colors for status types
  const statusColorMap: Record<string, string> = {
    'Success': '#22c55e', // green
    'Error': '#ef4444',   // red
    'Pending': '#eab308', // yellow
    'Timeout': '#3b82f6', // blue
    'Canceled': '#6b7280' // gray
  };
  
  return (
    <div className="space-y-6">
      <TabGroup>
        <TabList className="mt-8">
          <Tab>Usage Breakdown</Tab>
          <Tab>Performance</Tab>
          <Tab>Timeline</Tab>
        </TabList>
        
        <TabPanels>
          {/* Usage Breakdown Tab */}
          <TabPanel>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Title>Tool Usage by Type</Title>
                <Text>Distribution of tool executions by category</Text>
                <div className="mt-6 flex justify-center">
                  <ModelDistributionChart
                    data={toolTypeChartData}
                    valueFormatter={valueFormatter}
                    className="w-full"
                  />
                </div>
              </Card>
              
              <Card>
                <Title>Status Distribution</Title>
                <Text>Tool executions by status</Text>
                <div className="mt-6 flex justify-center">
                  <ModelDistributionChart
                    data={summary ? [
                      { name: 'Success', count: summary.by_status.success || 0 },
                      { name: 'Error', count: summary.by_status.error || 0 },
                      { name: 'Timeout', count: summary.by_status.timeout || 0 },
                      { name: 'Pending', count: summary.by_status.pending || 0 },
                      { name: 'Canceled', count: summary.by_status.canceled || 0 }
                    ].filter(item => item.count > 0) : []}
                    valueFormatter={valueFormatter}
                    className="w-full"
                    customColors={statusColorMap}
                  />
                </div>
              </Card>
            </div>
            
            <div className="mt-6">
              <Card>
                <Title>Top 5 Most Used Tools</Title>
                <Text>Tools with the highest execution count</Text>
                <div className="mt-4 px-1">
                  {/* Chart heading */}
                  <div className="flex items-center space-x-3 font-medium text-sm text-gray-700 mb-6">
                    <div className="w-40">Tool Name</div>
                    <div className="flex-1">Executions</div>
                    <div className="w-24 text-right">Count</div>
                  </div>

                  {/* X-axis guides with light grid lines */}
                  <div className="relative mb-2">
                    <div className="absolute bottom-0 left-40 right-24 h-10 flex justify-between">
                      {(() => {
                        const maxCount = Math.max(...topToolsData.map(t => t.count));
                        const steps = [0, Math.ceil(maxCount / 4), Math.ceil(maxCount / 2), Math.ceil(3 * maxCount / 4), maxCount];
                        return steps.map((count, i) => {
                          const position = i / (steps.length - 1) * 100;
                          return (
                            <div key={i} className="absolute h-full bottom-0 flex flex-col" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                              <div className="flex-1 border-l border-gray-200 w-0"></div>
                              <div className="text-xs text-gray-500 mt-1">
                                {count.toLocaleString()}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  
                  {/* Bars */}
                  <div className="space-y-4 relative">
                    {topToolsData.map((tool, index) => {
                      const maxCount = Math.max(...topToolsData.map(t => t.count));
                      const percentage = (tool.count / maxCount) * 100;
                      
                      return (
                        <div key={tool.name} className="group relative flex items-center space-x-3">
                          <div className="w-40 text-sm truncate font-medium" title={tool.name}>
                            {tool.name}
                          </div>
                          <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                            {/* Grid lines (vertical) */}
                            {[0.25, 0.5, 0.75].map((pos) => (
                              <div 
                                key={pos} 
                                className="absolute top-0 h-full border-l border-gray-200" 
                                style={{ left: `${pos * 100}%` }}
                              ></div>
                            ))}
                            <div 
                              className="h-full rounded-lg transition-all duration-500 ease-out bg-gradient-to-r from-blue-500/80 via-blue-400/60 to-blue-300/40"
                              style={{ width: `${Math.max(1, percentage)}%` }} // Ensure even small values are visible
                            />
                            <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-200" />
                          </div>
                          <div className="w-24 text-sm text-right font-medium">
                            {tool.count.toLocaleString()}
                          </div>
                          
                          {/* Tooltip positioned above the bar */}
                          <div className="absolute top-0 left-0 right-0 -translate-y-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 flex justify-center">
                            <div className="bg-gray-900 text-white p-2 rounded-lg shadow-lg text-xs whitespace-nowrap">
                              <div className="font-medium">{tool.name}</div>
                              <div className="mt-1">{tool.count.toLocaleString()} executions</div>
                              {/* Arrow */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Performance Tab */}
          <TabPanel>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <Title>Average Duration by Tool Type</Title>
                <Text>Average execution time in milliseconds</Text>
                <div className="mt-4 px-1">
                  {/* Chart heading */}
                  <div className="flex items-center space-x-3 font-medium text-sm text-gray-700 mb-6">
                    <div className="w-40">Tool Type</div>
                    <div className="flex-1">Duration</div>
                    <div className="w-24 text-right">Time</div>
                  </div>

                  {/* X-axis guides with light grid lines */}
                  <div className="relative mb-2">
                    <div className="absolute bottom-0 left-40 right-24 h-10 flex justify-between">
                      {(() => {
                        const maxDuration = Math.max(...durationData.map(t => t.duration));
                        const steps = [0, Math.ceil(maxDuration / 4), Math.ceil(maxDuration / 2), Math.ceil(3 * maxDuration / 4), maxDuration];
                        return steps.map((duration, i) => {
                          const position = i / (steps.length - 1) * 100;
                          return (
                            <div key={i} className="absolute h-full bottom-0 flex flex-col" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                              <div className="flex-1 border-l border-gray-200 w-0"></div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDuration(duration)}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  
                  {/* Bars */}
                  <div className="space-y-4 relative">
                    {durationData.map((tool, index) => {
                      const maxDuration = Math.max(...durationData.map(t => t.duration));
                      const percentage = (tool.duration / maxDuration) * 100;
                      
                      return (
                        <div key={tool.type} className="group relative flex items-center space-x-3">
                          <div className="w-40 text-sm truncate font-medium" title={tool.type}>
                            {tool.type}
                          </div>
                          <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                            {/* Grid lines (vertical) */}
                            {[0.25, 0.5, 0.75].map((pos) => (
                              <div 
                                key={pos} 
                                className="absolute top-0 h-full border-l border-gray-200" 
                                style={{ left: `${pos * 100}%` }}
                              ></div>
                            ))}
                            <div 
                              className="h-full rounded-lg transition-all duration-500 ease-out bg-gradient-to-r from-amber-500/80 via-amber-400/60 to-amber-300/40"
                              style={{ width: `${Math.max(1, percentage)}%` }} // Ensure even small values are visible
                            />
                            <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-200" />
                          </div>
                          <div className="w-24 text-sm text-right font-medium">
                            {formatDuration(tool.duration)}
                          </div>
                          
                          {/* Tooltip positioned above the bar */}
                          <div className="absolute top-0 left-0 right-0 -translate-y-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 flex justify-center">
                            <div className="bg-gray-900 text-white p-2 rounded-lg shadow-lg text-xs whitespace-nowrap">
                              <div className="font-medium">{tool.type}</div>
                              <div className="mt-1">Average: {formatDuration(tool.duration)}</div>
                              {/* Arrow */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
              
              <Card>
                <Title>Slowest Tools</Title>
                <Text>Tools with the highest average execution time</Text>
                <div className="mt-4 px-1">
                  {/* Chart heading */}
                  <div className="flex items-center space-x-3 font-medium text-sm text-gray-700 mb-6">
                    <div className="w-40">Tool Name</div>
                    <div className="flex-1">Duration</div>
                    <div className="w-24 text-right">Time</div>
                  </div>

                  {/* X-axis guides with light grid lines */}
                  <div className="relative mb-2">
                    <div className="absolute bottom-0 left-40 right-24 h-10 flex justify-between">
                      {(() => {
                        const slowToolsData = summary?.top_tools
                          .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
                          .slice(0, 5)
                          .map(tool => ({
                            name: tool.name,
                            duration: tool.avg_duration_ms
                          })) || [];
                          
                        const maxDuration = Math.max(...slowToolsData.map(t => t.duration));
                        const steps = [0, Math.ceil(maxDuration / 4), Math.ceil(maxDuration / 2), Math.ceil(3 * maxDuration / 4), maxDuration];
                        return steps.map((duration, i) => {
                          const position = i / (steps.length - 1) * 100;
                          return (
                            <div key={i} className="absolute h-full bottom-0 flex flex-col" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                              <div className="flex-1 border-l border-gray-200 w-0"></div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDuration(duration)}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  
                  {/* Bars */}
                  <div className="space-y-4 relative">
                    {(summary?.top_tools
                      .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
                      .slice(0, 5)
                      .map(tool => ({
                        name: tool.name,
                        duration: tool.avg_duration_ms
                      })) || []).map((tool, index) => {
                        const maxDuration = Math.max(...(summary?.top_tools || [])
                          .map(t => t.avg_duration_ms));
                        const percentage = (tool.duration / maxDuration) * 100;
                        
                        return (
                          <div key={tool.name} className="group relative flex items-center space-x-3">
                            <div className="w-40 text-sm truncate font-medium" title={tool.name}>
                              {tool.name}
                            </div>
                            <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                              {/* Grid lines (vertical) */}
                              {[0.25, 0.5, 0.75].map((pos) => (
                                <div 
                                  key={pos} 
                                  className="absolute top-0 h-full border-l border-gray-200" 
                                  style={{ left: `${pos * 100}%` }}
                                ></div>
                              ))}
                              <div 
                                className="h-full rounded-lg transition-all duration-500 ease-out bg-gradient-to-r from-orange-500/80 via-orange-400/60 to-orange-300/40"
                                style={{ width: `${Math.max(1, percentage)}%` }} // Ensure even small values are visible
                              />
                              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-200" />
                            </div>
                            <div className="w-24 text-sm text-right font-medium">
                              {formatDuration(tool.duration)}
                            </div>
                            
                            {/* Tooltip positioned above the bar */}
                            <div className="absolute top-0 left-0 right-0 -translate-y-14 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 flex justify-center">
                              <div className="bg-gray-900 text-white p-2 rounded-lg shadow-lg text-xs whitespace-nowrap">
                                <div className="font-medium">{tool.name}</div>
                                <div className="mt-1">Average: {formatDuration(tool.duration)}</div>
                                {/* Arrow */}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
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
        </TabPanels>
      </TabGroup>
    </div>
  );
} 