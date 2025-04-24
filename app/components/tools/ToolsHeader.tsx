'use client';

import { 
  Card, 
  Flex, 
  Metric, 
  Text, 
  BadgeDelta, 
  Grid, 
  Button
} from '@tremor/react';
import { WrenchScrewdriverIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../PageHeader';

// Type definition for the summary data
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

type ToolsHeaderProps = {
  summary: ToolSummary | null;
  onFilterPreset: (preset: 'all' | 'failed' | 'slow') => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
};

// Utility function to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function ToolsHeader({ 
  summary, 
  onFilterPreset, 
  timeRange, 
  onTimeRangeChange 
}: ToolsHeaderProps) {
  // Define breadcrumb items
  const breadcrumbs = [
    { label: 'Tools', href: '/tools', current: true },
  ];

  return (
    <div>
      <PageHeader
        title="Tool Explorer"
        description="Monitor and analyze tool executions across your platform"
        breadcrumbs={breadcrumbs}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />
      
      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="indigo">
          <Flex justifyContent="start" className="space-x-4">
            <WrenchScrewdriverIcon className="h-8 w-8 text-indigo-500" />
            <div>
              <Text>Total Executions</Text>
              <Metric>{summary?.total_executions.toLocaleString() || '0'}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="green">
          <Flex justifyContent="start" className="space-x-4">
            <BadgeDelta deltaType={
              summary?.success_rate && summary.success_rate >= 0.95 ? "increase" : 
              summary?.success_rate && summary.success_rate >= 0.9 ? "moderateIncrease" : 
              "decrease"
            } />
            <div>
              <Text>Success Rate</Text>
              <Metric>{summary ? `${(summary.success_rate * 100).toFixed(1)}%` : '0%'}</Metric>
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" className="space-x-4">
            <ClockIcon className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Average Duration</Text>
              <Metric>{summary ? formatDuration(summary.avg_duration_ms) : '0ms'}</Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
      
      <Flex justifyContent="start" className="gap-2 mb-6">
        <Button 
          variant="secondary" 
          onClick={() => onFilterPreset('all')}
        >
          All Tools
        </Button>
        <Button 
          variant="secondary" 
          color="red"
          icon={ExclamationTriangleIcon}
          onClick={() => onFilterPreset('failed')}
        >
          Failed Tools
        </Button>
        <Button 
          variant="secondary" 
          color="amber"
          icon={ClockIcon}
          onClick={() => onFilterPreset('slow')}
        >
          Slowest Tools
        </Button>
      </Flex>
    </div>
  );
} 