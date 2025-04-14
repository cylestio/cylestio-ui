'use client';

import { 
  Card, 
  Flex, 
  Metric, 
  Text, 
  BadgeDelta, 
  Grid, 
  Title, 
  Button, 
  Select,
  SelectItem
} from '@tremor/react';
import { WrenchScrewdriverIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  return (
    <div className="space-y-4">
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Tool Explorer</Title>
          <Text>Monitor and analyze tool executions across your platform</Text>
        </div>
        <Flex justifyContent="end" className="gap-4">
          <Select 
            value={timeRange} 
            onValueChange={onTimeRangeChange}
            className="w-32"
          >
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="1d">Last Day</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </Select>
          <Flex className="border rounded-md overflow-hidden">
            <Button
              variant={timeRange === '1h' ? "primary" : "secondary"}
              onClick={() => onTimeRangeChange('1h')}
              className="rounded-none border-0"
            >
              1h
            </Button>
            <Button
              variant={timeRange === '1d' ? "primary" : "secondary"}
              onClick={() => onTimeRangeChange('1d')}
              className="rounded-none border-0"
            >
              1d
            </Button>
            <Button
              variant={timeRange === '7d' ? "primary" : "secondary"}
              onClick={() => onTimeRangeChange('7d')}
              className="rounded-none border-0"
            >
              7d
            </Button>
            <Button
              variant={timeRange === '30d' ? "primary" : "secondary"}
              onClick={() => onTimeRangeChange('30d')}
              className="rounded-none border-0"
            >
              30d
            </Button>
          </Flex>
        </Flex>
      </Flex>
      
      <Grid numItemsMd={3} className="gap-6 mt-6">
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
      
      <Flex justifyContent="start" className="gap-2">
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