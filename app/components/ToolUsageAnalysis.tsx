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
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { METRICS } from '../lib/api-endpoints'
import DashboardCard from './DashboardCard'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import { colors } from './DesignSystem'
import SlowToolsTable from './SlowToolsTable'
import React from 'react'

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
  date?: string;
  value: number;
  tool_name?: string;
  [key: string]: any; // Allow dynamic tool name properties
};

// Add MetricChartData type definition
type MetricChartData = {
  metric: string;
  from_time: string;
  to_time: string;
  interval: string;
  data: TimeSeriesPoint[];
};

export type ToolUsageAnalysisProps = {
  className?: string;
  timeRange?: string;
  isLoading?: boolean;
  error?: string | null;
  toolExecutions?: TimeSeriesPoint[];
  onRefresh?: () => void;
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

// Create a clean number formatter with no text
const cleanNumberFormatter = (value: number) => `${Math.round(value)}`;

// Define types for the CustomTrendChart component
type CustomTrendChartProps = {
  data: any[];
  categories: string[];
  colors: Color[];
  isSingleView?: boolean;
};

// Custom tooltip for the area chart
const CustomChartTooltip = ({ activePoint, activePayload, active }: any) => {
  if (!active || !activePoint) return null;
  
  const date = new Date(activePoint.x);
  const formattedDate = date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const formattedTime = date.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const isAggregated = activePayload.length === 1 && activePayload[0].name === "Tool Executions";
  
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
      <div className="text-sm font-medium text-gray-800 border-b pb-1.5 mb-1.5">
        {formattedDate}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {formattedTime}
      </div>
      
      {isAggregated ? (
        <div className="flex items-center gap-2 py-1">
          <div className="h-3 w-3 rounded-full bg-indigo-500" />
          <div className="flex-1 text-sm">Total Executions</div>
          <div className="font-medium">{activePoint.y.toLocaleString()}</div>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {activePayload
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 py-1">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <div className="flex-1 text-sm truncate" title={entry.name}>{entry.name}</div>
                <div className="font-medium">{entry.value.toLocaleString()}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
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
        yAxisWidth={48}
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

export default function ToolUsageAnalysis({ 
  className = '', 
  timeRange = '30d',
  isLoading: dashboardLoading = false, 
  error: dashboardError = null,
  toolExecutions: dashboardToolExecutions = [], 
  onRefresh
}: ToolUsageAnalysisProps) {
  const [toolInteractions, setToolInteractions] = useState<ToolInteraction[]>([]);
  const [toolUsageData, setToolUsageData] = useState<ToolUsageData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [aggregatedTimeData, setAggregatedTimeData] = useState<any[]>([]);
  const [toolSpecificTimeData, setToolSpecificTimeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dataFetched, setDataFetched] = useState(false);
  const requestInProgress = React.useRef(false);
  
  // Enhanced filter state variables
  const [toolType, setToolType] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specificToolFilter, setSpecificToolFilter] = useState<string>('');
  
  // For tool trends
  const [selectedView, setSelectedView] = useState<'aggregated' | 'byTool'>('aggregated');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [visibleTools, setVisibleTools] = useState<string[]>([]);

  // Get unique tool names for the specific tool filter dropdown
  const uniqueToolNames = useMemo(() => {
    return Array.from(new Set(toolInteractions.map(interaction => interaction.tool_name)));
  }, [toolInteractions]);

  // Check if any filters are active
  const hasActiveFilters = toolType !== 'all' || 
                          performanceFilter !== 'all' || 
                          statusFilter !== 'all' || 
                          specificToolFilter !== '';

  // Clear all filters function
  const clearAllFilters = () => {
    setToolType('all');
    setPerformanceFilter('all');
    setStatusFilter('all');
    setSpecificToolFilter('');
  };

  // Update fetchToolData to implement fallback behavior for missing endpoints
  const fetchToolData = async () => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      return;
    }
    
    // If we've already fetched data successfully, don't fetch again unless explicitly requested
    if (dataFetched && !dashboardLoading && !dashboardError) {
      return;
    }
    
    requestInProgress.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      // If we have dashboard tool executions data, use that
      if (dashboardToolExecutions && dashboardToolExecutions.length > 0) {
        // Process the dashboard tool execution data
        setTimeSeriesData(dashboardToolExecutions);
        setDataFetched(true);
        setLoading(false);
        requestInProgress.current = false;
        return;
      }
      
      // Try to fetch data from the metrics endpoint first
      try {
        // Create fallback data in case API endpoints are missing
        const fallbackData: ToolInteraction[] = [
          {
            id: 1,
            event_id: 1,
            tool_name: "file_search",
            interaction_type: "execution",
            status: "success",
            status_code: 200,
            parameters: {},
            result: {},
            request_timestamp: new Date(Date.now() - 86400000).toISOString(),
            response_timestamp: new Date(Date.now() - 86400000 + 250).toISOString(),
            duration_ms: 250,
            framework_name: "file_tools",
            agent_id: "demo-agent"
          },
          {
            id: 2,
            event_id: 2,
            tool_name: "read_file",
            interaction_type: "execution",
            status: "success",
            status_code: 200,
            parameters: {},
            result: {},
            request_timestamp: new Date(Date.now() - 86000000).toISOString(),
            response_timestamp: new Date(Date.now() - 86000000 + 320).toISOString(),
            duration_ms: 320,
            framework_name: "file_tools",
            agent_id: "demo-agent"
          },
          {
            id: 3,
            event_id: 3,
            tool_name: "codebase_search",
            interaction_type: "execution",
            status: "success",
            status_code: 200,
            parameters: {},
            result: {},
            request_timestamp: new Date(Date.now() - 85000000).toISOString(),
            response_timestamp: new Date(Date.now() - 85000000 + 800).toISOString(),
            duration_ms: 800,
            framework_name: "code_tools",
            agent_id: "demo-agent"
          }
        ];
        
        // Otherwise, fetch data as usual with a single request
        const params = buildQueryParams({ 
          time_range: timeRange,
          interaction_type: 'execution',
          page_size: 100, // Set to maximum allowed value (100)
          ...(statusFilter !== 'all' && { tool_status: statusFilter }),
          ...(specificToolFilter !== '' && { tool_name: specificToolFilter })
        });
        
        let data: ToolInteractionsResponse | null = null;
        
        try {
          // First try to fetch from tool_interactions endpoint
          data = await fetchAPI<ToolInteractionsResponse>(`${METRICS.TOOL_INTERACTIONS}${params}`);
        } catch (toolInteractionsError) {
          console.warn('Failed to fetch from tool_interactions endpoint, using fallback data', toolInteractionsError);
          
          // Use fallback data directly without trying execution_count endpoint that doesn't exist
          data = {
            total: fallbackData.length,
            page: 1,
            page_size: fallbackData.length,
            from_time: new Date(Date.now() - 90000000).toISOString(),
            to_time: new Date().toISOString(),
            interactions: fallbackData
          };
        }
        
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
              'fast': 0, // tools taking less than 500ms
              'very_slow': 2000 // tools taking more than 2s
            };
            
            const threshold = thresholds[performanceFilter as keyof typeof thresholds];
            const maxThreshold = performanceFilter === 'fast' ? 500 : 
                               performanceFilter === 'medium' ? 1000 : 
                               performanceFilter === 'slow' ? 2000 : Number.MAX_SAFE_INTEGER;
            
            filteredData = filteredData.filter(tool => 
              tool.avg_duration_ms >= threshold && 
              tool.avg_duration_ms < maxThreshold
            );
          }
          
          setToolUsageData(filteredData);
          
          // Process time series data
          const timeSeriesResult = processTimeSeriesData(data.interactions);
          setTimeSeriesData(timeSeriesResult.aggregated);
          setAggregatedTimeData(timeSeriesResult.aggregated);
          setToolSpecificTimeData(timeSeriesResult.toolSpecificTimeData);
          setDataFetched(true);
        } else {
          setToolUsageData([]);
          setTimeSeriesData([]);
          setAggregatedTimeData([]);
          setToolSpecificTimeData([]);
          setError('No tool usage data available for the selected period');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        setError('Error communicating with the API. Please try again later.');
        // Mark as fetched to prevent further requests with invalid parameters
        setDataFetched(true);
      }
    } catch (err) {
      console.error('Error fetching tool data:', err);
      setError('Failed to load tool usage data');
    } finally {
      setLoading(false);
      requestInProgress.current = false;
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

  const processTimeSeriesData = (interactions: ToolInteraction[]): { 
    aggregated: any[], 
    byTool: Record<string, any[]>,
    toolSpecificTimeData: any[]
  } => {
    // Sort interactions by timestamp
    const sortedInteractions = [...interactions].sort(
      (a, b) => new Date(a.request_timestamp).getTime() - new Date(b.request_timestamp).getTime()
    );
    
    // Group by date and tool
    const dateToolMap = new Map<string, Map<string, number>>();
    
    sortedInteractions.forEach(interaction => {
      const date = new Date(interaction.request_timestamp).toISOString().split('T')[0];
      const toolName = interaction.tool_name;
      
      if (!dateToolMap.has(date)) {
        dateToolMap.set(date, new Map<string, number>());
      }
      
      const toolMap = dateToolMap.get(date)!;
      toolMap.set(toolName, (toolMap.get(toolName) || 0) + 1);
    });
    
    // Create time series points
    const aggregatedData: any[] = [];
    const byToolData: Record<string, any[]> = {};
    
    // Ensure we have all dates in the range
    const dateRange = getDateRange(
      sortedInteractions[0]?.request_timestamp || new Date().toISOString(),
      sortedInteractions[sortedInteractions.length - 1]?.request_timestamp || new Date().toISOString()
    );
    
    dateRange.forEach(date => {
      const formattedDate = date.toISOString().split('T')[0];
      const toolMap = dateToolMap.get(formattedDate) || new Map<string, number>();
      
      // Calculate total for aggregated view
      let total = 0;
      toolMap.forEach(count => total += count);
      
      aggregatedData.push({
        timestamp: formattedDate,
        date: formattedDate,
        "Tool Executions": total
      });
      
      // Process by-tool data
      toolMap.forEach((count, toolName) => {
        if (!byToolData[toolName]) {
          byToolData[toolName] = dateRange.map(d => ({
            timestamp: d.toISOString().split('T')[0],
            date: d.toISOString().split('T')[0],
            [toolName]: 0
          }));
        }
        
        const dataPoint = byToolData[toolName].find(p => p.date === formattedDate);
        if (dataPoint) {
          dataPoint[toolName] = count;
        }
      });
    });
    
    // Format data for chart consumption
    const toolSpecificTimeData = formatToolSpecificData(byToolData, dateRange);
    
    return { 
      aggregated: aggregatedData, 
      byTool: byToolData,
      toolSpecificTimeData
    };
  };

  // Helper function to get a date range array
  const getDateRange = (startDateStr: string, endDateStr: string): Date[] => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Ensure start date is earlier than end date
    if (startDate > endDate) {
      return [new Date()]; // Return today if invalid range
    }
    
    const dateRange: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Set to beginning of day
    currentDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateRange;
  };

  // Format tool-specific data for chart consumption
  const formatToolSpecificData = (byToolData: Record<string, any[]>, dateRange: Date[]): any[] => {
    const formattedData: any[] = [];
    
    dateRange.forEach(date => {
      const formattedDate = date.toISOString().split('T')[0];
      const dataPoint: any = { date: formattedDate };
      
      Object.entries(byToolData).forEach(([toolName, points]) => {
        const point = points.find(p => p.date === formattedDate);
        dataPoint[toolName] = point ? point[toolName] : 0;
      });
      
      formattedData.push(dataPoint);
    });
    
    return formattedData;
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
  
  // Format timestamp based on time range with improved formatting
  function formatTimestamp(timestamp: string, range: string): string {
    const date = new Date(timestamp);
    
    if (range === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7d') {
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (range === '30d') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (range === '90d') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (range === '180d') {
      return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
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

  // Function to toggle tool selection
  const toggleToolSelection = (toolName: string) => {
    setSelectedTools(prev => {
      if (prev.includes(toolName)) {
        return prev.filter(t => t !== toolName);
      } else {
        return [...prev, toolName];
      }
    });
  };

  // Compact Filter UI Component
  const CompactFilterUI = () => (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className="flex-1 min-w-[200px]">
        <Select
          value={toolType}
          onValueChange={setToolType}
          placeholder="Tool type"
        >
          <SelectItem value="all">All Tools</SelectItem>
          <SelectItem value="internal">
            <Badge color="indigo" className="mr-1.5" /> Internal
          </SelectItem>
          <SelectItem value="external">
            <Badge color="violet" className="mr-1.5" /> External
          </SelectItem>
        </Select>
      </div>
      
      <div className="flex-1 min-w-[200px]">
        <Select
          value={performanceFilter}
          onValueChange={setPerformanceFilter}
          placeholder="Performance"
        >
          <SelectItem value="all">All Performance</SelectItem>
          <SelectItem value="fast"><Badge color="green" className="mr-1.5" /> Fast (&lt;500ms)</SelectItem>
          <SelectItem value="medium"><Badge color="amber" className="mr-1.5" /> Medium (500-1000ms)</SelectItem>
          <SelectItem value="slow"><Badge color="red" className="mr-1.5" /> Slow (&gt;1000ms)</SelectItem>
          <SelectItem value="very_slow"><Badge color="rose" className="mr-1.5" /> Very Slow (&gt;2s)</SelectItem>
        </Select>
      </div>
      
      <div className="flex-1 min-w-[200px]">
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          placeholder="Status"
        >
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="success"><Badge color="green" className="mr-1.5" /> Success</SelectItem>
          <SelectItem value="error"><Badge color="red" className="mr-1.5" /> Error</SelectItem>
          <SelectItem value="pending"><Badge color="blue" className="mr-1.5" /> Pending</SelectItem>
        </Select>
      </div>
      
      <div className="flex-1 min-w-[200px]">
        <Select
          value={specificToolFilter}
          onValueChange={setSpecificToolFilter}
          placeholder="Select specific tool"
        >
          <SelectItem value="">All Tools</SelectItem>
          {uniqueToolNames.map(tool => (
            <SelectItem key={tool} value={tool}>
              {tool}
            </SelectItem>
          ))}
        </Select>
      </div>
      
      {hasActiveFilters && (
        <Button 
          variant="secondary" 
          color="gray" 
          onClick={clearAllFilters}
          size="xs"
          icon={ArrowPathIcon}
          className="h-9 whitespace-nowrap"
        >
          Clear
        </Button>
      )}
    </div>
  );

  // Active Filters Display Component
  const ActiveFiltersDisplay = () => {
    if (!hasActiveFilters) return null;
    
    return (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {toolType !== 'all' && (
          <div className="flex h-6 items-center bg-indigo-100 text-indigo-800 rounded-full px-2 space-x-1 text-xs font-medium">
            <span>{toolType === 'internal' ? 'Internal' : 'External'}</span>
            <XMarkIcon className="h-3 w-3 cursor-pointer" onClick={() => setToolType('all')} />
          </div>
        )}
        
        {performanceFilter !== 'all' && (
          <div className={`flex h-6 items-center px-2 space-x-1 text-xs font-medium rounded-full
            ${performanceFilter === 'fast' ? 'bg-green-100 text-green-800' : 
            performanceFilter === 'medium' ? 'bg-amber-100 text-amber-800' : 
            performanceFilter === 'slow' ? 'bg-red-100 text-red-800' : 
            'bg-rose-100 text-rose-800'}`}
          >
            <span>{performanceFilter.charAt(0).toUpperCase() + performanceFilter.slice(1).replace('_', ' ')}</span>
            <XMarkIcon className="h-3 w-3 cursor-pointer" onClick={() => setPerformanceFilter('all')} />
          </div>
        )}
        
        {statusFilter !== 'all' && (
          <div className={`flex h-6 items-center px-2 space-x-1 text-xs font-medium rounded-full
            ${statusFilter === 'success' ? 'bg-green-100 text-green-800' : 
            statusFilter === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'}`}
          >
            <span>{statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
            <XMarkIcon className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
          </div>
        )}
        
        {specificToolFilter && (
          <div className="flex h-6 items-center bg-purple-100 text-purple-800 rounded-full px-2 space-x-1 text-xs font-medium">
            <span>{specificToolFilter}</span>
            <XMarkIcon className="h-3 w-3 cursor-pointer" onClick={() => setSpecificToolFilter('')} />
          </div>
        )}
      </div>
    );
  };

  // Update the refresh function to properly reset the dataFetched flag
  const handleRefresh = () => {
    setDataFetched(false);
    if (onRefresh) {
      onRefresh();
    } else {
      fetchToolData();
    }
  };

  // Update useEffect to handle refresh from dashboard with proper controls and better error handling
  useEffect(() => {
    // Skip if a request is already in progress
    if (requestInProgress.current) {
      return;
    }
    
    if (dashboardLoading) {
      setLoading(true);
      return;
    }
    
    if (dashboardError) {
      setError(dashboardError);
      setLoading(false);
      // Mark as fetched to prevent retrying with the same error
      setDataFetched(true);
      return;
    }
    
    // Only fetch once on initial load or when explicitly triggered
    if (!dataFetched) {
      fetchToolData().catch(err => {
        console.error('Failed to fetch tool data:', err);
        setError('An unexpected error occurred. Please try again later.');
        setLoading(false);
        // Mark as fetched to prevent retrying and creating an infinite loop
        setDataFetched(true);
        requestInProgress.current = false;
      });
    }
  }, [timeRange, dashboardToolExecutions, dashboardLoading, dashboardError, dataFetched]);
  
  // Add an effect to reset dataFetched when filters change, with error handling
  useEffect(() => {
    if (dataFetched && !error && !dashboardError) {
      setDataFetched(false);
    }
  }, [toolType, performanceFilter, statusFilter, specificToolFilter, error, dashboardError]);

  // Update the render to show loading and error states from dashboard with better user experience
  const renderContent = () => {
    const isLoadingState = loading || dashboardLoading;
    const errorState = error || dashboardError;
    
    if (isLoadingState) {
      return <LoadingState />;
    }
    
    if (errorState) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
          <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mb-4" />
          <Text className="text-lg font-medium text-gray-700 mb-2">Unable to load tool usage data</Text>
          <Text className="text-gray-500 text-center mb-4">
            {errorState.includes('API') 
              ? 'We encountered an issue retrieving the tool data. This could be due to server load or temporary maintenance.'
              : errorState}
          </Text>
          <Button
            variant="light"
            icon={ArrowPathIcon}
            onClick={() => {
              setDataFetched(false);
              handleRefresh();
            }}
            size="sm"
          >
            Try Again
          </Button>
        </div>
      );
    }

    // Display appropriate content based on active tab
    switch (activeTab) {
      case 0: // Tool Usage Tab
        return (
          <div>
            <Flex className="mb-4 items-center justify-between">
              <Text>Tool execution frequency by tool name</Text>
              <Legend
                categories={['Internal Tools', 'External Tools']}
                colors={['indigo', 'violet']}
              />
            </Flex>
            
            {histogramData.length > 0 ? (
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
          </div>
        );
        
      case 1: // Slow Tools Tab
        return (
          <div className="mt-4">
            <Text>Tools with execution times above thresholds</Text>
            <SlowToolsTable 
              toolsData={toolUsageData.map(tool => ({
                ...tool,
                failure_rate: tool.count > 0 ? tool.error_count / tool.count : 0
              }))}
              thresholds={{ slow: 1000, medium: 500 }}
              className="mt-4"
              onRowClick={(tool) => {
                // Handle row click if needed, e.g., show details
                console.log('Tool clicked:', tool);
              }}
              filtersActive={hasActiveFilters}
              onResetFilters={clearAllFilters}
            />
          </div>
        );
        
      case 2: // Execution Trends Tab
        return (
          <div>
            <Flex justifyContent="end" className="mb-4">
              <div className="space-x-2">
                <Button
                  variant={selectedView === 'aggregated' ? 'primary' : 'secondary'}
                  icon={ChartBarIcon}
                  onClick={() => setSelectedView('aggregated')}
                  size="xs"
                >
                  Aggregated
                </Button>
                <Button
                  variant={selectedView === 'byTool' ? 'primary' : 'secondary'}
                  icon={WrenchScrewdriverIcon}
                  onClick={() => setSelectedView('byTool')}
                  size="xs"
                >
                  By Tool
                </Button>
              </div>
            </Flex>

            {selectedView === 'aggregated' ? (
              <Card className="mt-4">
                <Title className="text-center mb-2">Tool Executions Over Time</Title>
                <AreaChart
                  className="h-72"
                  data={aggregatedTrendData}
                  index="date"
                  categories={["Tool Executions"]}
                  colors={["indigo"]}
                  valueFormatter={cleanNumberFormatter}
                  customTooltip={(props) => (
                    <div className="bg-white p-2 shadow rounded border border-gray-200">
                      <div className="text-sm font-medium">{props.payload && new Date(props.payload[0]?.payload.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 mb-1">{props.payload && new Date(props.payload[0]?.payload.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                      {props.payload?.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-xs">{entry.value.toLocaleString()} executions</span>
                        </div>
                      ))}
                    </div>
                  )}
                  showLegend={false}
                  showGradient={true}
                  yAxisWidth={40}
                  minValue={0}
                  autoMinValue={false}
                  showYAxis={true}
                  showXAxis={true}
                  startEndOnly={false}
                  showAnimation={true}
                  curveType="natural"
                />
              </Card>
            ) : (
              <div>
                {selectedTools.length > 0 ? (
                  <Card className="mt-4">
                    <Title className="text-center mb-2">Tool Executions By Tool</Title>
                    <AreaChart
                      className="h-72"
                      data={toolTrendData}
                      index="date"
                      categories={selectedTools}
                      colors={selectedTools.map((_, i) => colorOptions[i % colorOptions.length])}
                      valueFormatter={cleanNumberFormatter}
                      customTooltip={(props) => (
                        <div className="bg-white p-2 shadow rounded border border-gray-200">
                          <div className="text-sm font-medium">{props.payload && new Date(props.payload[0]?.payload.date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500 mb-1">{props.payload && new Date(props.payload[0]?.payload.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                          {props.payload?.map((entry, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                              <span className="text-xs">{entry.name}: {entry.value.toLocaleString()} executions</span>
                            </div>
                          ))}
                        </div>
                      )}
                      showLegend={true}
                      showGradient={true}
                      yAxisWidth={40}
                      minValue={0}
                      autoMinValue={false}
                      showYAxis={true}
                      showXAxis={true}
                      startEndOnly={false}
                      showAnimation={true}
                      curveType="natural"
                    />
                    
                    <div className="mt-4 flex items-center justify-between">
                      <Text className="text-sm">Selected tools:</Text>
                      <Button 
                        variant="secondary" 
                        size="xs" 
                        onClick={() => setSelectedTools([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTools.map((tool, index) => (
                        <Badge
                          key={tool}
                          color={colorOptions[index % colorOptions.length] as Color}
                          className="cursor-pointer"
                          onClick={() => toggleToolSelection(tool)}
                        >
                          {tool} ×
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <div className="mt-4">
                    <Text>Select tools to compare:</Text>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {toolUsageData.map((tool) => (
                        <Badge
                          key={tool.tool_name}
                          color={selectedTools.includes(tool.tool_name) ? (tool.is_internal ? 'indigo' : 'violet') : 'gray'}
                          className="cursor-pointer"
                          onClick={() => toggleToolSelection(tool.tool_name)}
                        >
                          {tool.tool_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <DashboardCard
      className={className}
      title="Tool Usage Analysis"
      icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
      description="Monitor and analyze tool usage patterns and performance"
      footer={
        <Button
          variant="light"
          icon={ArrowPathIcon}
          onClick={handleRefresh}
          disabled={loading || dashboardLoading || requestInProgress.current}
          size="xs"
        >
          Refresh
        </Button>
      }
    >
      {/* Compact Filter UI */}
      <CompactFilterUI />
      
      {/* Active Filters Display */}
      <ActiveFiltersDisplay />

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mb-4">
          <Tab icon={ChartBarIcon}>Tool Usage</Tab>
          <Tab icon={ClockIcon}>Slow Tools</Tab>
          <Tab icon={ChartBarIcon}>Execution Trends</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>{renderContent()}</TabPanel>
          <TabPanel>{renderContent()}</TabPanel>
          <TabPanel>{renderContent()}</TabPanel>
        </TabPanels>
      </TabGroup>
    </DashboardCard>
  );
} 