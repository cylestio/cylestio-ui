'use client'

import { 
  Text, 
  Flex, 
  Metric,
  Card,
  Grid,
} from '@tremor/react'
import { DocumentTextIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import PageHeader from '../PageHeader'

// Define the types for the metrics
export type LLMHeaderMetrics = {
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
  apiError?: boolean;
  errorMessage?: string;
}

// Define props
export interface LLMHeaderProps {
  metrics: LLMHeaderMetrics;
  activeTab: number;
  onTabChange: (index: number) => void;
  loading?: boolean;
  className?: string;
  timeRange?: string;
  onTimeRangeChange?: (value: string) => void;
}

export default function LLMHeader({ 
  metrics, 
  activeTab, 
  onTabChange, 
  loading = false,
  className = '',
  timeRange = '30d',
  onTimeRangeChange
}: LLMHeaderProps) {
  // Define breadcrumb items
  const breadcrumbs = [
    { label: 'LLM', href: '/llm', current: true },
  ];

  return (
    <div className={className}>
      <PageHeader
        title="LLM Explorer"
        description="Analyze LLM usage, track token consumption, and monitor costs"
        breadcrumbs={breadcrumbs}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        showTimeRangeFilter={!!onTimeRangeChange}
      />
      
      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="gap-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            <div>
              <Text>Total Requests</Text>
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-100 rounded w-24 mt-1"></div>
              ) : (
                <Metric>{metrics.totalRequests.toLocaleString()}</Metric>
              )}
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="indigo">
          <Flex justifyContent="start" className="gap-2">
            <ChartBarIcon className="h-6 w-6 text-indigo-500" />
            <div>
              <Text>Total Tokens</Text>
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-100 rounded w-24 mt-1"></div>
              ) : (
                <Metric>
                  {metrics.totalTokens > 0 
                    ? metrics.totalTokens.toLocaleString() 
                    : metrics.totalTokens === 0 ? "0" : "N/A"}
                </Metric>
              )}
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="emerald">
          <Flex justifyContent="start" className="gap-2">
            <CurrencyDollarIcon className="h-6 w-6 text-emerald-500" />
            <div>
              <Text>Estimated Cost</Text>
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-100 rounded w-24 mt-1"></div>
              ) : (
                <Metric>${metrics.estimatedCost.toFixed(2)}</Metric>
              )}
            </div>
          </Flex>
        </Card>
      </Grid>
    </div>
  )
} 