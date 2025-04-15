'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Badge,
  Button,
  Divider,
  Flex
} from '@tremor/react'
import {
  ClockIcon,
  ArrowUturnLeftIcon,
  ArrowLongRightIcon,
  ArrowLongLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { getLLMConversationFlow } from '../../lib/llm-api'
import type { LLMRequest, LLMRequestsPagination } from './LLMRequestsTable'

export interface LLMConversationFlowProps {
  traceId: string;
  onClose: () => void;
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

// Map role to icon and color
const roleConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  user: { 
    color: 'blue-700', 
    bgColor: 'blue-100',
    icon: <ArrowLongRightIcon className="h-5 w-5 text-blue-500" />
  },
  assistant: { 
    color: 'green-700', 
    bgColor: 'green-100',
    icon: <ArrowLongLeftIcon className="h-5 w-5 text-green-500" />
  },
  system: { 
    color: 'gray-700', 
    bgColor: 'gray-100',
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
  }
}

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
}

// Format duration for display
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function LLMConversationFlow({
  traceId,
  onClose,
  loading: initialLoading = false,
  className = ''
}: LLMConversationFlowProps) {
  const [flowItems, setFlowItems] = useState<LLMRequest[]>([]);
  const [pagination, setPagination] = useState<LLMRequestsPagination>({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [loading, setLoading] = useState(initialLoading);

  // Fetch conversation flow on load and when page changes
  useEffect(() => {
    const fetchConversationFlow = async () => {
      setLoading(true);
      try {
        const response = await getLLMConversationFlow(traceId, {
          page: pagination.page,
          page_size: pagination.page_size
        });
        
        // Type assertion to handle the response
        const typedResponse = response as {
          items: LLMRequest[];
          pagination: LLMRequestsPagination;
        };
        
        setFlowItems(typedResponse.items || []);
        setPagination(typedResponse.pagination || pagination);
      } catch (error) {
        console.error(`Error fetching conversation flow for trace ${traceId}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversationFlow();
  }, [traceId, pagination.page, pagination.page_size]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Get message thread map (parent_id -> child messages)
  const getMessageThreadMap = () => {
    const threadMap: Record<string, LLMRequest[]> = {};
    flowItems.forEach(item => {
      if (item.parent_id) {
        if (!threadMap[item.parent_id]) {
          threadMap[item.parent_id] = [];
        }
        threadMap[item.parent_id].push(item);
      }
    });
    return threadMap;
  };

  // Get root messages (typically user messages that start a thread)
  const getRootMessages = () => {
    return flowItems.filter(item => !item.parent_id);
  };

  // Render a message and its replies recursively
  const renderMessage = (message: LLMRequest, depth: number = 0) => {
    const threadMap = getMessageThreadMap();
    const replies = threadMap[message.id] || [];
    const role = message.role || (message.input_tokens > 0 ? 'user' : 'assistant');
    const config = roleConfig[role] || roleConfig.system;
    
    return (
      <div key={message.id} className={`ml-${depth * 4} mb-4`}>
        <div className={`p-4 rounded-lg bg-${config.bgColor} border border-${config.color.replace('700', '200')}`}>
          <div className="flex items-start gap-3">
            <div className={`bg-${config.bgColor} rounded-full p-2`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <Text className={`font-medium text-sm text-${config.color}`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
                <div className="flex items-center gap-2">
                  <Badge color={statusColorMap[message.status]} size="xs">
                    {message.status}
                  </Badge>
                  <Text className="text-xs text-gray-500">{formatDate(message.timestamp)}</Text>
                </div>
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {message.content || message.prompt_summary || message.completion_summary}
              </div>
              <div className="mt-2 flex justify-between">
                <Text className="text-xs text-gray-500">
                  {role === 'user' ? `Input Tokens: ${message.input_tokens}` : `Output Tokens: ${message.output_tokens}`}
                </Text>
                <Text className="text-xs text-gray-500">
                  {message.duration_ms > 0 ? `Duration: ${formatDuration(message.duration_ms)}` : ''}
                </Text>
              </div>
            </div>
          </div>
        </div>
        
        {/* Render any replies */}
        {replies.length > 0 && (
          <div className="ml-8 pl-4 border-l-2 border-gray-200">
            {replies.map(reply => renderMessage(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title>Conversation Flow</Title>
          <Text>Trace ID: {traceId}</Text>
          {flowItems.length > 0 && flowItems[0].agent_name && (
            <Text>Agent: {flowItems[0].agent_name}</Text>
          )}
        </div>
        <Button
          icon={ArrowUturnLeftIcon}
          variant="light"
          onClick={onClose}
        >
          Back to Requests
        </Button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-5 bg-gray-100 rounded w-1/4"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : flowItems.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No conversation items found for this trace ID.</p>
          <p className="text-sm mt-2">This could be due to:</p>
          <ul className="text-sm list-disc list-inside mt-1">
            <li>The trace ID may be incorrect or does not exist</li>
            <li>API connection issue</li>
            <li>The conversation has been archived or deleted</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          {/* If the API provides parent/child relationships, use threaded view */}
          {flowItems.some(item => item.parent_id) ? (
            getRootMessages().map(message => renderMessage(message))
          ) : (
            /* Otherwise, fallback to chronological view */
            flowItems.map((item, index) => {
              const role = item.role || (item.input_tokens > 0 ? 'user' : 'assistant');
              const config = roleConfig[role] || roleConfig.system;
              
              return (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge color={statusColorMap[item.status] || 'gray'}>
                        {item.status}
                      </Badge>
                      <Badge color={role === 'user' ? 'blue' : role === 'assistant' ? 'emerald' : 'gray'} size="xs">
                        {role}
                      </Badge>
                      <Text className="font-semibold mt-1">{item.model}</Text>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <Text className="text-sm text-gray-600">{formatDate(item.timestamp)}</Text>
                      </div>
                      <Text className="text-sm text-gray-600">Duration: {formatDuration(item.duration_ms)}</Text>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className={`p-4 rounded-lg bg-${config.bgColor} border border-${config.color.replace('700', '200')}`}>
                      <div className="flex items-start">
                        <div className={`bg-${config.bgColor} rounded-full p-2 mr-3`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <Text className={`font-medium text-sm text-${config.color}`}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                          <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                            {item.content || (role === 'user' ? item.prompt_summary : item.completion_summary)}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Tokens: {role === 'user' ? item.input_tokens : item.output_tokens}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < flowItems.length - 1 && (
                    <div className="flex justify-center my-4">
                      <div className="border-l-2 border-dashed border-gray-300 h-10"></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      
      {flowItems.length > 0 && pagination.total_pages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-4">
          <Button
            variant="light"
            color="gray"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.has_prev}
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          </Button>
          
          <Text>
            Page {pagination.page} of {pagination.total_pages}
          </Text>
          
          <Button
            variant="light"
            color="gray"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.has_next}
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      )}
    </Card>
  );
} 