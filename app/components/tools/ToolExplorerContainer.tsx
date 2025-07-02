'use client';

import { useState, useEffect } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import ToolsBreakdownCharts from './ToolsBreakdownCharts';
import ToolExecutionsTable from './ToolExecutionsTable';
import { fetchAPI, buildQueryParams } from '../../lib/api';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';
import PageTemplate from '../PageTemplate';
import ContentSection from '../ContentSection';
import { SPACING } from '../spacing';
import RefreshButton from '../RefreshButton';

// Types based on API response
type ToolInteraction = {
  id: number;
  event_id: number;
  tool_name: string;
  interaction_type: string;
  status: string;
  status_code: number | null;
  parameters: any;
  result: any;
  error: string | null;
  request_timestamp: string;
  response_timestamp: string | null;
  duration_ms: number | null;
  framework_name: string;
  tool_version: string | null;
  authorization_level: string | null;
  execution_time_ms: number | null;
  cache_hit: boolean | null;
  api_version: string | null;
  raw_attributes: Record<string, any>;
  span_id: string;
  trace_id: string;
  agent_id: string;
  associated_event_ids?: number[];
};

type ToolInteractionsResponse = {
  total: number;
  page: number;
  page_size: number;
  from_time: string;
  to_time: string;
  interactions: ToolInteraction[];
};

// Adapt these types to work with our UI components
type ToolExecutionSummary = {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id: string;
  agent_id: string;
  tool_name: string;
  tool_type: string;
  status: string;
  duration_ms: number;
  input_summary: string;
  output_summary: string;
  error: string | null;
  associated_event_ids: string[];
};

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

type ToolExplorerContainerProps = {
  searchParams: ReadonlyURLSearchParams;
};

export default function ToolExplorerContainer({ searchParams }: ToolExplorerContainerProps) {
  // State for API data
  const [executions, setExecutions] = useState<ToolExecutionSummary[]>([]);
  const [summary, setSummary] = useState<ToolSummary | null>(null);
  const [timeline, setTimeline] = useState<ToolTimelinePoint[]>([]);
  const [agentBreakdown, setAgentBreakdown] = useState<ToolAgentBreakdown[]>([]);
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [timeRange, setTimeRange] = useState(searchParams.get('time_range') || '30d');
  const [toolName, setToolName] = useState(searchParams.get('tool_name') || '');
  const [toolType, setToolType] = useState(searchParams.get('tool_type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [agentId, setAgentId] = useState(searchParams.get('agent_id') || '');
  const [fromTime, setFromTime] = useState(searchParams.get('from_time') || '');
  const [toTime, setToTime] = useState(searchParams.get('to_time') || '');
  
  // Add state for refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query params
        const params: Record<string, string> = {
          page: '1',
          page_size: '20',
          sort_by: 'request_timestamp', 
          sort_dir: 'desc'
        };
        
        if (timeRange) params.time_range = timeRange;
        if (toolName) params.tool_name = toolName;
        if (toolType) params.tool_type = toolType;
        if (status) params.status = status;
        if (agentId) params.agent_id = agentId;
        if (fromTime) params.from_time = fromTime;
        if (toTime) params.to_time = toTime;
        
        console.log('Fetching tool data with params:', params);
        
        // Fetch tool interactions data
        const toolInteractionsUrl = `/v1/metrics/tool_interactions${buildQueryParams(params)}`;
        console.log('Fetching tool interactions from:', toolInteractionsUrl);
        
        const toolInteractionsResponse = await fetchAPI<ToolInteractionsResponse>(toolInteractionsUrl);
        console.log('Tool interactions response:', toolInteractionsResponse);
        
        if (toolInteractionsResponse && toolInteractionsResponse.interactions) {
          // Transform interactions to ToolExecutionSummary format that our UI expects
          const executionSummaries = toolInteractionsResponse.interactions.map(interaction => ({
            id: interaction.id.toString(),
            timestamp: interaction.request_timestamp || new Date().toISOString(),
            trace_id: interaction.trace_id || '',
            span_id: interaction.span_id || '',
            agent_id: interaction.agent_id || 'unknown',
            tool_name: interaction.tool_name || 'unknown',
            tool_type: interaction.framework_name || 'unknown',
            status: interaction.status || 'unknown',
            duration_ms: interaction.duration_ms || 0,
            input_summary: Array.isArray(interaction.parameters) 
              ? `Parameters: ${interaction.parameters.join(', ')}` 
              : (interaction.parameters ? JSON.stringify(interaction.parameters) : 'No parameters'),
            output_summary: interaction.result 
              ? (typeof interaction.result === 'string' ? interaction.result.substring(0, 100) : JSON.stringify(interaction.result).substring(0, 100))
              : 'No result',
            error: interaction.error || null,
            associated_event_ids: interaction.associated_event_ids?.map(id => id.toString()) || []
          }));
          
          setExecutions(executionSummaries);
          
          // Calculate summary metrics from interactions
          const successfulInteractions = toolInteractionsResponse.interactions.filter(i => i.status === 'success');
          const totalExecutions = toolInteractionsResponse.total;
          const successRate = totalExecutions > 0 ? successfulInteractions.length / totalExecutions : 0;
          
          // Calculate average duration from successful executions
          const durations = successfulInteractions
            .filter(i => i.duration_ms !== null)
            .map(i => i.duration_ms as number);
          
          const avgDuration = durations.length > 0 
            ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
            : 0;
          
          // Count by status
          const statusCounts: Record<string, number> = {};
          toolInteractionsResponse.interactions.forEach(i => {
            const status = i.status || 'unknown';
            if (!statusCounts[status]) statusCounts[status] = 0;
            statusCounts[status]++;
          });
          
          // Count by tool name and calculate metrics
          const toolCounts: Record<string, {
            count: number, 
            success: number, 
            durations: number[]
          }> = {};
          
          toolInteractionsResponse.interactions.forEach(i => {
            const toolName = i.tool_name || 'unknown';
            const status = i.status || 'unknown';
            
            if (!toolCounts[toolName]) {
              toolCounts[toolName] = { 
                count: 0, 
                success: 0, 
                durations: [] 
              };
            }
            
            toolCounts[toolName].count++;
            
            if (status === 'success') {
              toolCounts[toolName].success++;
              if (i.duration_ms !== null && i.duration_ms !== undefined) {
                toolCounts[toolName].durations.push(i.duration_ms);
              }
            }
          });
          
          // Calculate top tools
          const topTools = Object.entries(toolCounts)
            .map(([name, data]) => ({
              name,
              count: data.count,
              success_rate: data.count > 0 ? data.success / data.count : 0,
              avg_duration_ms: data.durations.length > 0 
                ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length 
                : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          
          // Count by tool type (framework_name here)
          const typeData: Record<string, {
            count: number,
            success: number,
            durations: number[]
          }> = {};
          
          toolInteractionsResponse.interactions.forEach(i => {
            const type = i.framework_name || 'unknown';
            const status = i.status || 'unknown';
            
            if (!typeData[type]) {
              typeData[type] = { 
                count: 0, 
                success: 0, 
                durations: [] 
              };
            }
            
            typeData[type].count++;
            
            if (status === 'success') {
              typeData[type].success++;
              if (i.duration_ms !== null && i.duration_ms !== undefined) {
                typeData[type].durations.push(i.duration_ms);
              }
            }
          });
          
          // Format by_tool_type for our UI
          const byToolType: Record<string, {
            count: number;
            success_rate: number;
            avg_duration_ms: number;
          }> = {};
          
          Object.entries(typeData).forEach(([type, data]) => {
            byToolType[type] = {
              count: data.count,
              success_rate: data.count > 0 ? data.success / data.count : 0,
              avg_duration_ms: data.durations.length > 0 
                ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length 
                : 0
            };
          });
          
          // Create summary data
          const summaryData: ToolSummary = {
            total_executions: totalExecutions,
            success_rate: successRate,
            avg_duration_ms: avgDuration,
            by_tool_type: byToolType,
            by_status: statusCounts,
            top_tools: topTools
          };
          
          setSummary(summaryData);
          
          // Create timeline data - group by day
          const timelineMap = new Map<string, {
            total: number,
            by_type: Record<string, number>,
            by_status: Record<string, number>
          }>();
          
          toolInteractionsResponse.interactions.forEach(i => {
            // Get date part only for the timestamp - add null safety
            const timestamp = i.request_timestamp || new Date().toISOString();
            const date = timestamp.split('T')[0];
            
            if (!timelineMap.has(date)) {
              timelineMap.set(date, {
                total: 0,
                by_type: {},
                by_status: {}
              });
            }
            
            const point = timelineMap.get(date)!;
            point.total++;
            
            // Count by type
            const type = i.framework_name || 'unknown';
            if (!point.by_type[type]) point.by_type[type] = 0;
            point.by_type[type]++;
            
            // Count by status
            const status = i.status || 'unknown';
            if (!point.by_status[status]) point.by_status[status] = 0;
            point.by_status[status]++;
          });
          
          // Convert to array and sort by date
          const timelineData = Array.from(timelineMap.entries())
            .map(([date, data]) => ({
              timestamp: date,
              ...data
            }))
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
          
          setTimeline(timelineData);
          
          // Create agent breakdown
          const agentData = new Map<string, {
            agent_name: string,
            total: number,
            success: number,
            durations: number[],
            tool_counts: Record<string, { count: number, success: number }>
          }>();
          
          toolInteractionsResponse.interactions.forEach(i => {
            const agentId = i.agent_id || 'unknown';
            const toolName = i.tool_name || 'unknown';
            const status = i.status || 'unknown';
            
            if (!agentData.has(agentId)) {
              agentData.set(agentId, {
                agent_name: agentId,
                total: 0,
                success: 0,
                durations: [],
                tool_counts: {}
              });
            }
            
            const data = agentData.get(agentId)!;
            data.total++;
            
            if (status === 'success') {
              data.success++;
              if (i.duration_ms !== null && i.duration_ms !== undefined) {
                data.durations.push(i.duration_ms);
              }
            }
            
            // Count tools per agent
            if (!data.tool_counts[toolName]) {
              data.tool_counts[toolName] = { count: 0, success: 0 };
            }
            
            data.tool_counts[toolName].count++;
            if (status === 'success') {
              data.tool_counts[toolName].success++;
            }
          });
          
          // Format for UI
          const agentBreakdownData = Array.from(agentData.entries())
            .map(([agent_id, data]) => {
              // Get top tools for this agent
              const topTools = Object.entries(data.tool_counts)
                .map(([name, counts]) => ({
                  name,
                  count: counts.count,
                  success_rate: counts.count > 0 ? counts.success / counts.count : 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              
              return {
                agent_id,
                agent_name: data.agent_name,
                total_executions: data.total,
                success_rate: data.total > 0 ? data.success / data.total : 0,
                avg_duration_ms: data.durations.length > 0 
                  ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length 
                  : 0,
                top_tools: topTools
              };
            });
          
          setAgentBreakdown(agentBreakdownData);
        } else {
          // Handle empty or invalid response
          setExecutions([]);
          setSummary(null);
          setTimeline([]);
          setAgentBreakdown([]);
        }
      } catch (err) {
        console.error('Fatal error in data fetching:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tool data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, toolName, toolType, status, agentId, fromTime, toTime]);
  
  // Handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    // Only keep time range filter since we removed the other filter UI components
    if (filterName === 'time_range') {
      setTimeRange(value);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setIsLoading(true);
    // This will trigger the useEffect to re-fetch data
  };
  
  // Content display
  const breadcrumbs = [   
    { label: 'Tools', current: true }
  ];
  
  return (
    <PageTemplate
      title="Tool Explorer"
      description="Monitor and analyze tool executions across your platform"
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={(value) => handleFilterChange('time_range', value)}
      headerContent={<RefreshButton onClick={handleRefresh} />}
      contentSpacing="default"
    >
      {isLoading ? (
        <LoadingState variant="skeleton" contentType="data" />
      ) : error ? (
        <ErrorMessage message={error} severity="error" />
      ) : (
        <>
          <ContentSection spacing="default">
            <ToolsBreakdownCharts 
              summary={summary}
              timeline={timeline}
              agentBreakdown={agentBreakdown}
            />
          </ContentSection>
          
          <ContentSection spacing="default">
            <ToolExecutionsTable 
              executions={executions} 
            />
          </ContentSection>
        </>
      )}
    </PageTemplate>
  );
} 