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
  ChatBubbleLeftRightIcon,
  LinkIcon,
  UserIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { getLLMConversationFlow } from '../../lib/llm-api'
import type { LLMRequest, LLMRequestsPagination } from './LLMRequestsTable'
import Link from 'next/link'

// Custom tooltip component since Tremor may not export it
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 z-10 px-2 py-1 text-xs rounded bg-gray-800 text-white whitespace-nowrap mb-1">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

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

// Helper function to group messages into conversation turns
type ConversationTurn = {
  user: LLMRequest;
  assistant: LLMRequest[];
}

const groupMessagesByTurn = (messages: LLMRequest[]): ConversationTurn[] => {
  const chronologicalMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  const turns: ConversationTurn[] = [];
  let currentTurn: Partial<ConversationTurn> = {};
  
  chronologicalMessages.forEach(message => {
    const isUser = message.role === 'user' || (!message.role && message.input_tokens > 0);
    
    if (isUser) {
      // If we have a previous turn with both user and assistant, add it to turns
      if (currentTurn.user && currentTurn.assistant && currentTurn.assistant.length > 0) {
        turns.push(currentTurn as ConversationTurn);
      }
      // Start a new turn
      currentTurn = { user: message, assistant: [] };
    } else {
      // This is an assistant message
      if (!currentTurn.assistant) {
        currentTurn.assistant = [];
      }
      if (currentTurn.assistant) {
        currentTurn.assistant.push(message);
      }
    }
  });
  
  // Add the last turn if it has both user and assistant messages
  if (currentTurn.user && currentTurn.assistant && currentTurn.assistant.length > 0) {
    turns.push(currentTurn as ConversationTurn);
  }
  
  return turns;
};

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
  const [copied, setCopied] = useState(false);

  // Calculate conversation summary metrics
  const totalMessages = flowItems.length;
  const totalDuration = flowItems.reduce((total, item) => total + (item.duration_ms || 0), 0);
  const errorCount = flowItems.filter(item => item.status === 'error').length;

  // Copy trace ID to clipboard
  const copyTraceId = () => {
    navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Render a user message with chat bubble styling
  const renderUserMessage = (message: LLMRequest) => {
    return (
      <div className="flex justify-end mb-3 animate-fadeIn" key={message.id}>
        <div className="flex flex-col items-end max-w-[75%]">
          <div className="bg-blue-100 p-4 rounded-2xl rounded-br-sm shadow-sm">
            <div className="text-sm text-gray-800">
              {message.content || message.prompt_summary || message.completion_summary}
            </div>
          </div>
          
          <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
            <div className="flex items-center gap-1">
              <DocumentTextIcon className="h-3.5 w-3.5" />
              <span>Input: {message.input_tokens}</span>
            </div>
            <span>·</span>
            <span>{formatDate(message.timestamp)}</span>
            
            {/* View Event Link for user messages - using event_id */}
            {message.event_id && (
              <Link 
                href={`/events/${message.event_id}?from=conversation&traceId=${traceId}`}
                className="ml-2 text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                <span>View Event</span>
              </Link>
            )}
          </div>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white ml-2 mt-2">
          <UserIcon className="h-5 w-5" />
        </div>
      </div>
    );
  };

  // Render an assistant message with chat bubble styling
  const renderAssistantMessage = (message: LLMRequest, isFirst: boolean = true) => {
    return (
      <div className="flex mb-1 animate-fadeIn" key={message.id}>
        {isFirst && (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white mr-2 mt-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </div>
        )}
        {!isFirst && <div className="w-8 mr-2"></div>}
        
        <div className="flex flex-col max-w-[75%]">
          <div className="bg-green-50 p-4 rounded-2xl rounded-bl-sm shadow-sm">
            <div className="text-sm text-gray-800">
              {message.content || message.prompt_summary || message.completion_summary}
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <DocumentTextIcon className="h-3.5 w-3.5" />
                <span>Output: {message.output_tokens}</span>
              </div>
              
              {message.duration_ms > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>Duration: {formatDuration(message.duration_ms)}</span>
                </div>
              )}
              
              <Tooltip content={message.error || `Status: ${message.status}`}>
                <Badge 
                  color={statusColorMap[message.status]} 
                  size="xs"
                  className="px-2 py-1 rounded-full"
                >
                  {message.status}
                </Badge>
              </Tooltip>
              
              {/* View Event Link - update to use message.event_id */}
              {message.event_id && (
                <Link 
                  href={`/events/${message.event_id}?from=conversation&traceId=${traceId}`}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-700 hover:underline flex items-center gap-1"
                >
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                  <span>View Event</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="mt-1 ml-1 text-xs text-gray-500 flex justify-between items-center">
            <span>{formatDate(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render a conversation turn (user + assistant responses)
  const renderConversationTurn = (turn: ConversationTurn, index: number) => {
    const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    
    return (
      <div key={turn.user.id} className={`py-4 ${bgClass} rounded-lg`}>
        {renderUserMessage(turn.user)}
        
        <div className="space-y-2 mt-2">
          {turn.assistant.map((msg, i) => renderAssistantMessage(msg, i === 0))}
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title>Conversation Flow</Title>
          
          {/* Trace ID with icon and copy button */}
          <div className="flex items-center gap-2 mt-1">
            <LinkIcon className="h-4 w-4 text-gray-500" />
            <Text>Trace ID: </Text>
            <div className="flex items-center">
              <Text className="font-mono">{traceId}</Text>
              <button 
                onClick={copyTraceId} 
                className="ml-2 text-gray-500 hover:text-gray-700"
                title="Copy Trace ID"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              {copied && <span className="ml-1 text-xs text-green-600">Copied!</span>}
            </div>
          </div>
          
          {/* Agent name as a styled badge */}
          {flowItems.length > 0 && flowItems[0].agent_name && (
            <div className="flex items-center gap-2 mt-1">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <Text>Agent: </Text>
              <Badge color="blue" size="sm" className="px-2 py-1 rounded-full">
                {flowItems[0].agent_name}
              </Badge>
            </div>
          )}
        </div>
        <Link 
          href="/llm/conversations" 
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-200 shadow-sm"
          onClick={onClose}
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Back to Conversations
        </Link>
      </div>
      
      {/* Conversation Summary Section */}
      {flowItems.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
              <Text>{totalMessages} messages</Text>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <Text>{formatDuration(totalDuration)} total duration</Text>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <Text className="text-red-600">{errorCount} error{errorCount !== 1 ? 's' : ''}</Text>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Divider />
      
      {loading ? (
        <div className="space-y-6 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              {/* User message skeleton */}
              <div className="flex justify-end mb-4">
                <div className="h-24 bg-blue-50 rounded-2xl w-3/4"></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 ml-2"></div>
              </div>
              {/* Assistant message skeleton */}
              <div className="flex mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                <div className="h-32 bg-green-50 rounded-2xl w-3/4"></div>
              </div>
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
        <div className="py-2">
          {/* Group messages into conversation turns */}
          {groupMessagesByTurn(flowItems).map((turn, index) => 
            renderConversationTurn(turn, index)
          )}
          
          {/* Handle any remaining messages that didn't fit into turns */}
          {flowItems.filter(item => 
            !groupMessagesByTurn(flowItems).some(turn => 
              turn.user.id === item.id || turn.assistant.some(a => a.id === item.id)
            )
          ).map(item => {
            const isUser = item.role === 'user' || (!item.role && item.input_tokens > 0);
            return (
              <div key={item.id} className="py-2">
                {isUser ? renderUserMessage(item) : renderAssistantMessage(item)}
              </div>
            );
          })}
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