'use client'

import { useState, useMemo } from 'react'
import { 
  Card, 
  Title, 
  Text, 
  Flex, 
  Badge, 
  Divider, 
  Button, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels,
  Metric,
  Grid
} from '@tremor/react'
import { 
  ClockIcon, 
  DocumentTextIcon, 
  ClipboardDocumentIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  DocumentMagnifyingGlassIcon,
  CodeBracketIcon,
  CpuChipIcon,
  CheckIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DocumentIcon } from '@heroicons/react/24/outline'
import { ActivityLogIcon, BotIcon } from '@heroicons/react/24/outline'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Define request detail type
export type LLMRequestDetail = {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id?: string;
  agent_id?: string;
  agent_name?: string;
  model: string;
  provider?: string;
  status: 'success' | 'error' | 'timeout' | 'filtered' | 'pending' | 'canceled';
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens?: number;
  estimated_cost?: number;
  prompt?: string;
  completion?: string;
  content?: string;  // For user messages
  response?: string; // For assistant responses
  error?: string | null;
  metadata?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop_sequences?: string[];
    [key: string]: any;
  };
  related_events?: {
    id: string;
    timestamp: string;
    type: string;
    name: string;
  }[];
  request_data?: any;
  response_data?: any;
}

export interface LLMRequestDetailPanelProps {
  request: LLMRequestDetail | null;
  onBack: () => void;
  loading?: boolean;
  className?: string;
}

// Map status to badge color
const statusColorMap: Record<string, string> = {
  success: 'emerald',
  error: 'red',
  timeout: 'amber',
  filtered: 'purple',
  pending: 'blue',
  canceled: 'gray'
}

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long'
  }).format(date);
}

// Format cost for display
const formatCost = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$0.0000';
  return `$${value.toFixed(4)}`;
};

// Copy text to clipboard
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

export default function LLMRequestDetailPanel({
  request,
  onBack,
  loading = false,
  className
}: LLMRequestDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCompletion, setCopiedCompletion] = useState(false);
  
  // Handle copying prompt to clipboard
  const handleCopyPrompt = async () => {
    if (!request) return;
    const promptText = request.prompt || request.content || '';
    const success = await copyToClipboard(promptText);
    if (success) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };
  
  // Handle copying completion to clipboard
  const handleCopyCompletion = async () => {
    if (!request) return;
    const completionText = request.completion || request.response || '';
    const success = await copyToClipboard(completionText);
    if (success) {
      setCopiedCompletion(true);
      setTimeout(() => setCopiedCompletion(false), 2000);
    }
  };
  
  // Show loading state if needed
  if (loading) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <div className="flex justify-between items-start mb-6">
          <Button
            icon={ArrowLeftIcon}
            variant="light"
            onClick={onBack}
          >
            Back to LLM Requests
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3"></div>
          <Grid numItemsMd={3} className="gap-6">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </Grid>
          <div className="h-40 bg-gray-100 rounded"></div>
          <div className="h-40 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }
  
  // Show message if no request is selected
  if (!request) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <div className="flex justify-between items-start mb-6">
          <Button
            icon={ArrowLeftIcon}
            variant="light"
            onClick={onBack}
          >
            Back to LLM Requests
          </Button>
        </div>
        <div className="text-center py-12">
          <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <Text className="mt-4 text-lg">No request selected</Text>
          <Text className="text-gray-500">Select a request from the table to view details</Text>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex justify-between items-start mb-6">
        <Button
          icon={ArrowLeftIcon}
          variant="light"
          onClick={onBack}
        >
          Back to LLM Requests
        </Button>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/trace/${request.trace_id}`}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <DocumentMagnifyingGlassIcon className="h-4 w-4" />
            View in Trace Explorer
          </Link>
          
          {request.agent_id && (
            <Link
              href={`/agents/${request.agent_id}`}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <CpuChipIcon className="h-4 w-4" />
              View Agent
            </Link>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <Title className="text-xl">LLM Request Details</Title>
        <Text className="text-gray-500">Request ID: {request.id}</Text>
      </div>
      
      <Grid numItemsMd={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor={statusColorMap[request.status]}>
          <Flex justifyContent="start" className="gap-2">
            <div>
              <Text>Status</Text>
              <Flex alignItems="center" className="mt-1">
                <Badge color={statusColorMap[request.status]}>
                  {request.status}
                </Badge>
                {request.error && (
                  <Text className="ml-2 text-red-500 text-sm">{request.error}</Text>
                )}
              </Flex>
            </div>
          </Flex>
        </Card>
        
        <Card>
          <Text>Model</Text>
          <Metric className="text-lg mt-1">
            {request.model}
            <Text className="text-sm text-gray-500">Provider: {request.provider}</Text>
          </Metric>
        </Card>
        
        <Card>
          <Text>Timestamp</Text>
          <div className="flex items-center gap-1 mt-1">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <Text>{formatDate(request.timestamp)}</Text>
          </div>
        </Card>
      </Grid>
      
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card>
          <Text>Duration</Text>
          <Metric className="text-lg mt-1">
            {request.duration_ms < 1000
              ? `${request.duration_ms} ms`
              : `${(request.duration_ms / 1000).toFixed(2)} s`}
          </Metric>
        </Card>
        
        <Card>
          <Text>Input Tokens</Text>
          <Metric className="text-lg mt-1">{request.input_tokens.toLocaleString()}</Metric>
        </Card>
        
        <Card>
          <Text>Output Tokens</Text>
          <Metric className="text-lg mt-1">{request.output_tokens.toLocaleString()}</Metric>
        </Card>
        
        <Card>
          <Text>Estimated Cost</Text>
          <Metric className="text-lg mt-1">{formatCost(request.estimated_cost)}</Metric>
        </Card>
      </Grid>
      
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList>
          <Tab icon={DocumentTextIcon}>Content</Tab>
          <Tab icon={InformationCircleIcon}>Metadata</Tab>
          <Tab icon={CodeBracketIcon}>Parameter Settings</Tab>
          {request.agent_id && (
            <Tab icon={CpuChipIcon}>Agent Context</Tab>
          )}
        </TabList>
        
        <TabPanels>
          {/* Content Tab */}
          <TabPanel>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Title className="text-base">
                      {request.role === 'user' ? 'User Message' : 'Prompt'}
                    </Title>
                    <Button 
                      size="xs" 
                      variant="light" 
                      icon={copiedPrompt ? CheckIcon : ClipboardIcon}
                      onClick={handleCopyPrompt}
                    >
                      {copiedPrompt ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <Card className="p-4 bg-gray-50 min-h-[200px] overflow-auto whitespace-pre-wrap">
                    {request.prompt || request.content || 'No prompt/content available'}
                  </Card>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Title className="text-base">
                      {request.role === 'assistant' ? 'Assistant Message' : 'Completion'}
                    </Title>
                    <Button 
                      size="xs" 
                      variant="light" 
                      icon={copiedCompletion ? CheckIcon : ClipboardIcon}
                      onClick={handleCopyCompletion}
                    >
                      {copiedCompletion ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <Card className="p-4 bg-gray-50 min-h-[200px] overflow-auto whitespace-pre-wrap">
                    {request.completion || request.response || 'No completion/response available'}
                  </Card>
                </div>
              </div>
              
              <Card>
                <Title>Token Breakdown</Title>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <Text className="text-gray-500">Input Tokens</Text>
                    <Text className="text-lg font-medium">{request.input_tokens.toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Output Tokens</Text>
                    <Text className="text-lg font-medium">{request.output_tokens.toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Total Tokens</Text>
                    <Text className="text-lg font-medium">{request.total_tokens?.toLocaleString() || 'N/A'}</Text>
                  </div>
                </div>
                <Divider className="my-4" />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Text className="text-gray-500">Input/Output Ratio</Text>
                    <Text className="text-lg font-medium">
                      {request.output_tokens > 0
                        ? (request.input_tokens / request.output_tokens).toFixed(2)
                        : 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Tokens per Second</Text>
                    <Text className="text-lg font-medium">
                      {request.duration_ms > 0
                        ? ((request.total_tokens || 0) / (request.duration_ms / 1000)).toFixed(1)
                        : 'N/A'}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-gray-500">Cost per Token</Text>
                    <Text className="text-lg font-medium">
                      {request.estimated_cost && request.total_tokens
                        ? `$${(request.estimated_cost / request.total_tokens).toFixed(6)}`
                        : 'N/A'}
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Metadata Tab */}
          <TabPanel>
            <div className="mt-4">
              <Card>
                <Title>Request Metadata</Title>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(request.metadata || {}).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <Text className="text-gray-500 text-sm">{key}</Text>
                      <Text className="font-medium overflow-hidden text-ellipsis">
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </Text>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Parameter Settings Tab */}
          <TabPanel>
            <div className="mt-4">
              <Card>
                <Title>LLM Parameters</Title>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-500 text-sm">Temperature</Text>
                    <Text className="font-medium">{request.metadata?.temperature ?? 'Not specified'}</Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-500 text-sm">Top P</Text>
                    <Text className="font-medium">{request.metadata?.top_p ?? 'Not specified'}</Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-500 text-sm">Max Tokens</Text>
                    <Text className="font-medium">{request.metadata?.max_tokens ?? 'Not specified'}</Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-500 text-sm">Frequency Penalty</Text>
                    <Text className="font-medium">{request.metadata?.frequency_penalty ?? 'Not specified'}</Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-500 text-sm">Presence Penalty</Text>
                    <Text className="font-medium">{request.metadata?.presence_penalty ?? 'Not specified'}</Text>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-gray-500 text-sm">Stop Sequences</Text>
                    <Text className="font-medium">
                      {request.metadata?.stop_sequences
                        ? request.metadata.stop_sequences.join(', ')
                        : 'Not specified'}
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          {/* Agent Context Tab - Only shown if agent_id exists */}
          {request.agent_id && (
            <TabPanel>
              <div className="mt-4 space-y-4">
                <Card>
                  <Title>Agent Information</Title>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Text className="text-gray-500 text-sm">Agent ID</Text>
                      <Text className="font-medium">{request.agent_id}</Text>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Text className="text-gray-500 text-sm">Agent Name</Text>
                      <Text className="font-medium">{request.agent_name || 'Unnamed Agent'}</Text>
                    </div>
                  </div>
                </Card>
                
                {request.related_events && request.related_events.length > 0 && (
                  <Card>
                    <Title>Related Events</Title>
                    <div className="mt-4 space-y-2">
                      {request.related_events.map((event) => (
                        <Link 
                          key={event.id} 
                          href={`/events/${event.id}`}
                          className="p-3 bg-gray-50 rounded-lg block hover:bg-gray-100"
                        >
                          <div className="flex justify-between">
                            <Text className="font-medium">{event.name}</Text>
                            <Badge size="xs">{event.type}</Badge>
                          </div>
                          <Text className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </Text>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {!request.related_events || request.related_events.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No related events found
                  </div>
                )}
              </div>
            </TabPanel>
          )}
        </TabPanels>
      </TabGroup>
    </Card>
  );
} 