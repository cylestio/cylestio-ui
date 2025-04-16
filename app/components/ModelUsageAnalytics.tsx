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

// Add type definition for TokenUsageCostData after the UsageTrendsResponse type

type TokenUsageCostData = {
  token_usage_cost: {
    breakdown: {
      model: string;
      vendor: string;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      input_price_per_1k: number;
      output_price_per_1k: number;
      input_cost: number;
      output_cost: number;
      total_cost: number;
    }[];
    totals: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      input_cost: number;
      output_cost: number;
      total_cost: number;
    };
  };
  pricing_note: string;
  update_date: string;
};

// Add after other type definitions

type LLMModelPricingData = {
  models: {
    Provider: string;
    Model: string;
    Version: string;
    "Input Price": number | string;
    "Output Price": number | string;
    "Context Window": string;
    Availability: string;
    Notes: string;
  }[];
  total_count: number;
  update_date: string;
};

// Helper function to find a model in the pricing data
const findModelInPricingData = (modelName: string, modelPricingData: LLMModelPricingData | null): any | null => {
  if (!modelPricingData?.models?.length) return null;
  
  // Simplify the model name for more lenient matching
  const simplifiedName = modelName.toLowerCase()
    .replace(/[-_\.]/g, '') // Remove hyphens, underscores, periods
    .replace(/\s+/g, '')    // Remove spaces
    .replace(/\d{8}$/, '')  // Remove date suffix
    .replace(/latest$/, ''); // Remove 'latest' suffix
  
  // Super simplified version - just extract the core model name
  const coreModelName = simplifiedName
    .replace(/claude|gpt|llama|mistral|gemini|mixtral|command|jamba|embed/, match => match) // Keep model family names
    .replace(/\d+/g, ''); // Remove all numbers
  
  // Get base family name
  let modelFamily = '';
  if (simplifiedName.includes('claude')) modelFamily = 'claude';
  else if (simplifiedName.includes('gpt')) modelFamily = 'gpt';
  else if (simplifiedName.includes('llama')) modelFamily = 'llama';
  else if (simplifiedName.includes('mistral')) modelFamily = 'mistral';
  else if (simplifiedName.includes('gemini')) modelFamily = 'gemini';
  else if (simplifiedName.includes('mixtral')) modelFamily = 'mixtral';
  
  // Determine model version/variant
  let modelVariant = '';
  if (simplifiedName.includes('3.5') || simplifiedName.includes('35')) modelVariant = '3.5';
  else if (simplifiedName.includes('3.7') || simplifiedName.includes('37')) modelVariant = '3.7';
  else if (simplifiedName.includes('3') && !simplifiedName.includes('3.')) modelVariant = '3';
  else if (simplifiedName.includes('4')) modelVariant = '4';
  
  // Get model size/type
  let modelType = '';
  if (simplifiedName.includes('sonnet')) modelType = 'sonnet';
  else if (simplifiedName.includes('haiku')) modelType = 'haiku';
  else if (simplifiedName.includes('opus')) modelType = 'opus';
  else if (simplifiedName.includes('turbo')) modelType = 'turbo';
  
  console.log(`Model matching for: ${modelName} → Family: ${modelFamily}, Variant: ${modelVariant}, Type: ${modelType}`);
  
  // Try different matching strategies in order of specificity
  
  // 1. Most specific match - try to match all three components if they exist
  if (modelFamily && modelVariant && modelType) {
    const fullMatch = modelPricingData.models.find(m => {
      const mSimple = m.Model.toLowerCase().replace(/[-_\.]/g, '').replace(/\s+/g, '');
      return mSimple.includes(modelFamily) && 
             mSimple.includes(modelVariant) && 
             mSimple.includes(modelType);
    });
    if (fullMatch) return fullMatch;
  }
  
  // 2. Try family + variant
  if (modelFamily && modelVariant) {
    const variantMatch = modelPricingData.models.find(m => {
      const mSimple = m.Model.toLowerCase().replace(/[-_\.]/g, '').replace(/\s+/g, '');
      return mSimple.includes(modelFamily) && mSimple.includes(modelVariant);
    });
    if (variantMatch) return variantMatch;
  }
  
  // 3. Try family + type
  if (modelFamily && modelType) {
    const typeMatch = modelPricingData.models.find(m => {
      const mSimple = m.Model.toLowerCase().replace(/[-_\.]/g, '').replace(/\s+/g, '');
      return mSimple.includes(modelFamily) && mSimple.includes(modelType);
    });
    if (typeMatch) return typeMatch;
  }
  
  // 4. Fall back to just family
  if (modelFamily) {
    const familyMatch = modelPricingData.models.find(m => {
      const mSimple = m.Model.toLowerCase().replace(/[-_\.]/g, '').replace(/\s+/g, '');
      return mSimple.includes(modelFamily);
    });
    if (familyMatch) return familyMatch;
  }
  
  // No matches found with our special logic, fall back to simple string matching
  // This helps with models we didn't explicitly account for
  const exactMatch = modelPricingData.models.find(
    m => m.Model.toLowerCase().replace(/[-_\.]/g, '').replace(/\s+/g, '') === simplifiedName
  );
  if (exactMatch) return exactMatch;
  
  const partialMatches = modelPricingData.models.filter(
    m => simplifiedName.includes(m.Model.toLowerCase().replace(/[-_\.]/g, '').replace(/\s+/g, ''))
  );
  
  if (partialMatches.length === 1) return partialMatches[0];
  if (partialMatches.length > 1) return partialMatches[0]; // Just take the first one
  
  // Still no match, last resort - try to match by provider
  if (modelName.includes('openai') || modelName.includes('gpt')) {
    return modelPricingData.models.find(m => m.Provider === 'OpenAI');
  }
  if (modelName.includes('anthropic') || modelName.includes('claude')) {
    return modelPricingData.models.find(m => m.Provider === 'Anthropic');
  }
  
  // No matches found
  return null;
};

// Get the display name for a model using the pricing data
const getModelDisplayName = (modelName: string, modelPricingData: LLMModelPricingData | null, includeVersion = false): string => {
  if (!modelName) return 'Unknown';
  
  // Try to find the model in the pricing data
  const modelInfo = findModelInPricingData(modelName, modelPricingData);
  
  if (modelInfo) {
    if (includeVersion && modelInfo.Version && modelInfo.Version !== '-' && modelInfo.Version !== 'N/A') {
      return `${modelInfo.Model} (${modelInfo.Version})`;
    }
    return modelInfo.Model;
  }
  
  // Fallback to basic name formatting if not found in pricing data
  const baseName = getBaseModelName(modelName);
  if (!includeVersion) return baseName;
  
  const version = getModelVersion(modelName);
  return version ? `${baseName} (${version})` : baseName;
};

// Extract the base model name without version (fallback function)
const getBaseModelName = (modelName: string): string => {
  // Extract the core model name for better grouping
  const simplified = modelName.toLowerCase()
    .replace(/-\d{8}$/, '') // Remove date (YYYYMMDD)
    .replace(/-latest$/, ''); // Remove 'latest' suffix

  // Extract core model family
  let family = '';
  if (simplified.includes('claude')) {
    family = 'Claude';
    // Add version info to family name
    if (simplified.includes('3.5') || simplified.includes('-3-5') || simplified.includes('35')) {
      family += ' 3.5';
    } else if (simplified.includes('3.7') || simplified.includes('-3-7') || simplified.includes('37')) {
      family += ' 3.7';
    } else if (simplified.includes('3')) {
      family += ' 3';
    }
    
    // Add model type to family name
    if (simplified.includes('sonnet')) {
      family += ' Sonnet';
    } else if (simplified.includes('haiku')) {
      family += ' Haiku';
    } else if (simplified.includes('opus')) {
      family += ' Opus';
    }
  } else if (simplified.includes('gpt')) {
    family = 'GPT';
    if (simplified.includes('3.5') || simplified.includes('-3-5') || simplified.includes('35')) {
      family += '-3.5';
    } else if (simplified.includes('4o')) {
      family += '-4o';
    } else if (simplified.includes('4')) {
      family += '-4';
    }
    
    if (simplified.includes('turbo')) {
      family += ' Turbo';
    }
  } else {
    // For other models, just use the original name cleaned up a bit
    return modelName.replace(/-\d{8}$/, '').replace(/-latest$/, '');
  }
  
  return family;
};

// Extract version information if present (fallback function)
const getModelVersion = (modelName: string): string => {
  // Try to match date suffix
  const dateMatch = modelName.match(/-(\d{8})$/);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    // Format as YYYY-MM-DD
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  
  // Check for 'latest' suffix
  if (modelName.includes('-latest')) {
    return 'latest';
  }
  
  return '';
};

// Normalize model name for grouping (removes versions, hyphens, etc.)
const normalizeModelName = (modelName: string): string => {
  return modelName.toLowerCase()
    .replace(/[-_]/g, '') // Remove hyphens and underscores
    .replace(/\./g, '') // Remove periods (to handle 3.5 vs 3-5)
    .replace(/\d{8}$/, '') // Remove date suffix
    .replace(/latest$/, '') // Remove 'latest' suffix
    .replace(/\s+/g, ''); // Remove spaces
};

// Get model pricing information
const getModelPricing = (modelName: string, modelPricingData: LLMModelPricingData | null): { input: number, output: number } => {
  const defaultPricing = { input: 0, output: 0 };
  
  if (!modelPricingData?.models?.length) return defaultPricing;
  
  // Try to find a matching model in pricing data
  const modelInfo = findModelInPricingData(modelName, modelPricingData);
  
  if (!modelInfo) {
    console.warn(`No pricing data found for model: ${modelName}`);
    return defaultPricing; // Return zeros if no match found, never mock data
  }
  
  // Handle pricing data from API
  let inputPrice = 0;
  let outputPrice = 0;
  
  // Convert price strings to numbers
  if (typeof modelInfo["Input Price"] === 'string') {
    const inputStr = modelInfo["Input Price"].toString();
    // Handle ranges like "0.00125–0.0025" by taking the first value
    if (inputStr.includes('–') || inputStr.includes('-')) {
      inputPrice = parseFloat(inputStr.split(/[–-]/)[0]);
    } else {
      inputPrice = parseFloat(inputStr.replace(/[^0-9.]/g, '')) || 0;
    }
  } else {
    inputPrice = modelInfo["Input Price"] || 0;
  }
  
  if (typeof modelInfo["Output Price"] === 'string') {
    const outputStr = modelInfo["Output Price"].toString();
    // Handle ranges
    if (outputStr.includes('–') || outputStr.includes('-')) {
      outputPrice = parseFloat(outputStr.split(/[–-]/)[0]);
    } else if (outputStr.toLowerCase() === 'n/a') {
      outputPrice = 0; // Handle N/A cases
    } else {
      outputPrice = parseFloat(outputStr.replace(/[^0-9.]/g, '')) || 0;
    }
  } else {
    outputPrice = modelInfo["Output Price"] || 0;
  }
  
  console.log(`Pricing for ${modelName}: Input=${inputPrice}, Output=${outputPrice}`);
  
  return {
    input: inputPrice,
    output: outputPrice
  };
};

// Group models by family
const groupModelsByFamily = (models: string[], modelPricingData: LLMModelPricingData | null): Map<string, string[]> => {
  const modelGroups = new Map<string, string[]>();
  
  models.forEach(model => {
    // Use a simpler, more aggressive grouping strategy
    let baseModelName = getBaseModelName(model);
    
    // Additional simplifications to ensure proper grouping
    if (baseModelName.includes('Claude')) {
      // Ensure consistent capitalization
      baseModelName = baseModelName.replace(/claude/i, 'Claude');
      // Remove any leftover version numbers in specific formats
      baseModelName = baseModelName.replace(/-\d+$/, '');
    } else if (baseModelName.includes('GPT')) {
      baseModelName = baseModelName.replace(/gpt/i, 'GPT');
      baseModelName = baseModelName.replace(/-\d+$/, '');
    }
    
    if (!modelGroups.has(baseModelName)) {
      modelGroups.set(baseModelName, []);
    }
    modelGroups.get(baseModelName)?.push(model);
  });
  
  return modelGroups;
};

type ModelUsageAnalyticsProps = {
  className?: string;
  timeRange?: string;
};

// Redefine pastel chart colors with better contrast for bar segments
const chartColors = [
  "#818cf8", // Primary soft blue 
  "#a78bfa", // Soft purple
  "#60a5fa", // Lighter blue
  "#34d399", // Soft green
  "#fbbf24", // Amber
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
  perTokenData: { 
    name: string; 
    baseModelName: string;
    versions?: string[];
    'Cost per 1K tokens ($)': number;
    originalData?: any;
    models?: string[];
  }[];
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
    versions?: string[];
    originalData?: any;
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
    
    // Calculate maximum values for scaling with minimums for better scaling
    let maxTotalCost = Math.max(0.01, ...data.map(d => d['Cost ($)']));
    
    // Handle case where all costs might be zero
    let maxCostPerToken = Math.max(
      0.0001, // Minimum for scale
      ...perTokenData.map(d => d['Cost per 1K tokens ($)'])
    );
    
    // Round up the max values for cleaner scale ticks (not used in original code)
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
      
      // Skip drawing the point if the cost per token is exactly zero
      if (costPerToken > 0) {
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
      } else {
        // For zero cost, draw a small hollow circle
        ctx.strokeStyle = COST_PER_TOKEN_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + barWidth/2, linePointY, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      
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
      // Draw tooltip with more detailed info
      const tooltipWidth = 240;
      const tooltipHeight = hoveredItem.versions && hoveredItem.versions.length > 0 ? 110 : 80;
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
      // Ensure we always show at least $0.00 instead of empty value
      const costStr = hoveredItem.cost >= 0 
        ? `$${hoveredItem.cost.toFixed(4)}`
        : '$0.0000';
      
      const costPerTokenStr = hoveredItem.costPerToken >= 0 
        ? `$${hoveredItem.costPerToken.toFixed(4)}`
        : '$0.0000';
      
      ctx.fillText(`Total Cost: ${costStr}`, tooltipX + 12, tooltipY + 45);
      ctx.fillText(`Cost per 1K tokens: ${costPerTokenStr}`, tooltipX + 12, tooltipY + 65);
      
      // If we have version info, show it
      if (hoveredItem.versions && hoveredItem.versions.length > 0) {
        const versionStr = hoveredItem.versions.join(', ');
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillText(`Version${hoveredItem.versions.length > 1 ? 's' : ''}: ${versionStr}`, tooltipX + 12, tooltipY + 85);
      }
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
      
      // Extra data from the token item if available
      const modelVersions = perTokenItem && perTokenItem.versions 
        ? perTokenItem.versions 
        : [];
        
      const originalData = perTokenItem && perTokenItem.originalData;
      
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
          costPerToken,
          versions: modelVersions,
          originalData
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
          costPerToken,
          versions: modelVersions,
          originalData
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

// Modify the AgentModelBarChart component to include cost data as a line
function AgentModelBarChart({ 
  data, 
  categories, 
  colors, 
  valueFormatter,
  costData, // Add cost data parameter
}: {
  data: Record<string, any>[];
  categories: string[];
  colors: string[];
  valueFormatter: (value: number) => string;
  costData?: Array<{agent: string, cost: number}>; // Optional cost data for line
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<{
    x: number;
    y: number;
    agent: string;
    category?: string;
    value: number;
    cost?: number;
    color: string;
    isCost?: boolean;
  } | null>(null);
  
  // Function to draw the entire chart
  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Update canvas size to match container
    const { width, height } = container.getBoundingClientRect();
    
    // If container dimensions are not ready yet, don't continue
    if (width === 0 || height === 0) {
      return;
    }
    
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
      top: 50, // More space for legend
      right: 70, // More space for cost axis
      bottom: 50, // More space for agent names
      left: 70 // Space for numbers
    };
    
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Find max total for each agent
    const maxTotal = Math.max(...data.map(agent => {
      return categories.reduce((sum, category) => sum + (agent[category] || 0), 0);
    })) || 1; // Ensure not zero
    
    // Find max cost if cost data is provided
    let maxCost = 0;
    if (costData && costData.length > 0) {
      maxCost = Math.max(...costData.map(item => item.cost)) || 0.1;
    }
    
    // Round up the max value to a nice number
    const roundUpToNice = (num: number) => {
      const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
      return Math.ceil(num / magnitude) * magnitude;
    };
    
    const niceMaxTotal = roundUpToNice(maxTotal);
    // For cost, we want to round to a nice decimal for dollars
    const niceMaxCost = maxCost <= 0.1 ? 0.1 : Math.ceil(maxCost * 10) / 10;
    
    // Set up bar dimensions
    const barCount = data.length;
    const barWidth = Math.min(80, chartWidth / (barCount * 1.5)); // Cap width at 80px
    const totalBarSpace = barWidth * barCount;
    const barSpacing = (chartWidth - totalBarSpace) / (barCount + 1);
    
    // Draw background grid
    ctx.strokeStyle = '#E5E7EB'; // Light gray
    ctx.lineWidth = 1;
    
    // Draw y-axis ticks and grid lines for requests
    const tickCount = 5;
    ctx.fillStyle = '#6B7280'; // Text color
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= tickCount; i++) {
      const value = niceMaxTotal * (i / tickCount);
      const y = chartHeight - (value / niceMaxTotal * chartHeight) + chartPadding.top;
      
      // Draw gridline
      ctx.beginPath();
      ctx.moveTo(chartPadding.left, y);
      ctx.lineTo(width - chartPadding.right, y);
      ctx.stroke();
      
      // Draw tick label
      ctx.fillText(valueFormatter(value), chartPadding.left - 8, y + 4);
    }
    
    // Draw y-axis ticks for cost (right side)
    if (costData && costData.length > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6B7280';
      
      for (let i = 0; i <= tickCount; i++) {
        const value = niceMaxCost * (i / tickCount);
        const y = chartHeight - (value / niceMaxCost * chartHeight) + chartPadding.top;
        
        // Draw cost tick label
        ctx.fillText(`$${value.toFixed(2)}`, width - chartPadding.right + 8, y + 4);
      }
      
      // Draw cost axis label
      ctx.save();
      ctx.translate(width - chartPadding.right / 3, chartHeight / 2 + chartPadding.top);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillText('Cost ($)', 0, 0);
      ctx.restore();
      
      // Draw requests axis label
      ctx.save();
      ctx.translate(chartPadding.left / 3, chartHeight / 2 + chartPadding.top);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillText('Requests', 0, 0);
      ctx.restore();
    }
    
    // Track segment positions for tooltip detection
    const segmentPositions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      agent: string;
      category: string;
      value: number;
      color: string;
    }> = [];
    
    // Track cost points for line and tooltip
    const costPoints: Array<{
      x: number;
      y: number;
      agent: string;
      cost: number;
    }> = [];
    
    // Draw each agent's stacked bar
    data.forEach((agent, agentIndex) => {
      const x = chartPadding.left + barSpacing + (agentIndex * (barWidth + barSpacing));
      let currentHeight = 0;
      
      // Draw each category as a segment in the stack
      categories.forEach((category, categoryIndex) => {
        const value = agent[category] || 0;
        const segmentHeight = (value / niceMaxTotal) * chartHeight;
        
        if (segmentHeight > 0) { // Only draw if there's a value
          // Pick color from the colors array (cycle if needed)
          const colorIndex = categoryIndex % colors.length;
          const color = colors[colorIndex];
          ctx.fillStyle = color;
          
          // Calculate segment position
          const segY = chartHeight + chartPadding.top - currentHeight - segmentHeight;
          
          // Draw segment
          ctx.beginPath();
          ctx.rect(x, segY, barWidth, segmentHeight);
          ctx.fill();
          
          // Add stroke around segment
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Store segment position for tooltip
          segmentPositions.push({
            x,
            y: segY,
            width: barWidth,
            height: segmentHeight,
            agent: agent.agent,
            category,
            value,
            color
          });
          
          currentHeight += segmentHeight;
        }
      });
      
      // Draw agent name (x-axis label)
      ctx.fillStyle = '#374151'; // Dark text color
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      // Format agent name
      let agentName = agent.agent || '';
      if (agentName.length > 16) {
        agentName = agentName.substring(0, 14) + '...';
      }
      
      // Draw the agent name
      ctx.fillText(agentName, x + barWidth / 2, chartHeight + chartPadding.top + 20);
      
      // Store cost point if cost data exists
      if (costData) {
        const costItem = costData.find(c => c.agent === agent.agent);
        if (costItem) {
          const costY = chartHeight - (costItem.cost / niceMaxCost * chartHeight) + chartPadding.top;
          costPoints.push({
            x: x + barWidth / 2,
            y: costY,
            agent: agent.agent,
            cost: costItem.cost
          });
        }
      }
    });
    
    // Draw cost line if we have cost data
    if (costData && costData.length > 0 && costPoints.length > 0) {
      // Draw the line connecting cost points
      ctx.beginPath();
      ctx.moveTo(costPoints[0].x, costPoints[0].y);
      for (let i = 1; i < costPoints.length; i++) {
        ctx.lineTo(costPoints[i].x, costPoints[i].y);
      }
      ctx.strokeStyle = '#EF4444'; // Red line
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw points
      costPoints.forEach(point => {
        // Outer stroke
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Inner dot
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444'; // Red dot
        ctx.fill();
      });
    }
    
    // Draw legend with better styling
    const modelLegendItemWidth = Math.min(100, width / Math.min(categories.length, 6));
    const modelLegendFullWidth = modelLegendItemWidth * Math.min(categories.length, 6);
    const modelLegendX = (width - modelLegendFullWidth) / 2;
    const modelLegendY = 15;
    
    // Draw models legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(modelLegendX - 10, modelLegendY - 5, modelLegendFullWidth + 20, 30, 6);
    ctx.fill();
    ctx.stroke();
    
    // Draw model colors in legend
    categories.forEach((category, index) => {
      if (index < 6) { // Show at most 6 in the first row
        const itemX = modelLegendX + (index * modelLegendItemWidth);
        
        // Draw color box
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.rect(itemX, modelLegendY + 5, 12, 12);
        ctx.fill();
        
        // Add stroke around color box
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw category name
        ctx.fillStyle = '#374151';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        
        let displayName = category;
        if (displayName.length > 10) {
          displayName = displayName.substring(0, 8) + '...';
        }
        
        ctx.fillText(displayName, itemX + 18, modelLegendY + 15);
      }
    });
    
    // Add cost line to legend if we have cost data
    if (costData && costData.length > 0) {
      const costLegendX = width - 90;
      const costLegendY = 50;
      
      // Draw cost legend background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.roundRect(costLegendX - 10, costLegendY - 5, 80, 30, 6);
      ctx.fill();
      ctx.stroke();
      
      // Draw line sample
      ctx.beginPath();
      ctx.moveTo(costLegendX, costLegendY + 10);
      ctx.lineTo(costLegendX + 20, costLegendY + 10);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw point sample
      ctx.beginPath();
      ctx.arc(costLegendX + 10, costLegendY + 10, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      
      // Draw cost label
      ctx.fillStyle = '#374151';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Cost ($)', costLegendX + 25, costLegendY + 13);
    }
    
    // Draw tooltip if hovering over a segment or cost point
    if (hoveredItem) {
      // Calculate tooltip dimensions and position
      const tooltipPadding = 10;
      const tooltipWidth = 200;
      const tooltipHeight = hoveredItem.isCost ? 60 : 70;
      const tooltipX = Math.min(Math.max(hoveredItem.x, 10), width - tooltipWidth - 10);
      const tooltipY = Math.max(10, hoveredItem.y - tooltipHeight - 10);
      
      // Draw tooltip background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
      ctx.fill();
      ctx.shadowColor = 'transparent'; // Reset shadow
      
      // Draw tooltip border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw color indicator in tooltip
      ctx.fillStyle = hoveredItem.color;
      ctx.beginPath();
      ctx.rect(tooltipX + tooltipPadding, tooltipY + tooltipPadding, 12, 12);
      ctx.fill();
      
      // Add border to color indicator
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw tooltip content
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      
      // Draw agent name
      ctx.fillText(hoveredItem.agent, tooltipX + tooltipPadding + 20, tooltipY + tooltipPadding + 10);
      
      if (hoveredItem.isCost) {
        // Draw cost value
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText(
          `Cost: $${hoveredItem.value.toFixed(2)}`,
          tooltipX + tooltipPadding, 
          tooltipY + tooltipPadding + 30
        );
      } else {
        // Draw model name and value
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText(
          `Model: ${hoveredItem.category}`, 
          tooltipX + tooltipPadding, 
          tooltipY + tooltipPadding + 30
        );
        
        // Draw value
        ctx.fillText(
          `Requests: ${valueFormatter(hoveredItem.value)}`,
          tooltipX + tooltipPadding, 
          tooltipY + tooltipPadding + 50
        );
      }
    }
    
    // Mark as rendered
    setIsRendered(true);
  };
  
  // Handle mouse movements for tooltips
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !data?.length || !categories?.length) return;
    
    // Get mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Set up chart dimensions (must match the ones in drawChart)
    const { width, height } = container.getBoundingClientRect();
    
    const chartPadding = {
      top: 50,
      right: 70,
      bottom: 50,
      left: 70
    };
    
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Find max total for each agent
    const maxTotal = Math.max(...data.map(agent => {
      return categories.reduce((sum, category) => sum + (agent[category] || 0), 0);
    })) || 1;
    
    // Find max cost if cost data is provided
    let maxCost = 0;
    if (costData && costData.length > 0) {
      maxCost = Math.max(...costData.map(item => item.cost)) || 0.1;
    }
    
    const roundUpToNice = (num: number) => {
      const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
      return Math.ceil(num / magnitude) * magnitude;
    };
    
    const niceMaxTotal = roundUpToNice(maxTotal);
    const niceMaxCost = maxCost <= 0.1 ? 0.1 : Math.ceil(maxCost * 10) / 10;
    
    // Set up bar dimensions
    const barCount = data.length;
    const barWidth = Math.min(80, chartWidth / (barCount * 1.5));
    const totalBarSpace = barWidth * barCount;
    const barSpacing = (chartWidth - totalBarSpace) / (barCount + 1);
    
    // Variables to track what we hover over
    let foundSegment = false;
    let newHoveredItem = null;
    
    // First check if we're hovering over a cost point (take precedence)
    if (costData && costData.length > 0) {
      for (let agentIndex = 0; agentIndex < data.length; agentIndex++) {
        const agent = data[agentIndex].agent;
        const costItem = costData.find(c => c.agent === agent);
        
        if (costItem) {
          const x = chartPadding.left + barSpacing + (agentIndex * (barWidth + barSpacing)) + barWidth / 2;
          const y = chartHeight - (costItem.cost / niceMaxCost * chartHeight) + chartPadding.top;
          
          // Check if mouse is near the cost point (within 8px radius)
          const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
          if (distance <= 8) {
            foundSegment = true;
            newHoveredItem = {
              x: mouseX,
              y: mouseY,
              agent,
              value: costItem.cost,
              color: '#EF4444',
              isCost: true
            };
            break;
          }
        }
      }
    }
    
    // If we didn't find a cost point, check for bar segments
    if (!foundSegment) {
      // Check each agent bar
      data.forEach((agent, agentIndex) => {
        const x = chartPadding.left + barSpacing + (agentIndex * (barWidth + barSpacing));
        let currentHeight = 0;
        
        // Check each category segment
        for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
          const category = categories[categoryIndex];
          const value = agent[category] || 0;
          const segmentHeight = (value / niceMaxTotal) * chartHeight;
          
          if (segmentHeight > 0) {
            const segY = chartHeight + chartPadding.top - currentHeight - segmentHeight;
            
            // Check if mouse is over this segment
            if (
              mouseX >= x && 
              mouseX <= x + barWidth &&
              mouseY >= segY &&
              mouseY <= segY + segmentHeight
            ) {
              foundSegment = true;
              const colorIndex = categoryIndex % colors.length;
              newHoveredItem = {
                x: mouseX,
                y: mouseY,
                agent: agent.agent,
                category,
                value,
                color: colors[colorIndex]
              };
              break;
            }
            
            currentHeight += segmentHeight;
          }
        }
        
        if (foundSegment) return; // Exit the loop early if we found a segment
      });
    }
    
    // Update hoveredItem state if needed
    if (JSON.stringify(newHoveredItem) !== JSON.stringify(hoveredItem)) {
      setHoveredItem(newHoveredItem);
      // Redraw with the new hover state
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
    if (!data || data.length === 0 || !categories || categories.length === 0) return;
    
    // Initial draw attempt
    drawChart();
    
    // If the chart didn't render on first try (container size issues),
    // try again after a short delay
    if (!isRendered) {
      const timer = setTimeout(() => {
        drawChart();
      }, 200);
      
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
  }, [data, categories, colors, valueFormatter, costData, isRendered, hoveredItem]);
  
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
  const [tokenPricingData, setTokenPricingData] = useState<TokenUsageCostData | null>(null);
  const [modelPricingData, setModelPricingData] = useState<LLMModelPricingData | null>(null);
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
          granularity: 'day'
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
      
      // Fetch token pricing data from dedicated endpoint
      try {
        const pricingParams = buildQueryParams({ 
          time_range: timeRange
        });
        console.log(`Fetching token pricing data from: ${METRICS.TOKEN_USAGE_COST}${pricingParams}`);
        const pricingResponse = await fetchAPI<TokenUsageCostData>(`${METRICS.TOKEN_USAGE_COST}${pricingParams}`);
        console.log('Token pricing data received:', pricingResponse);
        setTokenPricingData(pricingResponse);
      } catch (err) {
        console.error('Failed to fetch token pricing data:', err);
        // Don't set error as this is secondary data
      }
      
      // Fetch model pricing data
      try {
        console.log('Fetching model pricing data from:', METRICS.LLM_MODELS_PRICING);
        const modelPricingResponse = await fetchAPI<LLMModelPricingData>(METRICS.LLM_MODELS_PRICING);
        console.log('Model pricing data received:', modelPricingResponse);
        setModelPricingData(modelPricingResponse);
      } catch (err) {
        console.error('Failed to fetch model pricing data:', err);
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
      const displayName = getModelDisplayName(item.key, modelPricingData, false);
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
      const displayName = getModelDisplayName(item.key, modelPricingData, false);
      return {
        name: displayName,
        'Response Time (ms)': item.metrics.response_time_avg,
        'p95 Response Time (ms)': item.metrics.response_time_p95
      };
    });
  };

  const getModelComparisonData = () => {
    if (!modelData?.breakdown) return [];
    
    // Group models by family for the chart
    const modelFamilies = new Map<string, {
      displayName: string,
      models: { 
        key: string,
        version: string,
        metrics: typeof modelData.breakdown[0]['metrics']
      }[],
      aggregatedMetrics: {
        request_count: number,
        token_count_total: number,
        token_count_input: number,
        token_count_output: number,
        estimated_cost_usd: number,
        response_time_avg: number,
        response_time_p95: number,
        success_rate: number,
        error_rate: number
      }
    }>();
    
    // Process each model in the breakdown
    modelData.breakdown.forEach(item => {
      const baseModelName = getBaseModelName(item.key);
      const version = getModelVersion(item.key);
      
      // If this model family doesn't exist yet, create it
      if (!modelFamilies.has(baseModelName)) {
        modelFamilies.set(baseModelName, {
          displayName: baseModelName,
          models: [],
          aggregatedMetrics: {
            request_count: 0,
            token_count_total: 0,
            token_count_input: 0,
            token_count_output: 0,
            estimated_cost_usd: 0,
            response_time_avg: 0,
            response_time_p95: 0,
            success_rate: 0,
            error_rate: 0
          }
        });
      }
      
      // Add this model's data to its family
      const family = modelFamilies.get(baseModelName)!;
      family.models.push({
        key: item.key,
        version: version,
        metrics: item.metrics
      });
      
      // Aggregate metrics
      family.aggregatedMetrics.request_count += item.metrics.request_count;
      family.aggregatedMetrics.token_count_total += item.metrics.token_count_total;
      family.aggregatedMetrics.token_count_input += item.metrics.token_count_input;
      family.aggregatedMetrics.token_count_output += item.metrics.token_count_output;
      family.aggregatedMetrics.estimated_cost_usd += item.metrics.estimated_cost_usd;
      
      // For averages, we'll need to calculate weighted averages later
      family.aggregatedMetrics.response_time_avg += item.metrics.response_time_avg * item.metrics.request_count;
      family.aggregatedMetrics.response_time_p95 += item.metrics.response_time_p95 * item.metrics.request_count;
      family.aggregatedMetrics.success_rate += item.metrics.success_rate * item.metrics.request_count;
      family.aggregatedMetrics.error_rate += item.metrics.error_rate * item.metrics.request_count;
    });
    
    // Convert map to array and finalize calculations
    return Array.from(modelFamilies.entries()).map(([baseModelName, family]) => {
      // Calculate weighted averages
      if (family.aggregatedMetrics.request_count > 0) {
        family.aggregatedMetrics.response_time_avg /= family.aggregatedMetrics.request_count;
        family.aggregatedMetrics.response_time_p95 /= family.aggregatedMetrics.request_count;
        family.aggregatedMetrics.success_rate /= family.aggregatedMetrics.request_count;
        family.aggregatedMetrics.error_rate /= family.aggregatedMetrics.request_count;
      }
      
      // Get the versions string for display if needed
      const versionsString = family.models
        .map(m => m.version)
        .filter(v => v) // Filter out empty versions
        .join(', ');
      
      // For the table we just want the family name without versions
      return {
        name: family.displayName,
        baseModelName: baseModelName,
        originalModels: family.models.map(m => m.key),
        versions: versionsString,
        requests: family.aggregatedMetrics.request_count,
        tokens: family.aggregatedMetrics.token_count_total,
        inputTokens: family.aggregatedMetrics.token_count_input,
        outputTokens: family.aggregatedMetrics.token_count_output,
        responseTime: family.aggregatedMetrics.response_time_avg,
        cost: family.aggregatedMetrics.estimated_cost_usd,
        'Cost ($)': family.aggregatedMetrics.estimated_cost_usd,
        successRate: family.aggregatedMetrics.success_rate
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
        // Split the key into agent and model parts
        const parts = item.key.split(':');
        const agentId = parts[0];
        // If there's a model part, use it, otherwise use 'unknown'
        const modelName = parts.length > 1 ? parts[1] : 'unknown';
        const displayModelName = getModelDisplayName(modelName, modelPricingData, false);
        
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
    // Always prioritize token pricing data from token_usage_cost endpoint
    if (tokenPricingData?.token_usage_cost?.breakdown) {
      console.log('Using token pricing data for cost per token');
      
      // Group models by family for aggregation
      const modelFamilies = new Map<string, {
        displayName: string,
        totalTokens: number,
        totalCost: number,
        versions: string[],
        prices: { input: number, output: number }[]
      }>();
      
      // Process each model in the breakdown
      tokenPricingData.token_usage_cost.breakdown
        .forEach(item => { // Include ALL models, even those with zero tokens
          // Use the more robust model name handling
          const modelName = item.model;
          const displayName = getBaseModelName(modelName); // Use our simplified grouping
          const version = getModelVersion(modelName);
          
          // If this model family doesn't exist yet, create it
          if (!modelFamilies.has(displayName)) {
            modelFamilies.set(displayName, {
              displayName: displayName,
              totalTokens: 0,
              totalCost: 0,
              versions: [],
              prices: []
            });
          }
          
          // Add this model's data to its family
          const family = modelFamilies.get(displayName)!;
          family.totalTokens += item.total_tokens;
          family.totalCost += item.total_cost;
          
          if (version && !family.versions.includes(version)) {
            family.versions.push(version);
          }
          
          // Prefer actual usage-based pricing from the API
          const inputPrice = item.input_price_per_1k || 0;
          const outputPrice = item.output_price_per_1k || 0;
          
          // Always add pricing info, even if total tokens is zero
          family.prices.push({
            input: inputPrice,
            output: outputPrice
          });
        });
      
      // Convert map to array for the chart
      return Array.from(modelFamilies.entries()).map(([familyName, family]) => {
        // Calculate the average price (using max of input/output for each model)
        const prices = family.prices.map(p => Math.max(p.input || 0, p.output || 0));
        
        // Filter out zero prices
        const nonZeroPrices = prices.filter(p => p > 0);
        
        // Ensure we have at least one price entry, default to 0 if empty
        const avgPrice = nonZeroPrices.length > 0 
          ? nonZeroPrices.reduce((sum, price) => sum + price, 0) / nonZeroPrices.length 
          : 0;
        
        return {
          name: family.displayName,
          baseModelName: family.displayName,
          versions: family.versions,
          'Cost per 1K tokens ($)': avgPrice,
          originalData: family
        };
      });
    }
    
    // Fallback to calculated cost from model data if no token pricing data available
    if (!modelData?.breakdown) return [];
    
    console.log('Falling back to model data for cost per token');
    
    // Group models by family
    const modelFamilies = new Map<string, {
      displayName: string,
      totalTokens: number,
      totalCost: number,
      models: string[]
    }>();
    
    modelData.breakdown.forEach(item => {
      const displayName = getBaseModelName(item.key);
      
      if (!modelFamilies.has(displayName)) {
        modelFamilies.set(displayName, {
          displayName: displayName,
          totalTokens: 0,
          totalCost: 0,
          models: []
        });
      }
      
      const family = modelFamilies.get(displayName)!;
      family.totalTokens += item.metrics.token_count_total;
      family.totalCost += item.metrics.estimated_cost_usd;
      family.models.push(item.key);
    });
    
    return Array.from(modelFamilies.values()).map(family => {
      // Calculate cost per token from usage data (no mock values)
      const costPer1KTokens = family.totalTokens > 0 
        ? (family.totalCost / (family.totalTokens / 1000))
        : 0;
        
      return {
        name: family.displayName,
        baseModelName: family.displayName,
        models: family.models,
        'Cost per 1K tokens ($)': costPer1KTokens
      };
    });
  };

  const getAgentModelBreakdown = () => {
    if (!relationshipData) return [];
    
    // First get all unique agents and models
    const agents = new Set<string>();
    const models = new Set<string>();
    
    relationshipData.forEach(item => {
      const parts = item.key.split(':');
      const agentId = parts[0]; 
      const modelName = parts.length > 1 ? parts[1] : 'unknown';
      agents.add(agentId);
      models.add(modelName);
    });
    
    // Create a map of agent to model usage
    const agentModelData: Record<string, Record<string, number>> = {};
    
    // Initialize data structure
    agents.forEach(agent => {
      agentModelData[agent] = {};
      models.forEach(model => {
        agentModelData[agent][model] = 0;
      });
    });
    
    // Fill in the data
    relationshipData.forEach(item => {
      const parts = item.key.split(':');
      const agentId = parts[0];
      const modelName = parts.length > 1 ? parts[1] : 'unknown';
      agentModelData[agentId][modelName] = item.metrics.request_count;
    });
    
    // Convert to array format needed for the chart
    return Array.from(agents).map(agent => {
      const result: Record<string, any> = { agent };
      models.forEach(model => {
        // For agent usage, show model with version for better detail
        const displayName = getModelDisplayName(model, modelPricingData, true);
        result[displayName] = agentModelData[agent][model];
      });
      return result;
    }).sort((a, b) => {
      // Sort by total requests (descending)
      const totalA = Object.entries(a)
        .filter(([key]) => key !== 'agent')
        .reduce((sum, [, value]) => sum + (value as number), 0);
        
      const totalB = Object.entries(b)
        .filter(([key]) => key !== 'agent')
        .reduce((sum, [, value]) => sum + (value as number), 0);
        
      return totalB - totalA;
    }).slice(0, 6); // Show top 6 agents
  };

  const getModelCategories = () => {
    if (!relationshipData) return [];
    
    const models = new Set<string>();
    
    relationshipData.forEach(item => {
      const parts = item.key.split(':');
      const modelName = parts.length > 1 ? parts[1] : 'unknown';
      models.add(modelName);
    });
    
    // Return model display names with versions for the agent chart
    return Array.from(models).map(model => getModelDisplayName(model, modelPricingData, true));
  };

  // Function to get agent model costs - moved inside component to access relationshipData
  const getAgentModelCosts = () => {
    if (!relationshipData) return [];
    
    // Calculate total cost per agent
    const agentCosts: Record<string, number> = {};
    
    relationshipData.forEach(item => {
      const parts = item.key.split(':');
      const agentId = parts[0];
      
      if (!agentCosts[agentId]) {
        agentCosts[agentId] = 0;
      }
      
      agentCosts[agentId] += item.metrics.estimated_cost_usd || 0;
    });
    
    // Format for the chart
    return Object.entries(agentCosts).map(([agent, cost]) => ({
      agent,
      cost
    }));
  };

  // Add a debug message if model pricing data is available
  useEffect(() => {
    if (modelPricingData) {
      console.log('Model pricing data available:', modelPricingData.models.length, 'models');
    }
  }, [modelPricingData]);

  // Return component JSX
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
      
      {isLoading && <LoadingState className="py-8" />}
      
      {error && <ErrorMessage message={error} />}
      
      {!isLoading && !error && (!modelData || (!modelData.breakdown || modelData.breakdown.length === 0)) && (
        <EmptyState
          title="No Model Usage Data Available"
          description="There is no model usage data available for the selected time range."
        />
      )}
      
      {!isLoading && !error && modelData && modelData.breakdown && modelData.breakdown.length > 0 && (
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mt-4">
          <Tab icon={ChartPieIcon}>Overview</Tab>
            <Tab icon={ChartBarIcon}>Performance</Tab>
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
                          <TableCell className="font-medium">
                            {item.name}
                            {item.versions && item.versions.length > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({item.versions})
                              </span>
                            )}
                          </TableCell>
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
            <div className="grid grid-cols-1 mt-6">
              <Card>
                <Title>Model Usage & Cost by Agent</Title>
                <Text>Distribution of requests by agent with model breakdown and associated costs</Text>
                <div className="mt-6 h-80">
                  <AgentModelBarChart
                    data={getAgentModelBreakdown()}
                    categories={getModelCategories()}
                    colors={chartColors}
                    valueFormatter={(value) => `${formatNumber(Number(value))}`}
                    costData={getAgentModelCosts()}
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
      )}
    </DashboardCard>
  );
} 