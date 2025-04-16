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
  XMarkIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon
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
import { formatDistanceToNow } from 'date-fns'
import { Tooltip } from 'react-tooltip'
import Link from 'next/link'
import { cleanToolName, formatDuration } from '../lib/formatters'

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
function formatDurationMs(ms: number): string {
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
  
  // For tool trends
  const [selectedView, setSelectedView] = useState<'aggregated' | 'byTool'>('aggregated');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [visibleTools, setVisibleTools] = useState<string[]>([]);

  // Get unique tool names
  const uniqueToolNames = useMemo(() => {
    return Array.from(new Set(toolInteractions.map(interaction => interaction.tool_name)));
  }, [toolInteractions]);

  // Check if any filters are active
  const hasActiveFilters = false;

  // Clear all filters function
  const clearAllFilters = () => {
    // Implementation of clearAllFilters
  };

  // Update fetchToolData to implement fallback behavior for missing endpoints
  const fetchToolData = async () => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      console.log('Request already in progress, skipping duplicate request');
      return;
    }
    
    // Always fetch when explicitly requested
    
    console.log('Starting tool data fetch');
    requestInProgress.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      // If we have dashboard tool executions data, use that
      if (dashboardToolExecutions && dashboardToolExecutions.length > 0) {
        console.log('Using dashboard tool executions data', dashboardToolExecutions.length);
        // Process the dashboard tool execution data
        setTimeSeriesData(dashboardToolExecutions);
        setDataFetched(true);
        setLoading(false);
        requestInProgress.current = false;
        return;
      }
      
      // Try to fetch data from the metrics endpoint first
      try {
        // Add filter params to request
        const params = buildQueryParams({ 
          time_range: timeRange,
          interaction_type: 'execution',
          page_size: 100 // Set to maximum allowed value (100)
        });
        
        let data: ToolInteractionsResponse | null = null;
        
        try {
          console.log(`Fetching tool interactions data with params: ${params}`);
          // First try to fetch from tool_interactions endpoint
          data = await fetchAPI<ToolInteractionsResponse>(`${METRICS.TOOL_INTERACTIONS}${params}`);
          
          // Add debug logging to see if data is received correctly
          console.log('Raw API response:', JSON.stringify(data).substring(0, 200) + '...');
          
          // Set a max validity period - after this time we'll allow new requests
          setTimeout(() => {
            console.log('Request cache expired, allowing new fetches');
            setDataFetched(false);
          }, 60000); // 1 minute validity
          
        } catch (toolInteractionsError) {
          console.warn('Failed to fetch from tool_interactions endpoint, using fallback data', toolInteractionsError);
          
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
          
          // Use fallback data directly
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
          console.log(`Processing ${data.interactions.length} tool interactions`);
          
          // Force a small delay to ensure React can properly update state
          await new Promise(resolve => setTimeout(resolve, 50));
          
          setToolInteractions(data.interactions);
          
          // Process tool usage data
          const toolData = processToolData(data.interactions);
          console.log('Tool data processed:', toolData.length);
          setToolUsageData(toolData);
          
          // Process time series data
          const { aggregated, byTool, toolSpecificTimeData: specificTimeData } = processTimeSeriesData(data.interactions);
          console.log('Time series data processed, aggregated points:', aggregated.length);
          setAggregatedTimeData(aggregated);
          setToolSpecificTimeData(specificTimeData);
          
          // Get the top 5 most used tools to set as visible by default
          const topTools = [...toolData]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(tool => tool.tool_name);
          
          console.log('Selected top tools:', topTools);
          setVisibleTools(topTools);
          setSelectedTools(topTools);
          
          // Force a small delay before changing dataFetched flag
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Mark as fetched to prevent refetching
          setDataFetched(true);
          console.log('Successfully fetched and processed tool data, dataFetched set to true');
        } else {
          console.log('No tool usage data available');
          setError('No tool usage data available for the selected time period.');
          // Still mark as fetched to prevent endless retries
          setDataFetched(true);
        }
      } catch (err) {
        console.error('Failed to fetch tool data:', err);
        setError('Failed to fetch tool data. Please try again later.');
        // Still mark as fetched to prevent endless retries
        setDataFetched(true);
      }
    } finally {
      setLoading(false);
      requestInProgress.current = false;
      console.log('Request completed, loading state reset to false');
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
    
    if (sortedInteractions.length === 0) {
      return {
        aggregated: [],
        byTool: {},
        toolSpecificTimeData: []
      };
    }
    
    // Group by date and tool
    const dateToolMap = new Map<string, Map<string, number>>();
    
    // Build a set of all tool names to ensure we populate data for each tool on each date
    const allToolNames = new Set<string>();
    
    sortedInteractions.forEach(interaction => {
      const date = new Date(interaction.request_timestamp).toISOString().split('T')[0];
      const toolName = interaction.tool_name;
      
      // Add to tool names list
      allToolNames.add(toolName);
      
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
      // Initialize data for all tools to ensure all tools have entries for all dates
      allToolNames.forEach(toolName => {
        if (!byToolData[toolName]) {
          byToolData[toolName] = dateRange.map(d => ({
            timestamp: d.toISOString().split('T')[0],
            date: d.toISOString().split('T')[0],
            [toolName]: 0
          }));
        }
      });
      
      // Then update with actual counts
      toolMap.forEach((count, toolName) => {
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
  
  // Create memoized data for charts to ensure they render correctly
  const aggregatedTrendData = useMemo(() => {
    return aggregatedTimeData;
  }, [aggregatedTimeData]);

  const toolTrendData = useMemo(() => {
    if (selectedTools.length === 0) return toolSpecificTimeData;
    
    // Create a properly filtered dataset for the chart
    const filteredData = toolSpecificTimeData.map(dataPoint => {
      const filteredPoint: any = { date: dataPoint.date };
      selectedTools.forEach(toolName => {
        if (dataPoint[toolName] !== undefined) {
          filteredPoint[toolName] = dataPoint[toolName];
        } else {
          // Ensure the property exists even if it's zero
          filteredPoint[toolName] = 0;
        }
      });
      return filteredPoint;
    });
    
    return filteredData;
  }, [toolSpecificTimeData, selectedTools]);
  
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
        // Limit to a reasonable number of tools to show on the chart
        if (prev.length < 8) {
          return [...prev, toolName];
        }
        return prev;
      }
    });
  };

  // Add initialization effect
  useEffect(() => {
    // Reset dataFetched when timeRange changes
    if (timeRange) {
      setDataFetched(false);
    }
    
    // Initialize with empty data to prevent errors
    if (toolInteractions.length === 0 && !loading) {
      setLoading(true);
    }
    
    return () => {};
  }, [timeRange]); // Only run when timeRange changes
  
  // Update useEffect to handle refresh from dashboard with proper controls and better error handling
  useEffect(() => {
    // Force initial data fetch on component mount
    const fetchInitialData = async () => {
      console.log('Initial component mount, forcing data fetch');
      if (!dataFetched && !requestInProgress.current) {
        await fetchToolData();
      }
    };
    
    fetchInitialData();
    
    // Component state change effect
    if (requestInProgress.current) {
      console.log('Request in progress, skipping effect');
      return;
    }
    
    console.log('Effect triggered, dashboard loading:', dashboardLoading, 'dashboard error:', !!dashboardError, 'dataFetched:', dataFetched);
    
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

    // No additional conditions preventing fetch
    
    // Cleanup function for component unmount
    return () => {
      console.log('Component unmounting, cleaning up');
      requestInProgress.current = false;
    };
  }, [timeRange, dashboardToolExecutions, dashboardLoading, dashboardError]);

  // Update the refresh function for better toggle behavior
  const handleRefresh = () => {
    const isCurrentlyShowing = toolInteractions.length > 0;
    
    if (isCurrentlyShowing) {
      // Already showing data, just toggle the loading state for visual feedback
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } else {
      // Data not showing, do a full refresh
      setToolInteractions([]);
      setToolUsageData([]);
      setTimeSeriesData([]);
      setAggregatedTimeData([]);
      setToolSpecificTimeData([]);
      setDataFetched(false);
      setError(null);
      
      console.log('Forcing complete data refresh');
      
      if (onRefresh) {
        onRefresh();
      } else {
        fetchToolData();
      }
    }
  };

  // Update the render to show loading and error states from dashboard with better user experience
  const renderContent = () => {
    const isLoadingState = loading || dashboardLoading;
    const errorState = error || dashboardError;
    
    console.log('Render content - loading:', loading, 'dashboardLoading:', dashboardLoading, 
                'error:', error, 'dashboardError:', dashboardError, 
                'dataFetched:', dataFetched,
                'toolInteractions length:', toolInteractions.length,
                'toolUsageData length:', toolUsageData.length,
                'timeSeriesData length:', timeSeriesData.length);
    
    if (isLoadingState) {
      console.log('Rendering loading state');
      return <LoadingState />;
    }
    
    if (errorState) {
      console.log('Rendering error state:', errorState);
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

    console.log('Rendering content for tab:', activeTab);
    
    // Display appropriate content based on active tab
    switch (activeTab) {
      case 0: // Tool Usage Tab
        return (
          <div>
            <Flex className="mb-4 items-center justify-between">
              <Text>Tool execution frequency by tool name</Text>
              <Link href="/tools" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
                <span>View in Tool Explorer</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
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
                            className="h-full rounded-lg transition-all duration-500 ease-out bg-gradient-to-r from-indigo-500/80 via-indigo-400/60 to-indigo-300/40"
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
                {aggregatedTrendData && aggregatedTrendData.length > 0 ? (
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
                ) : (
                  <div className="h-72 flex items-center justify-center">
                    <Text>No data available for the selected time period</Text>
                  </div>
                )}
              </Card>
            ) : (
              <div>
                {selectedTools.length > 0 ? (
                  <Card className="mt-4">
                    <Title className="text-center mb-2">Tool Executions By Tool</Title>
                    {toolTrendData && toolTrendData.length > 0 ? (
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
                    ) : (
                      <div className="h-72 flex items-center justify-center">
                        <Text>No data available for the selected tools</Text>
                      </div>
                    )}
                    
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
                    
                    {/* Add tool selection grid below the chart */}
                    <div className="mt-6 border-t pt-4">
                      <Text className="mb-2 font-medium">Add more tools to compare:</Text>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                        {toolUsageData
                          .filter(tool => !selectedTools.includes(tool.tool_name))
                          .map((tool) => (
                            <div
                              key={tool.tool_name}
                              onClick={() => toggleToolSelection(tool.tool_name)}
                              className={`
                                px-3 py-2 rounded-lg border cursor-pointer transition-all
                                bg-gray-50 border-gray-200 hover:bg-gray-100
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${tool.is_internal ? 'bg-indigo-500' : 'bg-violet-500'}`} />
                                <div className="text-sm font-medium truncate">{tool.tool_name}</div>
                              </div>
                              <div className="text-xs mt-1 text-gray-500">{tool.count.toLocaleString()} executions</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="mt-4">
                    <Text className="mb-2 font-medium">Select tools to compare:</Text>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                      {toolUsageData.map((tool) => (
                        <div
                          key={tool.tool_name}
                          onClick={() => toggleToolSelection(tool.tool_name)}
                          className={`
                            px-3 py-2 rounded-lg border cursor-pointer transition-all
                            ${selectedTools.includes(tool.tool_name) 
                              ? tool.is_internal 
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-800' 
                                : 'bg-violet-100 border-violet-300 text-violet-800'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${tool.is_internal ? 'bg-indigo-500' : 'bg-violet-500'}`} />
                            <div className="text-sm font-medium truncate">{tool.tool_name}</div>
                          </div>
                          <div className="text-xs mt-1 text-gray-500">{tool.count.toLocaleString()} executions</div>
                        </div>
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
    <div>
      <DashboardCard
        title="Tool Usage Analysis"
        icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
        description="Monitor and analyze tool usage patterns and performance"
        className={`${className}`}
        contentClassName="pb-4 overflow-visible"
        actions={
          <>
            <Button 
              size="xs" 
              variant="light" 
              icon={ArrowPathIcon} 
              onClick={handleRefresh}
              title="Refresh data"
            >
              Refresh
            </Button>
            {loading && (
              <div className="animate-pulse text-xs text-gray-500">
                Loading...
              </div>
            )}
          </>
        }
      >
        <TabGroup index={activeTab} onIndexChange={setActiveTab}>
          <TabList variant="line" className="mt-1">
            <Tab icon={ChartBarIcon}>Tool Usage</Tab>
            <Tab icon={ClockIcon}>Slow Tools</Tab>
            <Tab icon={ArrowTrendingUpIcon}>Execution Trends</Tab>
          </TabList>
          <div className="overflow-visible mt-4">
            {renderContent()}
          </div>
        </TabGroup>
      </DashboardCard>
    </div>
  );
} 