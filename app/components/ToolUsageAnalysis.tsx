'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Flex,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Select,
  SelectItem,
  Text,
  Legend,
  AreaChart,
  Card,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  BarChart,
  Color,
  Button
} from '@tremor/react'
import { 
  WrenchScrewdriverIcon, 
  ClockIcon, 
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { METRICS } from '../lib/api-endpoints'
import DashboardCard from './DashboardCard'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import { colors } from './DesignSystem'

// Types
type ToolInteraction = {
  id: number;
  event_id: number;
  tool_name: string;
  interaction_type: string;
  status: string;
  status_code: number;
  parameters: any;
  result: any;
  request_timestamp: string;
  response_timestamp: string;
  duration_ms: number;
  framework_name: string;
  agent_id: string;
};

type ToolInteractionsResponse = {
  total: number;
  page: number;
  page_size: number;
  from_time: string;
  to_time: string;
  interactions: ToolInteraction[];
};

type ToolUsageData = {
  tool_name: string;
  count: number;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  success_count: number;
  error_count: number;
  is_internal: boolean;
};

type TimeSeriesPoint = {
  timestamp: string;
  value: number;
  tool_name?: string;
};

export type ToolUsageAnalysisProps = {
  className?: string;
  timeRange?: string;
};

// Utility function
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Add an integer formatter function
const integerFormatter = (value: number) => Math.round(value).toString();

// Create a y-axis integer formatter
const yAxisIntFormatter = (value: number) => Math.round(value).toString();

// Function to calculate integer tick values for y-axis
const getIntegerTickValues = (data: any[], category: string): number[] => {
  // Find the maximum value in the dataset
  const maxValue = Math.max(...data.map(item => item[category] || 0));
  
  // If max value is 0 or undefined, return default ticks
  if (!maxValue) return [0, 1, 2];
  
  // Round up to nearest integer
  const roundedMax = Math.ceil(maxValue);
  
  // Create appropriate integer tick values
  const tickCount = 5; // Adjust this for more or fewer ticks
  const step = Math.max(1, Math.ceil(roundedMax / tickCount));
  
  const ticks = [];
  for (let i = 0; i <= roundedMax; i += step) {
    ticks.push(i);
  }
  
  // Make sure the max value is included
  if (ticks[ticks.length - 1] < roundedMax) {
    ticks.push(roundedMax);
  }
  
  return ticks;
};

// Update number formatters for y-axis
const yAxisFormatter = (value: number) => Math.round(value).toString();

// Create a custom formatter that only returns numbers
const numberOnlyFormatter = (value: number) => Math.round(value).toString();

// Update the trendValueFormatter to only show numbers on the y-axis
const trendValueFormatter = (value: number) => Math.round(value).toString();

// Create a custom number formatter that returns simple integers
const cleanIntegerFormatter = (value: number) => `${Math.round(value)}`;

// Define types for the CustomTrendChart component
type CustomTrendChartProps = {
  data: any[];
  categories: string[];
  colors: Color[];
  isSingleView?: boolean;
};

// Updated CustomTrendChart for a cleaner display
function CustomTrendChart({ data, categories, colors, isSingleView = true }: CustomTrendChartProps) {
  // Calculate max value to ensure good integer scale
  const maxValue = isSingleView 
    ? Math.max(...data.map(d => d["Tool Executions"] || 0))
    : Math.max(...data.map(d => 
        Math.max(...categories.map(cat => d[cat] || 0))
      ));
  
  // Round up to nearest integer and add a bit of padding
  const roundedMax = Math.ceil(maxValue) + 1;
  
  return (
    <Card className="mt-4">
      <Title className="text-center mb-2">Tool Executions Over Time</Title>
      <AreaChart
        className="h-72"
        data={data}
        index="date"
        categories={categories}
        colors={colors}
        valueFormatter={(value) => `${Math.round(value).toLocaleString()} executions`}
        showLegend={!isSingleView}
        showGradient={true}
        yAxisWidth={40}
        minValue={0}
        maxValue={roundedMax}
        autoMinValue={false}
        showYAxis={true}
        showXAxis={true}
        startEndOnly={data.length > 10}
        showAnimation={true}
        curveType="natural"
      />
    </Card>
  );
}

export default function ToolUsageAnalysis({ className = '', timeRange = '30d' }: ToolUsageAnalysisProps) {
  const [toolInteractions, setToolInteractions] = useState<ToolInteraction[]>([]);
  const [toolUsageData, setToolUsageData] = useState<ToolUsageData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filters
  const [toolType, setToolType] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // For tool trends
  const [selectedView, setSelectedView] = useState<'aggregated' | 'byTool'>('aggregated');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  useEffect(() => {
    fetchToolData();
  }, [timeRange, toolType, performanceFilter, statusFilter]);

  const fetchToolData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tool interactions from API
      const params = buildQueryParams({ 
        time_range: timeRange,
        interaction_type: 'execution',
        page_size: 100,
        ...(statusFilter !== 'all' && { tool_status: statusFilter })
      });
      
      const data = await fetchAPI<ToolInteractionsResponse>(`${METRICS.TOOL_INTERACTIONS}${params}`);
      
      if (data && data.interactions && data.interactions.length > 0) {
        setToolInteractions(data.interactions);
        
        // Process tool usage data
        const toolData = processToolData(data.interactions);
        
        // Apply filters
        let filteredData = toolData;
        
        if (toolType !== 'all') {
          const isInternal = toolType === 'internal';
          filteredData = filteredData.filter(tool => tool.is_internal === isInternal);
        }
        
        if (performanceFilter !== 'all') {
          const thresholds = {
            'slow': 1000, // tools taking more than 1s
            'medium': 500, // tools taking 500ms-1s
            'fast': 0 // tools taking less than 500ms
          };
          
          const threshold = thresholds[performanceFilter as keyof typeof thresholds];
          const maxThreshold = performanceFilter === 'fast' ? 500 : 
                              performanceFilter === 'medium' ? 1000 : Number.MAX_SAFE_INTEGER;
          
          filteredData = filteredData.filter(tool => 
            tool.avg_duration_ms >= threshold && 
            tool.avg_duration_ms < maxThreshold
          );
        }
        
        setToolUsageData(filteredData);
        
        // Process time series data
        const timeSeriesPoints = processTimeSeriesData(data.interactions);
        setTimeSeriesData(timeSeriesPoints);
      } else {
        setToolUsageData([]);
        setTimeSeriesData([]);
        setError('No tool usage data available for the selected period');
      }
    } catch (error) {
      console.error('Error fetching tool data:', error);
      setError('Failed to fetch tool usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const processToolData = (interactions: ToolInteraction[]): ToolUsageData[] => {
    const toolMap = new Map<string, {
      count: number;
      durations: number[];
      success_count: number;
      error_count: number;
      is_internal: boolean;
    }>();
    
    interactions.forEach(interaction => {
      const toolName = interaction.tool_name;
      const duration = interaction.duration_ms;
      const isSuccess = interaction.status === 'success';
      const isInternal = isInternalTool(toolName);
      
      if (!toolMap.has(toolName)) {
        toolMap.set(toolName, {
          count: 0,
          durations: [],
          success_count: 0,
          error_count: 0,
          is_internal: isInternal
        });
      }
      
      const tool = toolMap.get(toolName)!;
      tool.count += 1;
      tool.durations.push(duration);
      
      if (isSuccess) {
        tool.success_count += 1;
      } else {
        tool.error_count += 1;
      }
    });
    
    return Array.from(toolMap.entries()).map(([toolName, data]) => {
      const avgDuration = data.durations.reduce((sum, val) => sum + val, 0) / data.count;
      const minDuration = Math.min(...data.durations);
      const maxDuration = Math.max(...data.durations);
      
      return {
        tool_name: toolName,
        count: data.count,
        avg_duration_ms: avgDuration,
        min_duration_ms: minDuration,
        max_duration_ms: maxDuration,
        success_count: data.success_count,
        error_count: data.error_count,
        is_internal: data.is_internal
      };
    }).sort((a, b) => b.count - a.count);
  };

  const processTimeSeriesData = (interactions: ToolInteraction[]): TimeSeriesPoint[] => {
    // Group interactions by hour
    const timeGroups = new Map<string, Map<string, number>>();
    
    interactions.forEach(interaction => {
      const date = new Date(interaction.request_timestamp);
      const hourKey = date.toISOString().substring(0, 13) + ':00:00Z';
      const toolName = interaction.tool_name;
      
      if (!timeGroups.has(hourKey)) {
        timeGroups.set(hourKey, new Map<string, number>());
      }
      
      const toolCounts = timeGroups.get(hourKey)!;
      toolCounts.set(toolName, (toolCounts.get(toolName) || 0) + 1);
    });
    
    // Convert to time series points
    const timeSeriesPoints: TimeSeriesPoint[] = [];
    
    timeGroups.forEach((toolCounts, timestamp) => {
      toolCounts.forEach((count, toolName) => {
        timeSeriesPoints.push({
          timestamp,
          value: count,
          tool_name: toolName
        });
      });
    });
    
    return timeSeriesPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const isInternalTool = (toolName: string): boolean => {
    // Centralized configuration for internal tools classification
    const internalTools = [
      'file_search', 'read_file', 'list_dir', 'grep_search', 'run_terminal_cmd',
      'edit_file', 'delete_file', 'reapply', 'codebase_search'
    ];
    
    // Alternative: detect by naming convention 
    const internalPrefixes = ['file_', 'code_', 'system_'];
    const isInternalByPrefix = internalPrefixes.some(prefix => toolName.startsWith(prefix));
    
    return internalTools.includes(toolName) || isInternalByPrefix;
  };

  const getPerformanceCategory = (durationMs: number): 'fast' | 'medium' | 'slow' | 'very_slow' => {
    if (durationMs < 500) return 'fast';
    if (durationMs < 1000) return 'medium';
    if (durationMs < 2000) return 'slow';
    return 'very_slow';
  };

  const getFilteredData = () => {
    const performanceThresholds = {
      'slow': 1000, // tools taking more than 1s
      'medium': 500, // tools taking 500ms-1s
      'fast': 0, // tools taking less than 500ms
      'very_slow': 2000 // tools taking more than 2s
    };

    // Get slow tools with more granular categorization
    const categorizedSlowTools = toolUsageData
      .filter(tool => tool.avg_duration_ms > performanceThresholds.slow)
      .map(tool => ({
        ...tool,
        performance_category: getPerformanceCategory(tool.avg_duration_ms)
      }))
      .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);

    return {
      toolUsageData,
      timeSeriesData,
      slowTools: categorizedSlowTools
    };
  };

  const filteredData = getFilteredData();
  
  // Get all unique tool names for tool trends
  const toolNames = useMemo(() => {
    const tools = Array.from(new Set(timeSeriesData.map(item => item.tool_name).filter(Boolean)));
    return tools.sort() as string[];
  }, [timeSeriesData]);
  
  // Prepare trend chart data
  const toolTrendData = useMemo(() => {
    if (selectedView !== 'byTool' || selectedTools.length === 0) return [];
    
    // Group by timestamp
    const groupedByTime = new Map<string, Map<string, number>>();
    
    timeSeriesData.forEach(item => {
      if (!item.tool_name || !selectedTools.includes(item.tool_name)) return;
      
      if (!groupedByTime.has(item.timestamp)) {
        groupedByTime.set(item.timestamp, new Map());
      }
      
      const timeGroup = groupedByTime.get(item.timestamp)!;
      timeGroup.set(item.tool_name, (timeGroup.get(item.tool_name) || 0) + item.value);
    });
    
    // Convert to chart-friendly format
    const chartData: any[] = [];
    
    groupedByTime.forEach((toolValues, timestamp) => {
      const entry: any = { date: formatTimestamp(timestamp, timeRange) };
      
      selectedTools.forEach(tool => {
        entry[tool] = toolValues.get(tool) || 0;
      });
      
      chartData.push(entry);
    });
    
    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timeSeriesData, selectedView, selectedTools, timeRange]);
  
  // For the aggregated view, sum all tool executions at each timestamp
  const aggregatedTrendData = useMemo(() => {
    if (selectedView !== 'aggregated') return [];
    
    const groupedByTime = new Map<string, number>();
    
    timeSeriesData.forEach(item => {
      groupedByTime.set(item.timestamp, (groupedByTime.get(item.timestamp) || 0) + item.value);
    });
    
    return Array.from(groupedByTime.entries())
      .map(([timestamp, value]) => ({
        date: formatTimestamp(timestamp, timeRange),
        "Tool Executions": value
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timeSeriesData, selectedView, timeRange]);
  
  // Format timestamp based on time range
  function formatTimestamp(timestamp: string, range: string): string {
    const date = new Date(timestamp);
    
    if (range === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7d') {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
  
  // Tool colors for the by-tool view
  const toolColors: Record<string, Color> = {};
  const colorOptions: Color[] = ['indigo', 'violet', 'emerald', 'amber', 'rose', 'blue', 'cyan', 'fuchsia'];
  
  toolNames.forEach((tool, index) => {
    toolColors[tool] = colorOptions[index % colorOptions.length];
  });

  // Prepare histogram data with simplified structure
  const histogramData = useMemo(() => {
    return filteredData.toolUsageData
      .sort((a, b) => b.count - a.count)
      .slice(0, 15) // Show up to 15 tools for better visibility
      .map(tool => ({
        tool_name: tool.tool_name.replace(/^(internal_|external_)/, ''), // Clean up tool names
        count: tool.count,
        is_internal: tool.is_internal
      }));
  }, [filteredData.toolUsageData]);

  if (isLoading) return <LoadingState className={className} />;
  
  if (error) return <ErrorMessage message={error} className={className} />;
  
  if (toolUsageData.length === 0) {
    return (
      <EmptyState 
        title="No tool usage data available" 
        description="There is no tool usage data for the selected filters or time period."
        icon={<WrenchScrewdriverIcon className="h-10 w-10 text-gray-400" />}
        className={className}
        actionText="Reset Filters"
        onAction={() => {
          setToolType('all');
          setPerformanceFilter('all');
          setStatusFilter('all');
        }}
      />
    );
  }
  
  return (
    <div className={className}>
      <DashboardCard
        title="Tool Usage Analysis"
        description="Monitor and analyze tool usage patterns and performance"
        icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
      >
        <Flex className="mb-4 flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Select
            placeholder="Filter by tool type"
            value={toolType}
            onValueChange={setToolType}
          >
            <SelectItem value="all">All Tools</SelectItem>
            <SelectItem value="internal">Internal Tools</SelectItem>
            <SelectItem value="external">External Tools</SelectItem>
          </Select>
          
          <Select
            placeholder="Filter by performance"
            value={performanceFilter}
            onValueChange={setPerformanceFilter}
          >
            <SelectItem value="all">All Performance</SelectItem>
            <SelectItem value="fast">Fast (&lt; 500ms)</SelectItem>
            <SelectItem value="medium">Medium (500ms-1s)</SelectItem>
            <SelectItem value="slow">Slow (&gt;1s)</SelectItem>
            <SelectItem value="very_slow">Very Slow (&gt;2s)</SelectItem>
          </Select>
          
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </Select>
          
          {(toolType !== 'all' || performanceFilter !== 'all' || statusFilter !== 'all') && (
            <Button 
              variant="secondary" 
              size="xs"
              icon={ArrowPathIcon}
              onClick={() => {
                setToolType('all');
                setPerformanceFilter('all');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </Button>
          )}
        </Flex>

        <TabGroup index={activeTab} onIndexChange={setActiveTab}>
          <TabList className="mb-4">
            <Tab icon={ChartBarIcon}>Tool Usage</Tab>
            <Tab icon={ClockIcon}>Slow Tools</Tab>
            <Tab icon={ChartBarIcon}>Execution Trends</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {/* Tool Usage Histogram */}
              <Flex className="mb-4 items-center justify-between">
                <Text>Tool execution frequency by tool name</Text>
                <Legend
                  categories={['Internal Tools', 'External Tools']}
                  colors={['indigo', 'violet']}
                />
              </Flex>
              
              {histogramData.length > 0 ? (
                <div className="mt-8 px-1">
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
                        const maxCount = Math.max(...histogramData.map(t => t.count));
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
                    {histogramData.map((tool, index) => {
                      const maxCount = Math.max(...histogramData.map(t => t.count));
                      const percentage = (tool.count / maxCount) * 100;
                      
                      return (
                        <div key={tool.tool_name} className="group relative flex items-center space-x-3">
                          <div className="w-40 text-sm truncate font-medium" title={tool.tool_name}>
                            {tool.tool_name}
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
                              className={`h-full rounded-lg transition-all duration-500 ease-out ${tool.is_internal ? 'bg-indigo-500' : 'bg-violet-500'}`}
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
                              <div className="font-medium">{tool.tool_name}</div>
                              <div className="mt-1">{tool.count.toLocaleString()} executions</div>
                              <div className="mt-0.5">Type: {tool.is_internal ? 'Internal' : 'External'}</div>
                              {/* Arrow */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">No tool usage data available</p>
                </div>
              )}
            </TabPanel>
            
            <TabPanel>
              {/* Slow Tools Table */}
              {filteredData.slowTools.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Tool Name</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Performance</TableHeaderCell>
                      <TableHeaderCell>Avg Duration</TableHeaderCell>
                      <TableHeaderCell>Max Duration</TableHeaderCell>
                      <TableHeaderCell>Success Rate</TableHeaderCell>
                      <TableHeaderCell>Executions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.slowTools.map((tool) => {
                      const successRate = tool.count > 0 
                        ? Math.round((tool.success_count / tool.count) * 100) 
                        : 0;
                      
                      // Get color based on performance category
                      const performanceColor = 
                        tool.performance_category === 'very_slow' ? 'red' :
                        tool.performance_category === 'slow' ? 'amber' :
                        tool.performance_category === 'medium' ? 'yellow' : 'emerald';
                      
                      // Get badge text for performance category
                      const performanceText = 
                        tool.performance_category === 'very_slow' ? 'Very Slow' :
                        tool.performance_category === 'slow' ? 'Slow' :
                        tool.performance_category === 'medium' ? 'Medium' : 'Fast';
                      
                      return (
                        <TableRow key={tool.tool_name}>
                          <TableCell>{tool.tool_name}</TableCell>
                          <TableCell>
                            <Badge color={tool.is_internal ? 'indigo' : 'violet'} size="xs">
                              {tool.is_internal ? 'Internal' : 'External'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge color={performanceColor} size="xs">
                              {performanceText}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Text color={performanceColor}>
                              {formatDuration(tool.avg_duration_ms)}
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text color={tool.max_duration_ms > 5000 ? 'red' : tool.max_duration_ms > 2000 ? 'amber' : 'emerald'}>
                              {formatDuration(tool.max_duration_ms)}
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Flex alignItems="center" justifyContent="start">
                              <div 
                                className="h-2 rounded-full bg-neutral-200 w-24 mr-2"
                                role="progressbar"
                                aria-valuenow={successRate}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className={`h-2 rounded-full ${
                                    successRate < 70 
                                      ? 'bg-red-500' 
                                      : successRate < 90 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                              <Text>{successRate}%</Text>
                            </Flex>
                          </TableCell>
                          <TableCell>{tool.count.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <Text>No slow tools detected</Text>
                  {(toolType !== 'all' || performanceFilter !== 'all' || statusFilter !== 'all') && (
                    <Button 
                      className="mt-4" 
                      variant="secondary" 
                      size="xs"
                      onClick={() => {
                        setToolType('all');
                        setPerformanceFilter('all');
                        setStatusFilter('all');
                      }}
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              )}
            </TabPanel>
            
            <TabPanel>
              {/* Execution Trends with improved styling */}
              <Flex className="justify-between mb-4 items-center flex-col sm:flex-row space-y-2 sm:space-y-0">
                <Flex className="gap-2">
                  <Button
                    variant={selectedView === 'aggregated' ? 'primary' : 'secondary'}
                    icon={ChartBarIcon}
                    onClick={() => setSelectedView('aggregated')}
                    size="xs"
                    className="w-32"
                  >
                    Aggregated
                  </Button>
                  <Button
                    variant={selectedView === 'byTool' ? 'primary' : 'secondary'}
                    icon={ClockIcon}
                    onClick={() => setSelectedView('byTool')}
                    size="xs"
                    className="w-32"
                  >
                    By Tool
                  </Button>
                </Flex>
                
                {selectedView === 'byTool' && (
                  <Select
                    placeholder="Select a tool to display"
                    value={selectedTools.length > 0 ? selectedTools[0] : ''}
                    onValueChange={(value) => setSelectedTools(value ? [value] : [])}
                    className="min-w-[200px] sm:w-auto"
                    enableClear={true}
                  >
                    {toolNames.map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </Flex>
              
              {selectedView === 'aggregated' ? (
                <CustomTrendChart 
                  data={aggregatedTrendData} 
                  categories={["Tool Executions"]} 
                  colors={["indigo"]} 
                  isSingleView={true}
                />
              ) : (
                <>
                  {selectedTools.length === 0 ? (
                    <div className="h-72 flex items-center justify-center">
                      <Text className="text-gray-500">Select a tool to display trend</Text>
                    </div>
                  ) : (
                    <CustomTrendChart 
                      data={toolTrendData} 
                      categories={selectedTools} 
                      colors={selectedTools.map((_, index) => colorOptions[index % colorOptions.length])} 
                      isSingleView={false}
                    />
                  )}
                </>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </DashboardCard>
    </div>
  );
} 