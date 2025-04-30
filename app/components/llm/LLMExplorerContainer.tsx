'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { debounce } from 'lodash'
import { Tab } from '@headlessui/react'

import {
  LLMHeader,
  LLMFilterBar,
  LLMBreakdownCharts,
  LLMRequestsTable,
  LLMRequestDetailPanel,
  LLMResponsesTable,
  LLMConversationFlow
} from './index'

import ModelUsageAnalytics from '../ModelUsageAnalytics'
import { DateRangePickerValue } from '@tremor/react'
import PageTemplate from '../PageTemplate'
import ContentSection from '../ContentSection'
import { SPACING } from '../spacing'
import RefreshButton from '../RefreshButton'

import {
  getLLMAnalytics,
  getLLMModelComparison,
  getLLMUsageTrends,
  getLLMAgentUsage,
  getAgentModelRelationships,
  getLLMRequests,
  getLLMRequestDetails,
  getLLMConversations
} from '../../lib/llm-api'

import type {
  LLMHeaderMetrics,
  LLMFilters,
  ModelUsageData,
  TimeSeriesData,
  AgentUsageData,
  CostData,
  LLMRequest,
  LLMRequestsPagination,
  LLMRequestDetail,
  LLMResponse,
  LLMResponsesPagination
} from './index'

// Default time range
const DEFAULT_TIME_RANGE = '30d'

// Default page size
const DEFAULT_PAGE_SIZE = 25

// Define API response types
type LLMAnalyticsResponse = {
  total: {
    request_count: number;
    token_count_input: number;
    token_count_output: number;
    token_count_total: number;
    estimated_cost_usd: number;
    previous_period_cost_usd?: number;
    success_rate: number;
    response_time_avg: number;
    response_time_p95: number;
    error_rate?: number;
    first_seen?: string;
    last_seen?: string;
  };
  breakdown: Array<{
    key: string;
    metrics: {
      request_count: number;
      token_count_input: number;
      token_count_output: number;
      token_count_total: number;
      estimated_cost_usd: number;
      success_rate: number;
      response_time_avg: number;
      response_time_p95: number;
      error_rate?: number;
      first_seen?: string;
      last_seen?: string;
    };
    models?: Array<{
      name: string;
      request_count: number;
      token_count_total: number;
    }>;
    relation_type?: string;
    time_distribution?: any;
    token_distribution?: any;
  }>;
  from_time?: string;
  to_time?: string;
  filters?: any;
  breakdown_by?: string;
}

type LLMRequestsResponse = {
  items: LLMRequest[];
  pagination: LLMRequestsPagination;
}

// Utility function to replace classnames library
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function LLMExplorerContainer({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // State for active tab index
  const [activeTab, setActiveTab] = useState(0)
  
  // State for analytics view
  const [activeView, setActiveView] = useState('general')
  
  // State for loading status
  const [loading, setLoading] = useState(true)
  
  // State for detailed view
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LLMRequestDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // State for conversation flow view
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  
  // State for filter values
  const [filters, setFilters] = useState<LLMFilters>({
    timeRange: DEFAULT_TIME_RANGE,
    model: [],
    status: [],
    agent: [],
    tokenRange: [0, 10000]
  })
  
  // State for models and agents (for filters)
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([])
  const [availableAgents, setAvailableAgents] = useState<{ id: string; name: string }[]>([])
  
  // State for metrics data
  const [metrics, setMetrics] = useState<LLMHeaderMetrics>({
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0,
  })
  
  // State for model usage data
  const [modelData, setModelData] = useState<ModelUsageData[]>([])
  
  // State for time series data
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  
  // State for agent usage data
  const [agentData, setAgentData] = useState<AgentUsageData[]>([])
  
  // State for cost data
  const [costData, setCostData] = useState<CostData>({
    totalCost: 0,
    previousPeriodCost: 0,
    costByModel: [],
    costByAgent: [],
    dailyCosts: [],
    costEfficiency: []
  })
  
  // State for requests table
  const [requests, setRequests] = useState<LLMRequest[]>([])
  const [pagination, setPagination] = useState<LLMRequestsPagination>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  
  // State for responses table
  const [responses, setResponses] = useState<LLMResponse[]>([])
  const [responsesPagination, setResponsesPagination] = useState<LLMResponsesPagination>({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  
  // State for selected response
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)
  
  // Router for URL manipulation
  const router = useRouter()
  const searchParamsObj = useSearchParams()
  
  // Add state for refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Declare fetchData at component level
  const fetchData = async (resetData = false) => {
    // Only fetch data if we're on the dashboard tab or if forcing a refresh
    if (activeTab !== 0 && !resetData) return;
    
    // Reset error states for new fetch
    setLoading(true);
    setMetrics({
      totalRequests: 0,
      totalTokens: 0,
      estimatedCost: 0,
    });
    setModelData([]);
    setTimeSeriesData([]);
    setAgentData([]);
    setCostData({
      totalCost: 0,
      previousPeriodCost: 0,
      costByModel: [],
      costByAgent: [],
      dailyCosts: [],
      costEfficiency: []
    });
    setRequests([]);
    setResponses([]);
    setPagination({
      page: 1,
      page_size: DEFAULT_PAGE_SIZE,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_prev: false
    });
    setSelectedRequestId(null);
    setSelectedTraceId(null);
    setSelectedResponseId(null);

    try {
      // Prepare API parameters
      const apiParams = {
        agent_id: filters.agent.length > 0 ? filters.agent.join(',') : undefined,
        model_name: filters.model.length > 0 ? filters.model.join(',') : undefined,
        from_time: filters.customDateRange?.from?.toISOString(),
        to_time: filters.customDateRange?.to?.toISOString(),
        time_range: !filters.customDateRange ? filters.timeRange : undefined,
        granularity: "day"
      };
      
      // Execute all requests in parallel using our API functions with proper types
      const analyticsResult = await getLLMAnalytics(apiParams);
      const modelComparisonResult = await getLLMModelComparison(apiParams);
      const usageTrendsResult = await getLLMUsageTrends(apiParams);
      const agentUsageResult = await getLLMAgentUsage(apiParams);
      const relationshipsResult = await getAgentModelRelationships(apiParams);

      // Type assert each result
      const analyticsData = analyticsResult as LLMAnalyticsResponse;
      const modelComparisonData = modelComparisonResult as LLMAnalyticsResponse;
      const usageTrendsData = usageTrendsResult as LLMAnalyticsResponse;
      const agentUsageData = agentUsageResult as LLMAnalyticsResponse;
      const relationshipsData = relationshipsResult as LLMAnalyticsResponse;
      
      // Process analytics data for header metrics
      if (analyticsData && analyticsData.total) {
        const totalTokens = analyticsData.total.token_count_total || 
                           (analyticsData.total.token_count_input || 0) + (analyticsData.total.token_count_output || 0);
        
        setMetrics({
          totalRequests: analyticsData.total.request_count || 0,
          totalTokens: totalTokens,
          estimatedCost: analyticsData.total.estimated_cost_usd || 0
        });
        
        console.log("Total tokens calculation:", {
          total: analyticsData.total.token_count_total,
          input: analyticsData.total.token_count_input,
          output: analyticsData.total.token_count_output,
          calculated: totalTokens
        });
      }
      
      // Process model comparison data
      if (modelComparisonData && Array.isArray(modelComparisonData.breakdown)) {
        // Process model data
        const processedModelData: ModelUsageData[] = modelComparisonData.breakdown.map(model => ({
          name: model.key || 'unknown',
          requests: model.metrics?.request_count || 0,
          input_tokens: model.metrics?.token_count_input || 0,
          output_tokens: model.metrics?.token_count_output || 0,
          total_tokens: model.metrics?.token_count_total || 0,
          success_rate: model.metrics?.success_rate || 0,
          avg_response_time_ms: model.metrics?.response_time_avg || 0,
          p95_response_time_ms: model.metrics?.response_time_p95 || 0,
          estimated_cost: model.metrics?.estimated_cost_usd || 0,
          cost_per_1k_tokens: model.metrics?.token_count_total > 0
            ? (model.metrics?.estimated_cost_usd || 0) / (model.metrics?.token_count_total / 1000)
            : 0
        }));
        
        setModelData(processedModelData);
        
        // If total tokens is still 0, try calculating from model data
        if (metrics.totalTokens === 0 && processedModelData.length > 0) {
          const calculatedTotalTokens = processedModelData.reduce(
            (sum, model) => sum + (model.total_tokens || 0), 0
          );
          
          if (calculatedTotalTokens > 0) {
            setMetrics(prev => ({
              ...prev,
              totalTokens: calculatedTotalTokens
            }));
            
            console.log("Updated total tokens from model data:", calculatedTotalTokens);
          }
        }
        
        // Extract available models for filters
        const availableModelsList = processedModelData
          .filter(model => model.name && model.name !== 'unknown')
          .map(model => ({
            id: model.name,
            name: model.name
          }));
        
        if (availableModelsList.length > 0) {
          setAvailableModels(availableModelsList);
        }
      }
      
      // Process usage trends data
      if (usageTrendsData && Array.isArray(usageTrendsData.breakdown)) {
        // Process time series data
        const processedTimeSeriesData: TimeSeriesData[] = usageTrendsData.breakdown.map(point => ({
          date: point.key || '',
          total_requests: point.metrics?.request_count || 0,
          input_tokens: point.metrics?.token_count_input || 0,
          output_tokens: point.metrics?.token_count_output || 0,
          total_tokens: point.metrics?.token_count_total || 0,
          estimated_cost: point.metrics?.estimated_cost_usd || 0
        }));
        
        setTimeSeriesData(processedTimeSeriesData);
        
        // Also populate cost data from usage trends
        if (processedTimeSeriesData.length > 0) {
          const dailyCosts = processedTimeSeriesData.map(day => ({
            date: day.date,
            cost: day.estimated_cost,
            forecastCost: undefined
          }));
          
          setCostData(prev => ({
            ...prev,
            dailyCosts
          }));
        }
      }
      
      // Process agent usage data
      if (agentUsageData && Array.isArray(agentUsageData.breakdown)) {
        // Process agent data
        const processedAgentData: AgentUsageData[] = agentUsageData.breakdown.map(agent => {
          // Find matching agent in relationships data if available
          const models = [];
          
          if (relationshipsData && Array.isArray(relationshipsData.breakdown)) {
            // Extract model usage for this agent from relationships data
            const agentRelationships = relationshipsData.breakdown
              .filter(rel => rel.key.startsWith(agent.key + ":"))
              .map(rel => {
                const modelName = rel.key.split(":")[1] || "unknown";
                return {
                  name: modelName,
                  requests: rel.metrics?.request_count || 0,
                  tokens: rel.metrics?.token_count_total || 0
                };
              });
            
            if (agentRelationships.length > 0) {
              models.push(...agentRelationships);
            }
          }
          
          // Construct agent data object
          return {
            name: agent.key || 'unknown',
            requests: agent.metrics?.request_count || 0,
            input_tokens: agent.metrics?.token_count_input || 0,
            output_tokens: agent.metrics?.token_count_output || 0,
            total_tokens: agent.metrics?.token_count_total || 0,
            estimated_cost: agent.metrics?.estimated_cost_usd || 0,
            models: models
          };
        });
        
        setAgentData(processedAgentData);
        
        // Extract available agents for filters
        const availableAgentsList = processedAgentData
          .filter(agent => agent.name && agent.name !== 'unknown')
          .map(agent => ({
            id: agent.name,
            name: agent.name
          }));
        
        if (availableAgentsList.length > 0) {
          setAvailableAgents(availableAgentsList);
        }
        
        // Process cost by agent data
        const costByAgent = processedAgentData.map(agent => ({
          name: agent.name,
          cost: agent.estimated_cost,
          tokens: agent.total_tokens
        }));
        
        setCostData(prev => ({
          ...prev,
          costByAgent
        }));
      }
      
      // Process cost data from model comparison
      if (modelComparisonData && Array.isArray(modelComparisonData.breakdown)) {
        // Cost by model data
        const costByModel = modelComparisonData.breakdown.map(model => ({
          name: model.key || 'unknown',
          cost: model.metrics?.estimated_cost_usd || 0,
          tokenCost: model.metrics?.token_count_total > 0
            ? (model.metrics?.estimated_cost_usd || 0) / (model.metrics?.token_count_total / 1000) * 1000
            : 0,
          tokens: model.metrics?.token_count_total || 0
        }));
        
        // Cost efficiency by model (cost per 1K tokens)
        const costEfficiency = modelComparisonData.breakdown.map(model => ({
          name: model.key || 'unknown',
          costPerRequest: model.metrics?.request_count > 0
            ? (model.metrics?.estimated_cost_usd || 0) / model.metrics?.request_count
            : 0,
          costPerToken: model.metrics?.token_count_total > 0
            ? (model.metrics?.estimated_cost_usd || 0) / model.metrics?.token_count_total
            : 0,
          costPer1kSuccessfulTokens: model.metrics?.token_count_total > 0 && model.metrics?.success_rate > 0
            ? (model.metrics?.estimated_cost_usd || 0) / (model.metrics?.token_count_total / 1000) / (model.metrics?.success_rate / 100)
            : 0
        }));
        
        setCostData(prev => ({
          ...prev,
          totalCost: analyticsData?.total?.estimated_cost_usd || 0,
          previousPeriodCost: analyticsData?.total?.previous_period_cost_usd || 0,
          costByModel,
          costEfficiency
        }));
      }
      
      // Fetch requests data if we're on the requests tab
      if (activeTab === 1 || resetData) {
        // Get requests with current filters and pagination
        try {
          const apiParams = {
            agent_id: filters.agent.length > 0 ? filters.agent.join(',') : undefined,
            model_name: filters.model.length > 0 ? filters.model.join(',') : undefined,
            from_time: filters.customDateRange?.from?.toISOString(),
            to_time: filters.customDateRange?.to?.toISOString(),
            time_range: !filters.customDateRange ? filters.timeRange : undefined,
            status: filters.status.length > 0 ? filters.status.join(',') : undefined,
            query: filters.query,
            has_error: filters.has_error,
            page: pagination.page,
            page_size: pagination.page_size
          };

          const result = await getLLMRequests(apiParams);
          
          if (result && result.items) {
            setRequests(result.items);
            setPagination(result.pagination);
          }
        } catch (error) {
          console.error("Error fetching LLM requests:", error);
        }
      }
      
    } catch (error) {
      console.error("Error fetching LLM analytics data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Parse URL search params on initial load
  const parseSearchParams = () => {
    // Check URL path
    const pathname = window.location.pathname
    // Check if we're on a specific conversation route
    const conversationPattern = /\/llm\/conversations\/([^\/]+)/;
    const match = pathname.match(conversationPattern);
    
    if (match && match[1]) {
      // We have a trace ID in the URL path
      setActiveTab(1); // Set to conversations tab
      setSelectedTraceId(match[1]); // Set the selected trace ID
      return; // Skip other parsing if we have a direct conversation URL
    } else if (pathname.startsWith('/llm/conversations')) {
      // Set the active tab to conversations (tab index 1)
      setActiveTab(1)
    }

    // Check for tab parameter
    const tabParam = searchParamsObj.get('tab')
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10)
      setActiveTab(tabIndex)
    }

    // Check for trace ID parameter
    const traceIdParam = searchParamsObj.get('traceId')
    if (traceIdParam) {
      setSelectedTraceId(traceIdParam)
    }

    // Check for request ID parameter
    const requestIdParam = searchParamsObj.get('requestId')
    if (requestIdParam) {
      setSelectedRequestId(requestIdParam)
      fetchRequestDetails(requestIdParam)
    }

    // Extract date range if present
    const fromDate = searchParamsObj.get('from')
    const toDate = searchParamsObj.get('to')
    if (fromDate && toDate) {
      setFilters(prev => ({
        ...prev,
        customDateRange: {
          from: new Date(fromDate),
          to: new Date(toDate)
        },
        timeRange: 'custom'
      }))
    } else {
      // Check for time range parameter
      const timeRangeParam = searchParamsObj.get('timeRange')
      if (timeRangeParam) {
        setFilters(prev => ({
          ...prev,
          timeRange: timeRangeParam
        }))
      }
    }

    // Check for model filter
    const modelParam = searchParamsObj.get('model')
    if (modelParam) {
      const models = modelParam.split(',')
      setFilters(prev => ({
        ...prev,
        model: models
      }))
    }

    // Check for agent filter
    const agentParam = searchParamsObj.get('agent')
    if (agentParam) {
      const agents = agentParam.split(',')
      setFilters(prev => ({
        ...prev,
        agent: agents
      }))
    }

    // Check for status filter
    const statusParam = searchParamsObj.get('status')
    if (statusParam) {
      const statuses = statusParam.split(',')
      setFilters(prev => ({
        ...prev,
        status: statuses
      }))
    }
  }

  // Run once on component mount
  useEffect(() => {
    parseSearchParams()
    
    // If there's a traceId in the URL, set it as the selected trace ID
    const traceIdParam = searchParamsObj.get('traceId')
    if (traceIdParam) {
      setSelectedTraceId(traceIdParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Update URL when filters change
  const updateURL = useCallback(
    debounce((newFilters: LLMFilters, newPagination: LLMRequestsPagination, newTab: number, newRequestId: string | null, newTraceId: string | null) => {
      const params = new URLSearchParams()
      
      // Add filters to URL
      params.set('timeRange', newFilters.timeRange !== 'custom' ? newFilters.timeRange : DEFAULT_TIME_RANGE)
      
      if (newFilters.model && newFilters.model.length > 0) {
        newFilters.model.forEach(model => params.append('model', model))
      }
      
      if (newFilters.status && newFilters.status.length > 0) {
        newFilters.status.forEach(status => params.append('status', status))
      }
      
      if (newFilters.agent && newFilters.agent.length > 0) {
        newFilters.agent.forEach(agent => params.append('agent', agent))
      }
      
      if (newFilters.tokenRange) {
        params.set('tokenMin', String(newFilters.tokenRange[0]))
        params.set('tokenMax', String(newFilters.tokenRange[1]))
      }
      
      if (newFilters.customDateRange && newFilters.timeRange === 'custom') {
        if (newFilters.customDateRange.from) {
          params.set('fromDate', newFilters.customDateRange.from.toISOString())
        }
        if (newFilters.customDateRange.to) {
          params.set('toDate', newFilters.customDateRange.to.toISOString())
        }
      }
      
      // Add pagination to URL
      params.set('page', String(newPagination.page))
      params.set('pageSize', String(newPagination.page_size))
      
      // Add active tab to URL
      params.set('tab', String(newTab))
      
      // Add selected request if any
      if (newRequestId) {
        params.set('requestId', newRequestId)
      }
      
      // Add selected trace if any
      if (newTraceId) {
        params.set('traceId', newTraceId)
      }
      
      // Update URL
      router.push(`/llm?${params.toString()}`)
    }, 300),
    [router]
  )
  
  // Use the conversations list endpoint when showing the Conversations tab
  useEffect(() => {
    const fetchConversationsData = async () => {
      if (activeTab !== 1) return; // Only fetch for Conversations tab
      
      try {
        setLoading(true);
        
        // Convert filters to API parameters for conversations endpoint
        const conversationsParams = {
          agent_id: filters.agent.length === 1 ? filters.agent[0] : undefined,
          model: filters.model.length === 1 ? filters.model[0] : undefined,
          from_time: filters.customDateRange?.from?.toISOString(),
          to_time: filters.customDateRange?.to?.toISOString(),
          time_range: filters.timeRange !== 'custom' ? filters.timeRange : undefined,
          page: pagination.page,
          page_size: pagination.page_size,
          query: filters.query,
          has_error: filters.has_error
        };
        
        // Use the conversations list endpoint
        const conversationsData = await getLLMConversations(conversationsParams);
        
        // Verify the data structure is valid before proceeding
        if (!conversationsData || !Array.isArray(conversationsData.items)) {
          throw new Error('Invalid conversation data structure');
        }
        
        // Map the conversation data to the request format expected by LLMRequestsTable
        // Each conversation becomes a request row in the table
        const mappedRequests = conversationsData.items.map(conversation => ({
          id: conversation.trace_id || conversation.id || 'unknown', // Fallback IDs
          timestamp: conversation.first_timestamp || conversation.timestamp || new Date().toISOString(),
          trace_id: conversation.trace_id || conversation.id || 'unknown',
          span_id: conversation.span_id || '',
          model: conversation.model || '',
          status: conversation.status || 'success',
          duration_ms: conversation.duration_ms || 0,
          input_tokens: conversation.input_tokens || 0,
          output_tokens: conversation.output_tokens || 0,
          prompt_summary: conversation.summary || conversation.prompt_summary || '',
          completion_summary: conversation.completion_summary || 
                              `Messages: ${conversation.user_messages + conversation.assistant_messages || 0}`,
          error: conversation.error || null,
          agent_id: conversation.agent_id || '',
          agent_name: conversation.agent_name || '',
          // Add conversation-specific fields with fallbacks
          total_tokens: conversation.total_tokens || 0,
          request_count: conversation.request_count || 1,
          user_messages: conversation.user_messages || 0,
          assistant_messages: conversation.assistant_messages || 0
        }));
        
        setRequests(mappedRequests);
        
        // Update pagination if it exists
        if (conversationsData.pagination) {
          setPagination({
            page: conversationsData.pagination.page || pagination.page,
            page_size: conversationsData.pagination.page_size || pagination.page_size,
            total: conversationsData.pagination.total || 0,
            total_pages: conversationsData.pagination.total_pages || 0,
            has_next: !!conversationsData.pagination.has_next,
            has_prev: !!conversationsData.pagination.has_prev
          });
        } else {
          // Reset pagination if not provided
          setPagination({
            ...pagination,
            total: mappedRequests.length,
            total_pages: 1,
            has_next: false,
            has_prev: false
          });
        }
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        setRequests([]);
        
        // Reset pagination
        setPagination({
          ...pagination,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        });
        
        // Show error state in UI through metrics
        setMetrics(prev => ({
          ...prev,
          apiError: true,
          errorMessage: 'Failed to fetch conversation data. Please try again later.'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversationsData();
  }, [activeTab, filters, pagination.page, pagination.page_size]);
  
  // Fetch responses data
  useEffect(() => {
    const fetchResponsesData = async () => {
      if (activeTab !== 3) return; // Only fetch when responses tab is active
      
      try {
        setLoading(true);
        
        const result = await getLLMRequests({
          model: filters.model.length > 0 ? filters.model.join(',') : undefined,
          status: 'success', // Only show successful responses
          page: responsesPagination.page,
          page_size: responsesPagination.page_size,
          from_time: filters.customDateRange?.from?.toISOString(),
          to_time: filters.customDateRange?.to?.toISOString(),
          time_range: !filters.customDateRange ? filters.timeRange : undefined
        });
        
        // Transform request data to response format
        const transformedResponses: LLMResponse[] = result.items.map(request => ({
          id: request.id,
          model: request.model || '',
          category: request.agent_id || 'general',
          title: request.content ? request.content.substring(0, 50) : 'Unknown',
          prompt: request.content || '',
          response: request.response || '',
          created_at: request.timestamp || new Date().toISOString(),
          tokens: (request.input_tokens || 0) + (request.output_tokens || 0),
          quality_score: 3.5 // Default score as we don't have real quality scores
        }));
        
        setResponses(transformedResponses);
        setResponsesPagination(result.pagination);
      } catch (error) {
        console.error('Error fetching responses data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResponsesData();
  }, [activeTab, filters.model, filters.customDateRange, filters.timeRange, responsesPagination.page, responsesPagination.page_size]);
  
  // Fetch required data when filters change
  useEffect(() => {
    const fetchData = async (resetData = false) => {
      // Only fetch data if we're on the dashboard tab or if forcing a refresh
      if (activeTab !== 0 && !resetData) return;
      
      // Reset error states for new fetch
      setLoading(true);
      setMetrics({
        totalRequests: 0,
        totalTokens: 0,
        estimatedCost: 0,
      });
      setModelData([]);
      setTimeSeriesData([]);
      setAgentData([]);
      setCostData({
        totalCost: 0,
        previousPeriodCost: 0,
        costByModel: [],
        costByAgent: [],
        dailyCosts: [],
        costEfficiency: []
      });
      setRequests([]);
      setResponses([]);
      setPagination({
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      });
      setSelectedRequestId(null);
      setSelectedTraceId(null);
      setSelectedResponseId(null);

      try {
        // Prepare API parameters
        const apiParams = {
          agent_id: filters.agent.length > 0 ? filters.agent.join(',') : undefined,
          model_name: filters.model.length > 0 ? filters.model.join(',') : undefined,
          from_time: filters.customDateRange?.from?.toISOString(),
          to_time: filters.customDateRange?.to?.toISOString(),
          time_range: !filters.customDateRange ? filters.timeRange : undefined,
          granularity: "day"
        };
        
        // Execute all requests in parallel using our API functions with proper types
        const analyticsResult = await getLLMAnalytics(apiParams);
        const modelComparisonResult = await getLLMModelComparison(apiParams);
        const usageTrendsResult = await getLLMUsageTrends(apiParams);
        const agentUsageResult = await getLLMAgentUsage(apiParams);
        const relationshipsResult = await getAgentModelRelationships(apiParams);

        // Type assert each result
        const analyticsData = analyticsResult as LLMAnalyticsResponse;
        const modelComparisonData = modelComparisonResult as LLMAnalyticsResponse;
        const usageTrendsData = usageTrendsResult as LLMAnalyticsResponse;
        const agentUsageData = agentUsageResult as LLMAnalyticsResponse;
        const relationshipsData = relationshipsResult as LLMAnalyticsResponse;
        
        // Process analytics data for header metrics
        if (analyticsData && analyticsData.total) {
          const totalTokens = analyticsData.total.token_count_total || 
                             (analyticsData.total.token_count_input || 0) + (analyticsData.total.token_count_output || 0);
          
          setMetrics({
            totalRequests: analyticsData.total.request_count || 0,
            totalTokens: totalTokens,
            estimatedCost: analyticsData.total.estimated_cost_usd || 0
          });
          
          console.log("Total tokens calculation:", {
            total: analyticsData.total.token_count_total,
            input: analyticsData.total.token_count_input,
            output: analyticsData.total.token_count_output,
            calculated: totalTokens
          });
        }
        
        // Process model comparison data
        if (modelComparisonData && Array.isArray(modelComparisonData.breakdown)) {
          // Process model data
          const processedModelData: ModelUsageData[] = modelComparisonData.breakdown.map(model => ({
            name: model.key || 'unknown',
            requests: model.metrics?.request_count || 0,
            input_tokens: model.metrics?.token_count_input || 0,
            output_tokens: model.metrics?.token_count_output || 0,
            total_tokens: model.metrics?.token_count_total || 0,
            success_rate: model.metrics?.success_rate || 0,
            avg_response_time_ms: model.metrics?.response_time_avg || 0,
            p95_response_time_ms: model.metrics?.response_time_p95 || 0,
            estimated_cost: model.metrics?.estimated_cost_usd || 0,
            cost_per_1k_tokens: model.metrics?.token_count_total > 0
              ? (model.metrics?.estimated_cost_usd || 0) / (model.metrics?.token_count_total / 1000)
              : 0
          }));
          
          setModelData(processedModelData);
          
          // If total tokens is still 0, try calculating from model data
          if (metrics.totalTokens === 0 && processedModelData.length > 0) {
            const calculatedTotalTokens = processedModelData.reduce(
              (sum, model) => sum + (model.total_tokens || 0), 0
            );
            
            if (calculatedTotalTokens > 0) {
              setMetrics(prev => ({
                ...prev,
                totalTokens: calculatedTotalTokens
              }));
              
              console.log("Updated total tokens from model data:", calculatedTotalTokens);
            }
          }
          
          // Extract available models for filters
          const availableModelsList = processedModelData
            .filter(model => model.name && model.name !== 'unknown')
            .map(model => ({
              id: model.name,
              name: model.name
            }));
          
          if (availableModelsList.length > 0) {
            setAvailableModels(availableModelsList);
          }
        }
        
        // Process usage trends data
        if (usageTrendsData && Array.isArray(usageTrendsData.breakdown)) {
          // Process time series data
          const processedTimeSeriesData: TimeSeriesData[] = usageTrendsData.breakdown.map(point => ({
            date: point.key || '',
            total_requests: point.metrics?.request_count || 0,
            input_tokens: point.metrics?.token_count_input || 0,
            output_tokens: point.metrics?.token_count_output || 0,
            total_tokens: point.metrics?.token_count_total || 0,
            estimated_cost: point.metrics?.estimated_cost_usd || 0
          }));
          
          setTimeSeriesData(processedTimeSeriesData);
          
          // Also populate cost data from usage trends
          if (processedTimeSeriesData.length > 0) {
            const dailyCosts = processedTimeSeriesData.map(day => ({
              date: day.date,
              cost: day.estimated_cost,
              forecastCost: undefined
            }));
            
            setCostData(prev => ({
              ...prev,
              dailyCosts
            }));
          }
        }
        
        // Process agent usage data
        if (agentUsageData && Array.isArray(agentUsageData.breakdown)) {
          // Process agent data
          const processedAgentData: AgentUsageData[] = agentUsageData.breakdown.map(agent => {
            // Find matching agent in relationships data if available
            const models = [];
            
            if (relationshipsData && Array.isArray(relationshipsData.breakdown)) {
              // Extract model usage for this agent from relationships data
              const agentRelationships = relationshipsData.breakdown
                .filter(rel => rel.key.startsWith(agent.key + ":"))
                .map(rel => {
                  const modelName = rel.key.split(":")[1] || "unknown";
                  return {
                    name: modelName,
                    requests: rel.metrics?.request_count || 0,
                    tokens: rel.metrics?.token_count_total || 0
                  };
                });
              
              if (agentRelationships.length > 0) {
                models.push(...agentRelationships);
              }
            }
            
            // Construct agent data object
            return {
              name: agent.key || 'unknown',
              requests: agent.metrics?.request_count || 0,
              input_tokens: agent.metrics?.token_count_input || 0,
              output_tokens: agent.metrics?.token_count_output || 0,
              total_tokens: agent.metrics?.token_count_total || 0,
              estimated_cost: agent.metrics?.estimated_cost_usd || 0,
              models: models
            };
          });
          
          setAgentData(processedAgentData);
          
          // Extract available agents for filters
          const availableAgentsList = processedAgentData
            .filter(agent => agent.name && agent.name !== 'unknown')
            .map(agent => ({
              id: agent.name,
              name: agent.name
            }));
          
          if (availableAgentsList.length > 0) {
            setAvailableAgents(availableAgentsList);
          }
          
          // Process cost by agent data
          const costByAgent = processedAgentData.map(agent => ({
            name: agent.name,
            cost: agent.estimated_cost,
            tokens: agent.total_tokens
          }));
          
          setCostData(prev => ({
            ...prev,
            costByAgent
          }));
        }
        
        // Process cost data from model comparison
        if (modelComparisonData && Array.isArray(modelComparisonData.breakdown)) {
          const costByModel = modelComparisonData.breakdown.map(model => ({
            name: model.key || 'unknown',
            cost: model.metrics?.estimated_cost_usd || 0,
            tokenCost: model.metrics?.token_count_total > 0
              ? (model.metrics?.estimated_cost_usd || 0) / (model.metrics?.token_count_total / 1000) * 1000
              : 0,
            tokens: model.metrics?.token_count_total || 0
          }));
          
          // Calculate total cost and process period comparison if available
          const totalCost = modelComparisonData.total?.estimated_cost_usd || 0;
          const previousPeriodCost = modelComparisonData.total?.previous_period_cost_usd || 0;
          
          // Calculate cost efficiency data
          const costEfficiency = modelComparisonData.breakdown.map(model => ({
            name: model.key || 'unknown',
            costPerRequest: model.metrics?.request_count > 0
              ? (model.metrics?.estimated_cost_usd || 0) / model.metrics?.request_count
              : 0,
            costPerToken: model.metrics?.token_count_total > 0
              ? (model.metrics?.estimated_cost_usd || 0) / model.metrics?.token_count_total
              : 0,
            costPer1kSuccessfulTokens: model.metrics?.token_count_total > 0 && model.metrics?.success_rate > 0
              ? (model.metrics?.estimated_cost_usd || 0) / (model.metrics?.token_count_total / 1000) / (model.metrics?.success_rate / 100)
              : 0
          }));
          
          setCostData(prev => ({
            ...prev,
            totalCost,
            previousPeriodCost,
            costByModel,
            costEfficiency
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Show error state in UI through metrics
        setMetrics(prev => ({
          ...prev,
          apiError: true,
          errorMessage: 'Failed to fetch dashboard data. Please try again later.'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 0) {
      // Dashboard tab - fetch all metrics data
      fetchData();
    }
  }, [activeTab, filters]);
  
  // Add a useEffect to fetch requests data for the Conversations tab
  useEffect(() => {
    const fetchRequestsData = async () => {
      if (activeTab !== 1) return; // Only fetch when on the Conversations tab
      
      setLoading(true);
      
      try {
        const result = await getLLMRequests({
          agent_id: filters.agent.length > 0 ? filters.agent.join(',') : undefined,
          model: filters.model.length > 0 ? filters.model.join(',') : undefined,
          status: filters.status.length > 0 ? filters.status.join(',') : undefined,
          from_time: filters.customDateRange?.from?.toISOString(),
          to_time: filters.customDateRange?.to?.toISOString(),
          time_range: !filters.customDateRange ? filters.timeRange : undefined,
          page: pagination.page,
          page_size: pagination.page_size,
          query: filters.query
        });
        
        setRequests(result.items || []);
        setPagination(result.pagination || {
          page: 1,
          page_size: DEFAULT_PAGE_SIZE,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        });
      } catch (error) {
        console.error('Error fetching requests data:', error);
        
        // Show error in UI
        setRequests([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestsData();
  }, [activeTab, filters, pagination.page, pagination.page_size]);
  
  // Fix useEffect for conversation flow
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!selectedTraceId) return;
      
      setLoading(true);
      
      try {
        // The LLMConversationFlow component handles fetching conversation data
        // We don't need to fetch it here
      } catch (error) {
        console.error('Error fetching conversation flow data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversationData();
  }, [selectedTraceId]);
  
  // Handle tab change
  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex)
    // Update URL based on selected tab
    if (tabIndex === 1) {
      // For the Conversations tab
      router.push('/llm/conversations', { scroll: false })
    } else {
      // For Analytics tab
      router.push('/llm', { scroll: false })
    }
  }
  
  // Handle filter changes
  const handleFilterChange = (newFilters: LLMFilters) => {
    // Reset pagination when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    
    // Update filters
    setFilters(newFilters);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }
  
  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, page_size: pageSize }))
  }
  
  // Handle request selection
  const handleRequestClick = async (requestId: string) => {
    // No-op function - detail view is removed
    // We're keeping this function for future implementation
    console.log('Request detail view is disabled')
  }
  
  // Fetch request details - this is kept for future use
  const fetchRequestDetails = async (requestId: string) => {
    setDetailLoading(true)
    
    try {
      const requestDetailData = await getLLMRequestDetails(requestId) as LLMRequestDetail
      setSelectedRequest(requestDetailData)
    } catch (error) {
      console.error('Error fetching request details:', error)
      setSelectedRequest(null)
    } finally {
      setDetailLoading(false)
    }
  }
  
  // Handle back button from details view
  const handleBackFromDetails = () => {
    setSelectedRequestId(null)
    setSelectedRequest(null)
  }
  
  // Handle viewing conversation flow for a trace ID
  const handleViewConversation = (traceId: string) => {
    // First set the trace ID in local state
    setSelectedTraceId(traceId)
    
    // Then update the URL with the correct path-based route
    router.push(`/llm/conversations/${traceId}`, { scroll: false })
  }
  
  // Handle back button from conversation flow view
  const handleBackFromConversation = () => {
    setSelectedTraceId(null)
    // Return to the conversations list
    router.push('/llm/conversations', { scroll: false })
  }
  
  // Handle response pagination
  const handleResponsePageChange = (page: number) => {
    setResponsesPagination(prev => ({ ...prev, page }))
  }
  
  // Handle response page size change
  const handleResponsePageSizeChange = (pageSize: number) => {
    setResponsesPagination(prev => ({ ...prev, page: 1, page_size: pageSize }))
  }
  
  // Handle response selection
  const handleResponseClick = (responseId: string) => {
    setSelectedResponseId(responseId)
  }
  
  // Add this helper function to the file
  const calculateApiDateRange = (timeRange: string): { start_date?: string; end_date?: string } => {
    const now = new Date();
    let end_date = now.toISOString();
    let start_date: string | undefined;

    switch (timeRange) {
      case '1h':
        start_date = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        start_date = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        start_date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        start_date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'custom':
        // For custom date range, use the filters.customDateRange values
        if (filters.customDateRange?.from) {
          start_date = filters.customDateRange.from.toISOString();
        }
        if (filters.customDateRange?.to) {
          end_date = filters.customDateRange.to.toISOString();
        }
        break;
    }

    return { start_date, end_date };
  };
  
  // Add refresh handler
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchData(true);
  };
  
  // Generate proper breadcrumbs based on the current view
  const getBreadcrumbs = () => {
    // Don't include Home in base breadcrumbs as it's added automatically
    const baseBreadcrumbs = [];

    if (selectedTraceId) {
      // For a specific conversation
      return [
        ...baseBreadcrumbs,
        { label: 'LLM', href: '/llm' },
        { label: 'Conversations', href: '/llm/conversations' },
        { label: `Conversation ${selectedTraceId.substring(0, 8)}...`, current: true }
      ];
    } else if (activeTab === 1) {
      // For conversations tab
      return [
        ...baseBreadcrumbs,
        { label: 'LLM', href: '/llm' },
        { label: 'Conversations', current: true }
      ];
    } else {
      // For analytics tab
      return [
        ...baseBreadcrumbs,
        { label: 'LLM', current: true }
      ];
    }
  };

  // Watch for URL pathname changes
  useEffect(() => {
    // This effect runs when the component mounts or when the URL changes
    const pathname = window.location.pathname;
    
    // Check if we're on a specific conversation route
    const conversationPattern = /\/llm\/conversations\/([^\/]+)/;
    const match = pathname.match(conversationPattern);
    
    if (match && match[1]) {
      // We have a trace ID in the URL path - set the state
      setActiveTab(1); // Set to conversations tab
      setSelectedTraceId(match[1]); // Set the selected trace ID
    } else if (pathname.startsWith('/llm/conversations')) {
      // Set the active tab to conversations (tab index 1)
      setActiveTab(1);
      // Clear any selected trace ID when on the main conversations page
      setSelectedTraceId(null);
    } else if (pathname === '/llm') {
      // Reset to analytics tab if we're back at the root LLM path
      // But only if no specific tab is set in the URL
      if (!searchParamsObj.get('tab')) {
        setActiveTab(0);
      }
      // Clear any selected trace ID
      setSelectedTraceId(null);
    }
  }, [searchParamsObj]);

  return (
    <PageTemplate
      title="LLM Explorer"
      description="Analyze LLM usage, track token consumption, and monitor costs"
      breadcrumbs={getBreadcrumbs()}
      timeRange={filters.timeRange}
      onTimeRangeChange={(value) => handleFilterChange({ ...filters, timeRange: value })}
      headerContent={<RefreshButton onClick={handleRefresh} />}
    >
      <ContentSection spacing="default">
        <div className="w-full py-2 border-b">
          <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
            <Tab.List className="flex">
              <Tab className={({ selected }) => classNames('px-4 py-2 text-sm font-medium', selected ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700')}>
                Analytics
              </Tab>
              <Tab className={({ selected }) => classNames('px-4 py-2 text-sm font-medium', selected ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700')}>
                Conversations
              </Tab>
            </Tab.List>
          </Tab.Group>
        </div>
      </ContentSection>
      
      {selectedTraceId ? (
        <ContentSection spacing="default">
          <LLMConversationFlow
            traceId={selectedTraceId}
            onClose={handleBackFromConversation}
            loading={loading}
            className="w-full"
          />
        </ContentSection>
      ) : (
        <ContentSection spacing="default">
          {activeTab === 0 && (
            <div className="space-y-6">
              <ModelUsageAnalytics 
                className="w-full"
                timeRange={filters.timeRange}
              />
            </div>
          )}
          
          {activeTab === 1 && (
            <LLMRequestsTable
              requests={requests}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRequestClick={handleRequestClick}
              onViewConversation={handleViewConversation}
              loading={loading}
              className="w-full"
            />
          )}
        </ContentSection>
      )}
    </PageTemplate>
  )
} 