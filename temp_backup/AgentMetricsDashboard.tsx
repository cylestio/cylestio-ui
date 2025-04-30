'use client';

import { Grid, Title, Text, Card, Flex } from '@tremor/react';
import { 
  ClockIcon, 
  CommandLineIcon, 
  ExclamationTriangleIcon, 
  ChatBubbleBottomCenterTextIcon, 
  ShieldExclamationIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Simplified version for quick testing
export function AgentMetricsRow({ agentId, timeRange, agent }: { 
  agentId: string;
  timeRange?: string;
  agent?: any;
}) {
  // Simplified implementation
  const formatValue = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <Card className="p-4">
      <Grid numItems={2} numItemsSm={3} numItemsLg={6} className="gap-6">
        <CompactMetric 
          title="Requests" 
          value={formatValue(agent?.request_count || 0)} 
          icon={<CommandLineIcon className="h-4 w-4 text-blue-600" />}
        />
        <CompactMetric 
          title="Token Usage" 
          value={formatValue(agent?.token_usage || 0)} 
          icon={<ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-amber-600" />}
        />
        <CompactMetric 
          title="Errors" 
          value={formatValue(agent?.error_count || 0)} 
          icon={<ExclamationTriangleIcon className="h-4 w-4 text-rose-600" />}
        />
        <CompactMetric 
          title="Avg. Response" 
          value="1451.03ms" 
          icon={<ClockIcon className="h-4 w-4 text-blue-600" />}
        />
        <CompactMetric 
          title="Security Alerts" 
          value="0" 
          icon={<ShieldExclamationIcon className="h-4 w-4 text-red-600" />}
        />
        <CompactMetric 
          title="Policy Violations" 
          value="0" 
          icon={<DocumentTextIcon className="h-4 w-4 text-orange-600" />}
        />
      </Grid>
    </Card>
  );
}

// Original dashboard component for backward compatibility
export function AgentMetricsDashboard({ agent, metrics = [], agentId, timeRange }: {
  agent?: any;
  metrics?: any[];
  agentId: string;
  timeRange?: string;
}) {
  return (
    <div>
      <div className="mb-4">
        <Title>Performance Metrics</Title>
        <Text>Key metrics for this agent</Text>
      </div>
      
      <AgentMetricsRow agent={agent} agentId={agentId} timeRange={timeRange} />
    </div>
  );
}

// Helper component for compact view
function CompactMetric({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <Flex justifyContent="center" alignItems="center" className="mb-1">
        {icon}
      </Flex>
      <Text className="text-sm font-medium">{title}</Text>
      <Title className="text-xl mt-1">{value}</Title>
    </div>
  );
} 