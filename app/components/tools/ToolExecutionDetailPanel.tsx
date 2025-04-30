'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Title, 
  Text, 
  TabGroup, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel, 
  Flex, 
  Badge, 
  Button
} from '@tremor/react';
import { 
  ClockIcon, 
  ArrowLeftIcon, 
  ChartBarIcon, 
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline';

// Types
type ToolExecutionDetail = {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string;
  agent_id: string;
  agent_name: string;
  tool_name: string;
  tool_type: string;
  status: string;
  duration_ms: number;
  input: any;
  output: any;
  error: string | null;
  related_events: Array<{
    id: string;
    name: string;
    timestamp: string;
    level: string;
  }>;
};

type ToolExecutionDetailPanelProps = {
  execution: ToolExecutionDetail;
  onBackToExplorer: () => void;
  onViewInTrace: () => void;
  onViewAgent: () => void;
};

export default function ToolExecutionDetailPanel({
  execution,
  onBackToExplorer,
  onViewInTrace,
  onViewAgent
}: ToolExecutionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Format duration and determine color based on length
  const formatDuration = (ms: number): { text: string; color: 'green' | 'blue' | 'amber' | 'red' } => {
    let text = '';
    let color: 'green' | 'blue' | 'amber' | 'red' = 'green';
    
    if (ms < 100) {
      text = `${ms}ms`;
      color = 'green';
    } else if (ms < 1000) {
      text = `${ms}ms`;
      color = 'blue';
    } else if (ms < 5000) {
      text = `${(ms / 1000).toFixed(2)}s`;
      color = 'amber';
    } else {
      text = `${(ms / 1000).toFixed(2)}s`;
      color = 'red';
    }
    
    return { text, color };
  };
  
  // Get status color
  const getStatusColor = (status: string): 'green' | 'red' | 'amber' | 'blue' | 'gray' => {
    switch (status) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'timeout':
        return 'amber';
      case 'pending':
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Format JSON for display
  const formatJson = (json: any): string => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return typeof json === 'string' ? json : 'Invalid JSON';
    }
  };
  
  const duration = formatDuration(execution.duration_ms);
  
  // Handle viewing all related events
  const handleViewAllRelatedEvents = () => {
    if (execution.related_events?.length > 0) {
      const eventIds = execution.related_events.map(event => event.id);
      router.push(`/events?tool_ids=${eventIds.join(',')}`);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <Flex justifyContent="between" alignItems="start">
          <div>
            <Flex alignItems="center" className="gap-2 mb-2">
              <Button
                variant="light"
                color="gray"
                icon={ArrowLeftIcon}
                onClick={onBackToExplorer}
              >
                Back
              </Button>
              
              <Title>{execution.tool_name}</Title>
              
              <Badge color="indigo">
                {execution.tool_type}
              </Badge>
              
              <Badge color={getStatusColor(execution.status)}>
                {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
              </Badge>
              
              <Badge color={duration.color} icon={ClockIcon}>
                {duration.text}
              </Badge>
            </Flex>
            
            <Text>Execution ID: {execution.id}</Text>
            <Text>Executed at: {formatTimestamp(execution.timestamp)}</Text>
          </div>
          
          <Flex className="gap-2">
            <Button
              variant="light"
              color="indigo"
              icon={RectangleGroupIcon}
              onClick={onViewInTrace}
            >
              View in Trace
            </Button>
            
            <Button
              variant="light"
              color="indigo"
              icon={ChartBarIcon}
              onClick={onViewAgent}
            >
              View Agent
            </Button>
          </Flex>
        </Flex>
      </Card>
      
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList>
          <Tab>Details</Tab>
          <Tab>Input</Tab>
          <Tab>Output</Tab>
          <Tab>Related Events</Tab>
          <Tab>Raw Data</Tab>
        </TabList>
        
        <TabPanels>
          {/* Details Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Execution Details</Title>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
                <div>
                  <Text className="font-medium">Agent</Text>
                  <Text>{execution.agent_name} ({execution.agent_id})</Text>
                </div>
                
                <div>
                  <Text className="font-medium">Trace ID</Text>
                  <Text>{execution.trace_id}</Text>
                </div>
                
                <div>
                  <Text className="font-medium">Tool Name</Text>
                  <Text>{execution.tool_name}</Text>
                </div>
                
                <div>
                  <Text className="font-medium">Tool Type</Text>
                  <Text>{execution.tool_type}</Text>
                </div>
                
                <div>
                  <Text className="font-medium">Status</Text>
                  <Text>{execution.status}</Text>
                </div>
                
                <div>
                  <Text className="font-medium">Duration</Text>
                  <Text>{execution.duration_ms}ms</Text>
                </div>
              </div>
              
              {execution.error && (
                <div className="mt-6">
                  <Text className="font-medium text-red-600">Error</Text>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                    <Text className="text-red-600">{execution.error}</Text>
                  </div>
                </div>
              )}
            </Card>
          </TabPanel>
          
          {/* Input Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Input Parameters</Title>
              <div className="mt-4 relative">
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  icon={DocumentDuplicateIcon}
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(formatJson(execution.input))}
                >
                  Copy
                </Button>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  <code>{formatJson(execution.input)}</code>
                </pre>
              </div>
            </Card>
          </TabPanel>
          
          {/* Output Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Output</Title>
              <div className="mt-4">
                {execution.status === 'success' ? (
                  <div className="relative">
                    <Button
                      size="xs"
                      variant="light"
                      color="gray"
                      icon={DocumentDuplicateIcon}
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(formatJson(execution.output))}
                    >
                      Copy
                    </Button>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      <code>{formatJson(execution.output)}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <Flex>
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <Text className="text-red-600">
                        No output available due to {execution.status} status
                      </Text>
                    </Flex>
                    {execution.error && (
                      <Text className="text-red-600 mt-2">{execution.error}</Text>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>
          
          {/* Related Events Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Flex justifyContent="between" className="mb-4">
                <Title>Related Events</Title>
                {execution.related_events.length > 0 && (
                  <Button
                    variant="light"
                    color="blue"
                    onClick={handleViewAllRelatedEvents}
                  >
                    View All in Events Explorer
                  </Button>
                )}
              </Flex>
              
              {execution.related_events.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {execution.related_events.map((event, i) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <Flex justifyContent="between">
                        <div>
                          <Text className="font-medium">{event.name}</Text>
                          <Text className="text-xs text-gray-500">ID: {event.id}</Text>
                        </div>
                        <div className="text-right">
                          <Badge color={
                            event.level === 'ERROR' ? 'red' :
                            event.level === 'WARN' ? 'amber' :
                            event.level === 'INFO' ? 'blue' : 'gray'
                          }>
                            {event.level}
                          </Badge>
                          <Text className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</Text>
                        </div>
                      </Flex>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Text>No related events found</Text>
                </div>
              )}
            </Card>
          </TabPanel>
          
          {/* Raw Data Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Raw Execution Data</Title>
              <div className="mt-4 relative">
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  icon={DocumentDuplicateIcon}
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(formatJson(execution))}
                >
                  Copy
                </Button>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  <code>{formatJson(execution)}</code>
                </pre>
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 