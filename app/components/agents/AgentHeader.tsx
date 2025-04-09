'use client';

import { Card, Title, Text, Badge, Flex, Grid, Metric } from '@tremor/react';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CpuChipIcon 
} from '@heroicons/react/24/outline';

// Types
type Agent = {
  agent_id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  configuration?: Record<string, any>;
  metrics?: {
    request_count: number;
    token_usage: number;
    error_count: number;
    avg_response_time?: number;
    success_rate?: number;
    cost_estimate?: number;
    session_count?: number;
    avg_session_duration?: number;
    top_tools?: { name: string; count: number }[];
  };
};

interface AgentHeaderProps {
  agent: Agent;
  lastUpdated: Date;
}

export function AgentHeader({ agent, lastUpdated }: AgentHeaderProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge icon={CheckCircleIcon} color="green">Active</Badge>;
      case 'inactive':
        return <Badge icon={XCircleIcon} color="gray">Inactive</Badge>;
      case 'error':
        return <Badge icon={ExclamationTriangleIcon} color="red">Error</Badge>;
      default:
        return <Badge color="blue">{status}</Badge>;
    }
  };

  return (
    <Card>
      <div className="mb-5">
        <Flex justifyContent="between" alignItems="center">
          <Flex justifyContent="start" alignItems="center" className="space-x-3">
            <CpuChipIcon className="h-8 w-8 text-blue-500" />
            <div>
              <Title>{agent.name}</Title>
              <Text>ID: {agent.agent_id}</Text>
            </div>
          </Flex>
          <StatusBadge status={agent.status} />
        </Flex>
      </div>

      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        <div className="space-y-1">
          <Text>Type</Text>
          <div className="font-medium">{agent.type}</div>
        </div>
        
        <div className="space-y-1">
          <Text>Created</Text>
          <div className="font-medium">{formatTimestamp(agent.created_at)}</div>
        </div>
        
        <div className="space-y-1">
          <Text>Last Updated</Text>
          <div className="font-medium">{formatTimestamp(agent.updated_at)}</div>
        </div>
        
        <div className="space-y-1">
          <Text>Last Checked</Text>
          <div className="font-medium">{lastUpdated.toLocaleString()}</div>
        </div>
      </Grid>

      {agent.description && (
        <div className="mt-4">
          <Text className="font-medium">Description</Text>
          <Text className="mt-1">{agent.description}</Text>
        </div>
      )}
    </Card>
  );
} 