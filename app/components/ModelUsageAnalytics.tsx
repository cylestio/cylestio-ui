'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  Title,
  Text,
  Flex,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  DonutChart,
  BarChart,
  AreaChart,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Color,
  Button,
  Legend
} from '@tremor/react'
import {
  ChartPieIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import DashboardCard from './DashboardCard'
import { fetchAPI, buildQueryParams } from '../lib/api'
import { METRICS } from '../lib/api-endpoints'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import ErrorMessage from './ErrorMessage'
import { colors } from './DesignSystem'
import { SimpleDonutChart } from './SimpleDonutChart'
import { ModelDistributionChart } from './ModelDistributionChart'
import { ResponseTimeComparisonChart } from './ResponseTimeComparisonChart'

// Define types for the API responses
type LLMAnalyticsResponse = {
  total: {
    request_count: number;
    response_time_avg: number;
    response_time_p95: number;
    success_rate: number;
    error_rate: number;
    token_count_input: number;
    token_count_output: number;
    token_count_total: number;
    estimated_cost_usd: number;
    first_seen: string;
    last_seen: string;
  };
  breakdown: {
    key: string;
    metrics: {
      request_count: number;
      response_time_avg: number;
      response_time_p95: number;
      success_rate: number;
      error_rate: number;
      token_count_input: number;
      token_count_output: number;
      token_count_total: number;
      estimated_cost_usd: number;
      first_seen: string;
      last_seen: string;
    };
  }[];
  from_time: string;
  to_time: string;
  filters: {
    agent_id: string | null;
    model_name: string | null;
    from_time: string;
    to_time: string;
    granularity: string;
  };
  breakdown_by: string;
};

type AgentModelRelationship = {
  key: string;
  metrics: {
    request_count: number;
    response_time_avg: number;
    response_time_p95: number;
    success_rate: number;
    error_rate: number;
    token_count_input: number;
    token_count_output: number;
    token_count_total: number;
    estimated_cost_usd: number;
    first_seen: string;
    last_seen: string;
  };
  relation_type: string;
  time_distribution?: {
    timestamp: string;
    request_count: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    avg_duration: number;
  }[];
  token_distribution?: {
    bucket_range: string;
    lower_bound: number;
    upper_bound: number;
    request_count: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    avg_duration: number;
  }[];
};

type UsageTrendsResponse = {
  total: {
    request_count: number;
    token_count_total: number;
    estimated_cost_usd: number;
  };
  breakdown: {
    key: string; // timestamp
    metrics: {
      request_count: number;
      token_count_input: number;
      token_count_output: number;
      token_count_total: number;
      estimated_cost_usd: number;
    };
  }[];
  from_time: string;
  to_time: string;
  filters: {
    agent_id: string | null;
    model_name: string | null;
    from_time: string;
    to_time: string;
    granularity: string;
  };
  breakdown_by: string;
};

// Friendly model name mapping
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'gpt-4': 'GPT-4',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'claude-3-haiku': 'Claude 3 Haiku'
};

type ModelUsageAnalyticsProps = {
  className?: string;
  timeRange?: string;
};

// Refined pastel colors matching Tool Execution graph reference
const chartColors = [
  "#818cf8", // Primary soft blue (similar to get_forecast)
  "#a78bfa", // Soft purple (similar to get_alerts)
  "#60a5fa", // Lighter blue
  "#34d399", // Soft green (similar to unknown)
  "#fbbf24", // Amber (similar to get_forecast2)
  "#f472b6", // Pink
  "#4ade80", // Light green
  "#38bdf8", // Sky blue
  "#a5b4fc", // Softer indigo
  "#93c5fd", // Soft blue
  "#c4b5fd", // Lavender
  "#e879f9"  // Fuchsia
];

// Define a new component for the cost analysis charts
function CostAnalysisComboChart({ data, perTokenData }: { 
  data: { name: string; 'Cost ($)': number }[];
  perTokenData: { name: string; 'Cost per 1K tokens ($)': number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{
    x: number;
    y: number;
    model: string;
    cost: number;
    costPerToken: number;
  } | null>(null);
  
  // Enhanced colors with better contrast
  const TOTAL_COST_COLOR = "rgba(16, 185, 129, 0.8)"; // Emerald with less transparency
  const COST_PER_TOKEN_COLOR = "rgba(79, 70, 229, 0.8)"; // Indigo with less transparency
  
  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get current dimensions
    const { width, height } = container.getBoundingClientRect();
    
    // If container dimensions are not ready yet, retry after a delay
    if (width === 0 || height === 0) {
      return;
    }
    
    // Update canvas size to match container
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale everything to account for device pixel ratio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up chart dimensions with better spacing
    const chartPadding = {
      top: 60, // For legend
      right: 90, // For right y-axis
      bottom: 50, // For x-axis labels
      left: 70 // For left y-axis
    };
    
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Find the max values for scaling
    const totalCosts = data.map(d => d['Cost ($)']);
    const costPerTokens = perTokenData.map(d => d['Cost per 1K tokens ($)']);
    
    let maxTotalCost = Math.max(...totalCosts);
    maxTotalCost = maxTotalCost <= 0 ? 1 : maxTotalCost;
    
    let maxCostPerToken = Math.max(...costPerTokens);
    maxCostPerToken = maxCostPerToken <= 0 ? 0.001 : maxCostPerToken;
    
    // Round up the max values for cleaner scales
    maxTotalCost = Math.ceil(maxTotalCost * 1.1);
    maxCostPerToken = Math.ceil(maxCostPerToken * 100) / 100;
    
    // Set up bar dimensions
    const barCount = data.length;
    const barWidth = Math.min(70, Math.max(40, chartWidth / (barCount * 1.5)));
    const barSpacing = Math.max(30, (chartWidth - (barWidth * barCount)) / (barCount + 1));
    
    // Better strategy for scaling to handle extreme differences
    // Using square root scale for total cost to make differences more visible
    const scaleY = (value: number, max: number) => {
      // Square root scale works better than log for moderately skewed data
      return Math.sqrt(value / max) * chartHeight;
    };
    
    // Draw background grid
    ctx.strokeStyle = '#E5E7EB'; // Light gray
    ctx.lineWidth = 1;
    
    // Draw y-axis for total cost (left)
    const tickCount = 5;
    ctx.fillStyle = '#6B7280'; // Text color
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    // Draw square root scale ticks for left y-axis (total cost)
    for (let i = 0; i <= tickCount; i++) {
      // Calculate tick values on a square root scale for more visual steps
      const ratio = (i / tickCount) * (i / tickCount); // Square the ratio for more even visual steps
      const value = maxTotalCost * ratio;
      
      const y = chartHeight - scaleY(value, maxTotalCost) + chartPadding.top;
      
      // Draw gridline
      ctx.beginPath();
      ctx.moveTo(chartPadding.left, y);
      ctx.lineTo(width - chartPadding.right, y);
      ctx.stroke();
      
      // Draw tick label
      ctx.fillText(`$${value.toFixed(2)}`, chartPadding.left - 8, y + 4);
    }
    
    // Draw y-axis for cost per token (right)
    ctx.textAlign = 'left';
    for (let i = 0; i <= tickCount; i++) {
      const value = maxCostPerToken * (i / tickCount);
      const y = chartHeight - (value / maxCostPerToken * chartHeight) + chartPadding.top;
      
      // Draw tick label on right side
      ctx.fillText(`$${value.toFixed(4)}`, width - chartPadding.right + 8, y + 4);
    }
    
    // Draw x-axis
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartPadding.left, chartHeight + chartPadding.top);
    ctx.lineTo(width - chartPadding.right, chartHeight + chartPadding.top);
    ctx.stroke();
    
    // Draw each model's data
    data.forEach((item, index) => {
      const modelName = item.name;
      const totalCost = item['Cost ($)'];
      
      // Find matching cost per token data
      const perTokenItem = perTokenData.find(d => d.name === modelName);
      const costPerToken = perTokenItem ? perTokenItem['Cost per 1K tokens ($)'] : 0;
      
      // Calculate bar position
      const x = chartPadding.left + barSpacing + (index * (barWidth + barSpacing));
      const barHeight = scaleY(totalCost, maxTotalCost);
      
      // Draw total cost bar with gradient
      const gradient = ctx.createLinearGradient(
        x, chartHeight + chartPadding.top - barHeight,
        x, chartHeight + chartPadding.top
      );
      gradient.addColorStop(0, TOTAL_COST_COLOR);
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Round the top corners of the bar for a nicer look
      const radius = 4;
      ctx.moveTo(x + radius, chartHeight + chartPadding.top - barHeight);
      ctx.lineTo(x + barWidth - radius, chartHeight + chartPadding.top - barHeight);
      ctx.arcTo(x + barWidth, chartHeight + chartPadding.top - barHeight, x + barWidth, chartHeight + chartPadding.top - barHeight + radius, radius);
      ctx.lineTo(x + barWidth, chartHeight + chartPadding.top);
      ctx.lineTo(x, chartHeight + chartPadding.top);
      ctx.lineTo(x, chartHeight + chartPadding.top - barHeight + radius);
      ctx.arcTo(x, chartHeight + chartPadding.top - barHeight, x + radius, chartHeight + chartPadding.top - barHeight, radius);
      ctx.fill();
      
      // Draw border on bar
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw cost per token as a line point
      const linePointY = chartHeight - (costPerToken / maxCostPerToken * chartHeight) + chartPadding.top;
      
      // Add a subtle glow to the point
      ctx.fillStyle = COST_PER_TOKEN_COLOR;
      ctx.beginPath();
      ctx.arc(x + barWidth/2, linePointY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw the actual point
      ctx.fillStyle = COST_PER_TOKEN_COLOR;
      ctx.beginPath();
      ctx.arc(x + barWidth/2, linePointY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw model name (x-axis label) with better placement
      ctx.fillStyle = '#374151';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      // Truncate and display model name
      let displayName = modelName;
      if (displayName.length > 14) {
        displayName = displayName.substring(0, 12) + '...';
      }
      
      // Place name horizontally for better readability
      ctx.fillText(displayName, x + barWidth/2, chartHeight + chartPadding.top + 20);
    });
    
    // Connect cost per token points with a line using a Bezier curve for smoothness
    ctx.strokeStyle = COST_PER_TOKEN_COLOR;
    ctx.lineWidth = 2;
    
    // First make sure models are sorted by their position in the chart
    const sortedTokenData = [...perTokenData].sort((a, b) => {
      const aIndex = data.findIndex(d => d.name === a.name);
      const bIndex = data.findIndex(d => d.name === b.name);
      return aIndex - bIndex;
    }).filter(item => {
      // Only include items that exist in data array
      return data.findIndex(d => d.name === item.name) !== -1;
    });
    
    if (sortedTokenData.length > 1) {
      ctx.beginPath();
      
      // Draw smooth curve connecting points
      sortedTokenData.forEach((item, index) => {
        const modelName = item.name;
        const costPerToken = item['Cost per 1K tokens ($)'];
        
        // Find position in data array
        const dataIndex = data.findIndex(d => d.name === modelName);
        if (dataIndex === -1) return;
        
        const x = chartPadding.left + barSpacing + (dataIndex * (barWidth + barSpacing)) + barWidth/2;
        const y = chartHeight - (costPerToken / maxCostPerToken * chartHeight) + chartPadding.top;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          // Use quadraticCurveTo for a smoother line
          const prevItem = sortedTokenData[index - 1];
          const prevDataIndex = data.findIndex(d => d.name === prevItem.name);
          const prevX = chartPadding.left + barSpacing + (prevDataIndex * (barWidth + barSpacing)) + barWidth/2;
          const prevY = chartHeight - (prevItem['Cost per 1K tokens ($)'] / maxCostPerToken * chartHeight) + chartPadding.top;
          
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, cpX, (prevY + y) / 2);
          ctx.quadraticCurveTo(cpX, y, x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // Draw legend with better styling
    const legendY = 20;
    const legendWidth = 440;
    const legendX = (width - legendWidth) / 2;
    
    // Draw legend background with subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, legendWidth, 32, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow
    ctx.stroke();
    
    // Total Cost legend item
    ctx.fillStyle = TOTAL_COST_COLOR;
    ctx.beginPath();
    ctx.roundRect(legendX + 15, legendY + 10, 14, 14, 2);
    ctx.fill();
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Total Cost ($)', legendX + 37, legendY + 21);
    
    // Cost per 1K tokens legend item
    ctx.fillStyle = COST_PER_TOKEN_COLOR;
    ctx.beginPath();
    ctx.arc(legendX + 190, legendY + 17, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = COST_PER_TOKEN_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX + 200, legendY + 17);
    ctx.lineTo(legendX + 220, legendY + 17);
    ctx.stroke();
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Cost per 1K tokens ($)', legendX + 230, legendY + 21);
    
    // Note about scale
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('* Total Cost uses square root scale to display both large and small values effectively', chartPadding.left, height - 15);
    
    // Draw hover tooltip if there's a hovered item
    if (hoveredItem) {
      // Draw tooltip with detailed info
      const tooltipWidth = 220;
      const tooltipHeight = 80;
      const tooltipX = Math.min(Math.max(hoveredItem.x, 10), width - tooltipWidth - 10);
      const tooltipY = Math.max(10, hoveredItem.y - tooltipHeight - 10);
      
      // Tooltip background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
      ctx.fill();
      ctx.shadowColor = 'transparent'; // Reset shadow
      
      // Tooltip border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Tooltip content
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      
      // Model name
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.fillText(hoveredItem.model, tooltipX + 12, tooltipY + 22);
      
      // Cost values with appropriate formatting
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(`Total Cost: $${hoveredItem.cost.toFixed(2)}`, tooltipX + 12, tooltipY + 45);
      ctx.fillText(`Cost per 1K tokens: $${hoveredItem.costPerToken.toFixed(4)}`, tooltipX + 12, tooltipY + 65);
    }
    
    // Mark as rendered successfully
    setIsRendered(true);
  };
  
  // Handle mouse movements for interactive tooltips
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !data?.length) return;
    
    // Get mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get current dimensions
    const { width, height } = container.getBoundingClientRect();
    
    // Set up chart dimensions (must match the ones in drawChart)
    const chartPadding = {
      top: 60,
      right: 90,
      bottom: 50,
      left: 70
    };
    
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Set up bar dimensions (same as in drawChart)
    const barCount = data.length;
    const barWidth = Math.min(70, Math.max(40, chartWidth / (barCount * 1.5)));
    const barSpacing = Math.max(30, (chartWidth - (barWidth * barCount)) / (barCount + 1));
    
    // Check if mouse is over any bar or point
    let newHoveredItem: typeof hoveredItem = null;
    
    data.forEach((item, index) => {
      const modelName = item.name;
      const totalCost = item['Cost ($)'];
      
      // Find matching cost per token data
      const perTokenItem = perTokenData.find(d => d.name === modelName);
      const costPerToken = perTokenItem ? perTokenItem['Cost per 1K tokens ($)'] : 0;
      
      // Bar position
      const x = chartPadding.left + barSpacing + (index * (barWidth + barSpacing));
      
      // Check if mouse is over the bar or point
      if (
        mouseX >= x && 
        mouseX <= x + barWidth && 
        mouseY >= chartPadding.top && 
        mouseY <= chartHeight + chartPadding.top
      ) {
        newHoveredItem = {
          x: mouseX,
          y: mouseY,
          model: modelName,
          cost: totalCost,
          costPerToken
        };
      }
      
      // Check if mouse is over the point
      const linePointY = chartHeight - (costPerToken / Math.max(...perTokenData.map(d => d['Cost per 1K tokens ($)'])) * chartHeight) + chartPadding.top;
      if (
        Math.abs(mouseX - (x + barWidth/2)) <= 10 && 
        Math.abs(mouseY - linePointY) <= 10
      ) {
        newHoveredItem = {
          x: mouseX,
          y: mouseY,
          model: modelName,
          cost: totalCost,
          costPerToken
        };
      }
    });
    
    if (JSON.stringify(newHoveredItem) !== JSON.stringify(hoveredItem)) {
      setHoveredItem(newHoveredItem);
      drawChart();
    }
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoveredItem) {
      setHoveredItem(null);
      drawChart();
    }
  };
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Initial draw attempt
    drawChart();
    
    // If the chart didn't render on first try (container size issue), 
    // try again after a short delay
    if (!isRendered) {
      const timer = setTimeout(() => {
        drawChart();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set up event listeners for interactivity
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // Add a resize observer to redraw on container size changes
    const resizeObserver = new ResizeObserver(() => {
      drawChart();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Handle window resize
    window.addEventListener('resize', drawChart);
    
    // Clean up event listeners on unmount
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawChart);
    };
  }, [data, perTokenData, isRendered, hoveredItem]);
  
  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[320px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export default function ModelUsageAnalytics({ className = '', timeRange = '30d' }: ModelUsageAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [modelData, setModelData] = useState<LLMAnalyticsResponse | null>(null);
  const [agentData, setAgentData] = useState<LLMAnalyticsResponse | null>(null);
  const [relationshipData, setRelationshipData] = useState<AgentModelRelationship[] | null>(null);
  const [trendData, setTrendData] = useState<UsageTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModelData();
  }, [timeRange]);

  const fetchModelData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch model comparisons
      const modelsParams = buildQueryParams({ 
        time_range: timeRange
      });

      try {
        const modelsResponse = await fetchAPI<LLMAnalyticsResponse>(`${METRICS.LLM_MODELS}${modelsParams}`);
        setModelData(modelsResponse);
      } catch (err) {
        console.error('Failed to fetch model comparison data:', err);
        setError('Failed to fetch model comparison data');
      }

      // Fetch agent-specific usage
      try {
        const agentParams = buildQueryParams({ 
          time_range: timeRange
        });
        const agentResponse = await fetchAPI<LLMAnalyticsResponse>(`${METRICS.LLM_AGENT_USAGE}${agentParams}`);
        setAgentData(agentResponse);
      } catch (err) {
        console.error('Failed to fetch agent usage data:', err);
        // Don't set error as this is secondary data
      }

      // Fetch agent-model relationships
      try {
        const relationshipParams = buildQueryParams({ 
          time_range: timeRange,
          include_distributions: 'true'
        });
        const relationshipsResponse = await fetchAPI<{ breakdown: AgentModelRelationship[] }>(`${METRICS.LLM_AGENT_MODEL_RELATIONSHIPS}${relationshipParams}`);
        setRelationshipData(relationshipsResponse.breakdown);
      } catch (err) {
        console.error('Failed to fetch agent-model relationship data:', err);
        // Don't set error as this is secondary data
      }

      // Fetch usage trends
      try {
        const trendsParams = buildQueryParams({ 
          time_range: timeRange,
          granularity: getGranularity(timeRange)
        });
        const trendsResponse = await fetchAPI<UsageTrendsResponse>(`${METRICS.LLM_USAGE_TRENDS}${trendsParams}`);
        setTrendData(trendsResponse);
      } catch (err) {
        console.error('Failed to fetch usage trends data:', err);
        // Don't set error as this is secondary data
      }
    } catch (error) {
      console.error('General error in fetchModelData:', error);
      setError('Failed to fetch model usage data');
    } finally {
      setIsLoading(false);
    }
  };

  const getGranularity = (range: string): string => {
    switch (range) {
      case '24h': return 'hour';
      case '7d': return 'hour';
      case '30d': return 'day';
      case '90d': return 'day';
      default: return 'day';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getModelChartData = () => {
    if (!modelData?.breakdown) return [];
    
    // Sort data by request_count in descending order for better visualization
    const sortedData = [...modelData.breakdown].sort(
      (a, b) => b.metrics.request_count - a.metrics.request_count
    );
    
    // Limit to top 8 models for better visualization if there are many
    const topModels = sortedData.slice(0, 8);
    
    // Calculate total requests for percentage calculation
    const totalRequests = sortedData.reduce(
      (sum, item) => sum + item.metrics.request_count, 0
    );
    
    return topModels.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      const percentage = totalRequests > 0 
        ? ((item.metrics.request_count / totalRequests) * 100).toFixed(1) 
        : '0';
      
      return {
        name: `${displayName} (${percentage}%)`,
        value: item.metrics.request_count
      };
    });
  };

  const getModelResponseTimeData = () => {
    if (!modelData?.breakdown) return [];
    
    return modelData.breakdown.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      return {
        name: displayName,
        'Response Time (ms)': item.metrics.response_time_avg,
        'p95 Response Time (ms)': item.metrics.response_time_p95
      };
    });
  };

  const getModelComparisonData = () => {
    if (!modelData?.breakdown) return [];
    
    return modelData.breakdown.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      return {
        name: displayName,
        requests: item.metrics.request_count,
        tokens: item.metrics.token_count_total,
        responseTime: item.metrics.response_time_avg,
        'cost': item.metrics.estimated_cost_usd,
        'Cost ($)': item.metrics.estimated_cost_usd,
        successRate: item.metrics.success_rate
      };
    });
  };

  const getTrendChartData = () => {
    if (!trendData?.breakdown) return [];
    
    return trendData.breakdown.map((item) => {
      const date = new Date(item.key);
      return {
        date: date.toLocaleDateString(),
        timestamp: item.key,
        'Requests': item.metrics.request_count,
        'Cost ($)': item.metrics.estimated_cost_usd
      };
    });
  };

  const getTopAgentModels = () => {
    if (!relationshipData) return [];
    
    return relationshipData
      .sort((a, b) => b.metrics.request_count - a.metrics.request_count)
      .slice(0, 10)
      .map(item => {
        const [agentId, modelName] = item.key.split(':');
        const displayModelName = MODEL_DISPLAY_NAMES[modelName.toLowerCase()] || modelName;
        
        return {
          agent: agentId,
          model: displayModelName,
          requests: item.metrics.request_count,
          tokens: item.metrics.token_count_total,
          responseTime: item.metrics.response_time_avg,
          cost: item.metrics.estimated_cost_usd,
          costPerToken: item.metrics.token_count_total > 0 
            ? item.metrics.estimated_cost_usd / (item.metrics.token_count_total / 1000) 
            : 0
        };
      });
  };

  const getAgentModelDistribution = () => {
    if (!agentData?.breakdown) return [];
    
    // Sort data by request_count in descending order for better visualization
    const sortedData = [...agentData.breakdown].sort(
      (a, b) => b.metrics.request_count - a.metrics.request_count
    );
    
    // Limit to top 8 agents for better visualization if there are many
    const topAgents = sortedData.slice(0, 8);
    
    // Calculate total requests for percentage calculation
    const totalRequests = sortedData.reduce(
      (sum, item) => sum + item.metrics.request_count, 0
    );
    
    return topAgents.map(item => {
      const agentName = item.key;
      const percentage = totalRequests > 0 
        ? ((item.metrics.request_count / totalRequests) * 100).toFixed(1) 
        : '0';
      
      return {
        name: `${agentName} (${percentage}%)`,
        value: item.metrics.request_count
      };
    });
  };

  const getCostPerTokenData = () => {
    if (!modelData?.breakdown) return [];
    
    return modelData.breakdown.map((item) => {
      const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
      const costPer1KTokens = item.metrics.token_count_total > 0 
        ? (item.metrics.estimated_cost_usd / (item.metrics.token_count_total / 1000)) 
        : 0;
        
      return {
        name: displayName,
        'Cost per 1K tokens ($)': costPer1KTokens
      };
    });
  };
  
  if (isLoading) {
    return (
      <DashboardCard className={className}>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Model Usage Analytics</Title>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={fetchModelData}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        <LoadingState className="py-8" />
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard className={className}>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Model Usage Analytics</Title>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={fetchModelData}
          >
            Refresh
          </Button>
        </Flex>
        <ErrorMessage message={error} />
      </DashboardCard>
    );
  }

  if (!modelData || (!modelData.breakdown || modelData.breakdown.length === 0)) {
    return (
      <DashboardCard className={className}>
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <Title>Model Usage Analytics</Title>
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={fetchModelData}
          >
            Refresh
          </Button>
        </Flex>
        <EmptyState
          title="No Model Usage Data Available"
          description="There is no model usage data available for the selected time range."
          icon={<ChartPieIcon className="h-16 w-16 text-neutral-400" />}
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={className}>
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Title>Model Usage Analytics</Title>
        <Button
          icon={ArrowPathIcon}
          variant="light"
          onClick={fetchModelData}
        >
          Refresh
        </Button>
      </Flex>

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mt-4">
          <Tab icon={ChartPieIcon}>Overview</Tab>
          <Tab icon={ClockIcon}>Performance</Tab>
          <Tab icon={CurrencyDollarIcon}>Cost Analysis</Tab>
          <Tab icon={UserGroupIcon}>Agent Usage</Tab>
          <Tab icon={ArrowTrendingUpIcon}>Trends</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <Title>Model Request Distribution</Title>
                <Text>Distribution of requests across different models</Text>
                <div className="mt-4 flex justify-center items-center">
                  <ModelDistributionChart
                    data={getModelChartData().map(item => ({
                      name: item.name,
                      count: item.value
                    }))}
                    valueFormatter={(value) => `${formatNumber(value)}`}
                    className="w-full"
                  />
                </div>
              </Card>
              
              <Card className="overflow-hidden">
                <Title>Model Comparison</Title>
                <Text>Key metrics across different models</Text>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="font-semibold">Model</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Requests</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Tokens</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Avg. Time</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Cost</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getModelComparisonData().map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.requests)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.tokens)}</TableCell>
                        <TableCell className="text-right">{formatDuration(item.responseTime)}</TableCell>
                        <TableCell className="text-right">{formatCost(item.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabPanel>
          
          {/* Performance Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card>
                <Title>Response Time Comparison</Title>
                <Text>Average and P95 response times by model</Text>
                <div className="mt-4 h-80 min-h-[320px]">
                  <ResponseTimeComparisonChart
                    data={getModelResponseTimeData()}
                    formatValue={(value) => `${value.toFixed(0)} ms`}
                    colors={["rgba(59, 130, 246, 0.7)", "rgba(139, 92, 246, 0.7)"]}
                  />
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Cost Analysis Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card>
                <Title>Cost Analysis</Title>
                <Text>Total cost and cost efficiency by model</Text>
                <div className="mt-4 h-80 min-h-[320px]">
                  <CostAnalysisComboChart 
                    data={getModelComparisonData().map(item => ({ 
                      name: item.name, 
                      'Cost ($)': item.cost 
                    }))} 
                    perTokenData={getCostPerTokenData()}
                  />
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Agent Usage Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <Title>Top Agent-Model Relationships</Title>
                <Text>Most frequently used models by agent</Text>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="font-semibold">Agent</TableHeaderCell>
                      <TableHeaderCell className="font-semibold">Model</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Requests</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Tokens</TableHeaderCell>
                      <TableHeaderCell className="font-semibold text-right">Cost</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopAgentModels().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.agent}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.requests)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.tokens)}</TableCell>
                        <TableCell className="text-right">{formatCost(item.cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              
              <Card>
                <Title>Model Usage by Agent</Title>
                <Text>Distribution of requests by agent</Text>
                <div className="mt-4 flex justify-center items-center">
                  <ModelDistributionChart
                    data={getAgentModelDistribution().map(item => ({
                      name: item.name,
                      count: item.value
                    }))}
                    valueFormatter={(value) => `${formatNumber(value)}`}
                    className="w-full"
                  />
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Trends Tab */}
          <TabPanel>
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card>
                <Title>Model Usage Trends</Title>
                <Text>Request volumes and costs over time</Text>
                <AreaChart
                  className="mt-4 h-80"
                  data={getTrendChartData()}
                  index="date"
                  categories={['Requests', 'Cost ($)']}
                  colors={["blue", "emerald"]}
                  valueFormatter={(value) => {
                    return typeof value === 'number' 
                      ? (value > 1000 ? formatNumber(value) : value.toString()) 
                      : String(value);
                  }}
                  yAxisWidth={64}
                  showLegend={true}
                  showAnimation={true}
                  showGradient={true}
                  showXAxis={true}
                  showYAxis={true}
                  autoMinValue={true}
                  curveType="natural"
                />
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </DashboardCard>
  );
} 