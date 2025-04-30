'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Title,
  Text,
  Badge,
  Flex,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Divider,
} from '@tremor/react';
import {
  ClockIcon, 
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CommandLineIcon,
  CpuChipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '../../lib/api';
import { TELEMETRY } from '../../lib/api-endpoints';
import Breadcrumbs from '../Breadcrumbs';

// Define types based on API
type Event = {
  id: string;
  schema_version: string;
  timestamp: string;
  trace_id: string;
  span_id?: string;
  parent_span_id?: string;
  name: string;
  level: string;
  agent_id: string;
  attributes: Record<string, any>;
};

export function EventDetailContainer({ eventId, fromSecurity = false }: { eventId: string, fromSecurity?: boolean }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [jsonCopied, setJsonCopied] = useState(false);

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string, type: 'json' | 'trace') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'json') {
        setJsonCopied(true);
        setTimeout(() => setJsonCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Function to fetch event details
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventData = await fetchAPI<Event>(`${TELEMETRY.EVENT_DETAIL(eventId)}`);
      
      setEvent(eventData);
      
      // If we have a trace_id, fetch related events
      if (eventData.trace_id) {
        try {
          // Fetch events with the same trace_id
          const relatedData = await fetchAPI<Event[]>(`${TELEMETRY.TRACES(eventData.trace_id)}`);
          
          if (relatedData) {
            // Sort by timestamp (ascending - oldest first) and include current event
            const sortedEvents = relatedData
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            setRelatedEvents(sortedEvents);
          }
        } catch (relatedErr) {
          console.error('Error fetching related events:', relatedErr);
          // Don't set an error, just log it
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial render
  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  // Format the timestamp with absolute time
  const formatTimeAbsolute = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format the raw JSON data nicely
  const formatJSONData = (data: any, indent = 2) => {
    try {
      return JSON.stringify(data, null, indent);
    } catch (e) {
      return 'Invalid JSON data';
    }
  };

  // Get event type icon
  const getEventIcon = (name: string) => {
    if (name.startsWith('llm.')) {
      return <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-blue-500" />;
    } else if (name.startsWith('tool.')) {
      return <CommandLineIcon className="h-4 w-4 text-amber-500" />;
    } else if (name.startsWith('security.')) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-rose-500" />;
    } else if (name.startsWith('monitoring.')) {
      return <CpuChipIcon className="h-4 w-4 text-emerald-500" />;
    } else if (name.startsWith('framework.')) {
      return <CpuChipIcon className="h-4 w-4 text-purple-500" />;
    } else {
      return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get a color based on event level
  const getLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'rose';
      case 'warning':
        return 'amber';
      case 'info':
        return 'blue';
      case 'debug':
        return 'gray';
      case 'critical':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Get a friendly display name for event types
  const getEventTypeDisplay = (name: string): string => {
    // Map telemetry event names to display names
    const typeMap: Record<string, string> = {
      'llm.request': 'LLM Request',
      'llm.response': 'LLM Response',
      'llm.call.start': 'LLM Call Started',
      'llm.call.finish': 'LLM Call Finished',
      'tool.call': 'Tool Call',
      'tool.execution': 'Tool Execution',
      'tool.result': 'Tool Result',
      'tool.response': 'Tool Response',
      'session.start': 'Session Started',
      'session.end': 'Session Ended',
      'error': 'Error',
      'trace.start': 'Trace Started',
      'trace.end': 'Trace Ended',
      'message.user': 'User Message',
      'message.assistant': 'Assistant Message',
      'framework.initialization': 'Framework Initialized',
      'framework.patch': 'Framework Patched',
      'framework.unpatch': 'Framework Unpatched',
      'monitoring.start': 'Monitoring Started',
      'monitoring.stop': 'Monitoring Stopped',
      'security.content.suspicious': 'Suspicious Content',
    };
    
    return typeMap[name] || name.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Function to get referrer information
  const getReferrer = () => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get('from');
      const traceId = searchParams.get('traceId');
      
      return { from, traceId };
    }
    return { from: null, traceId: null };
  };

  // Update the breadcrumbs to include security when coming from security
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Events', href: '/events' },
      { label: `Event ${eventId.substring(0, 8)}`, href: `/events/${eventId}`, current: true },
    ];
    
    // If coming from security, add security breadcrumb
    if (fromSecurity) {
      items.splice(1, 0, { label: 'Security', href: '/security?tab=1' });
    }
    
    return items;
  }, [eventId, fromSecurity]);

  // Render loading state
  if (loading) {
    return (
      <Card className="mt-4 shadow-sm rounded-lg">
        <Flex justifyContent="center" alignItems="center" className="h-24">
          <Text>Loading event details...</Text>
        </Flex>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="mt-4 shadow-sm rounded-lg">
        <Flex justifyContent="center" alignItems="center" className="h-24">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <Text color="red">{error}</Text>
        </Flex>
      </Card>
    );
  }

  // Render when no event is found
  if (!event) {
    return (
      <Card className="mt-4 shadow-sm rounded-lg">
        <Flex justifyContent="center" alignItems="center" className="h-24">
          <Text>No event found with ID: {eventId}</Text>
        </Flex>
      </Card>
    );
  }

  // Get referrer info
  const { from, traceId } = getReferrer();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Back button that changes based on where the user came from */}
        {fromSecurity ? (
          <Link href="/security?tab=1">
            <Button 
              variant="light" 
              size="sm" 
              icon={ArrowLeftIcon}
              className="text-blue-600"
            >
              Back to Security Alerts
            </Button>
          </Link>
        ) : (
          <Link href="/events">
            <Button 
              variant="light" 
              size="sm" 
              icon={ArrowLeftIcon}
            >
              Back to Events
            </Button>
          </Link>
        )}
      </div>
      
      {/* Header Section - Made elegant with background and better styling */}
      <Card className="overflow-hidden bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 border-0">
        {/* Title Bar with background */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/30 px-6 py-4 border-b border-gray-100">
          <Flex justifyContent="between" alignItems="center">
            <div className="flex items-center">
              <Title className="text-lg font-medium text-gray-800">Event Details</Title>
              <Badge color={getLevelColor(event.level)} size="xs" className="uppercase px-2 py-0.5 ml-3">
                {event.level}
              </Badge>
            </div>
            <Text className="text-gray-500 text-sm font-medium">ID: {event.id}</Text>
          </Flex>
        </div>
        
        {/* Single-line Metadata Pills with elegant styling */}
        <div className="flex items-center gap-4 px-6 py-4 overflow-x-auto bg-white border-b border-gray-100">
          {/* Event Type Pill */}
          <Pill 
            icon={getEventIcon(event.name)}
            text={getEventTypeDisplay(event.name)}
            color="blue"
          />
          
          {/* Timestamp Pill */}
          <Pill 
            icon={<ClockIcon className="h-4 w-4" />}
            text={formatTimeAbsolute(event.timestamp)}
            color="gray"
          />
          
          {/* Agent Pill */}
          <Pill 
            icon={<RobotIcon />}
            text={event.agent_id}
            color="gray"
            isLink={true}
            href={`/agents/${event.agent_id}`}
          />
        </div>
      </Card>
      
      {/* Tabs Section */}
      <Card className="shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <TabGroup index={activeTab} onIndexChange={setActiveTab}>
          <TabList className="border-b border-gray-200 bg-gray-50/50">
            <Tab className="px-5 py-2.5 text-sm font-medium hover:bg-gray-100/50 transition-colors focus:outline-none">
              Details
            </Tab>
            <Tab className="px-5 py-2.5 text-sm font-medium hover:bg-gray-100/50 transition-colors focus:outline-none">
              Related Events
              {relatedEvents.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {relatedEvents.length}
                </span>
              )}
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Details Tab - JSON Viewer */}
            <TabPanel className="p-4">
              <div className="mb-3 flex justify-between items-center">
                <Text className="text-sm font-medium text-gray-700">Event Payload</Text>
                <Button
                  size="xs"
                  variant="light"
                  icon={DocumentTextIcon}
                  onClick={() => copyToClipboard(formatJSONData(event), 'json')}
                  className="text-xs"
                >
                  {jsonCopied ? 'Copied!' : 'Copy JSON'}
                </Button>
              </div>
              
              <div className="json-viewer bg-gray-50 border border-gray-200 rounded-lg overflow-auto max-h-[600px]">
                <pre 
                  className="text-xs text-gray-800 p-3 m-0 whitespace-pre-wrap"
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    lineHeight: 1.5,
                    tabSize: 2,
                  }}
                >
                  <code dangerouslySetInnerHTML={{ 
                    __html: syntaxHighlight(formatJSONData(event)) 
                  }} />
                </pre>
              </div>
            </TabPanel>
            
            {/* Related Events Tab */}
            <TabPanel className="p-4">
              {relatedEvents.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <Text className="text-gray-500">No related events found in this trace.</Text>
                </div>
              ) : (
                <div className="space-y-1 relative">
                  {/* Timeline line with gradient effect */}
                  <div className="absolute left-1 top-8 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 rounded-full z-0"></div>
                  
                  <div className="flex justify-between mb-3 px-2">
                    <Text className="text-xs text-gray-500">EARLIEST</Text>
                    <Text className="text-xs text-gray-500">LATEST</Text>
                  </div>
                  
                  {relatedEvents.map((relatedEvent, index) => {
                    const isCurrentEvent = relatedEvent.id === event.id;
                    const isFirst = index === 0;
                    const isLast = index === relatedEvents.length - 1;
                    
                    return (
                      <div 
                        key={relatedEvent.id} 
                        className={`flex items-center p-2.5 ${isCurrentEvent ? 'bg-blue-50/70 border border-blue-100' : 'border-b border-gray-100 hover:bg-gray-50'} rounded-lg transition-colors relative group`}
                      >
                        {/* Timeline connector lines - removed as main line is now continuous */}
                        
                        {/* Timeline node */}
                        <div 
                          className={`z-10 absolute left-1 transform -translate-x-1/2 w-3 h-3 rounded-full shadow-sm
                            ${isCurrentEvent 
                              ? 'border-2 border-blue-500 bg-blue-500 ring-4 ring-blue-100' 
                              : 'border-2 border-blue-400 bg-white'}`}
                        ></div>
                        
                        <div className="flex justify-between items-center w-full ml-5">
                          <div className="flex items-center gap-3">
                            <span className="flex-shrink-0">
                              {getEventIcon(relatedEvent.name)}
                            </span>
                            <div>
                              <div className="flex items-center">
                                <Text className={`text-sm ${isCurrentEvent ? 'font-semibold text-blue-700' : 'font-medium'}`}>
                                  {getEventTypeDisplay(relatedEvent.name)}
                                </Text>
                                {isCurrentEvent && (
                                  <Badge color="blue" size="xs" className="ml-2">Current</Badge>
                                )}
                              </div>
                              <Text className="text-xs text-gray-500">{formatTimeAbsolute(relatedEvent.timestamp)}</Text>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              color={getLevelColor(relatedEvent.level)} 
                              size="xs"
                              className="uppercase px-1.5 py-0.5 text-[10px]"
                            >
                              {relatedEvent.level}
                            </Badge>
                            
                            {!isCurrentEvent && (
                              <Link 
                                href={`/events/${relatedEvent.id}`}
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
}

// Custom RobotIcon component to match the menu icon
function RobotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 11V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 11V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Pill component for metadata display
type PillProps = {
  icon: React.ReactNode;
  text: string;
  color: 'blue' | 'gray';
  isLink?: boolean;
  href?: string;
  isCopyable?: boolean;
  onCopy?: () => void;
  isCopied?: boolean;
};

function Pill({ icon, text, color, isLink, href, isCopyable, onCopy, isCopied }: PillProps) {
  const bgColor = color === 'blue' ? 'bg-blue-50/80' : 'bg-gray-50/80';
  const borderColor = color === 'blue' ? 'border-blue-200/70' : 'border-gray-200/70';
  const textColor = color === 'blue' ? 'text-blue-700' : isLink ? 'text-blue-600' : 'text-gray-700';
  
  return (
    <div className={`inline-flex items-center ${bgColor} ${textColor} px-3.5 py-2 rounded-md border ${borderColor} shadow-sm backdrop-blur-sm hover:shadow-md transition-all duration-200`}>
      <span className="flex-shrink-0 mr-2">{icon}</span>
      
      {isLink && href ? (
        <Link href={href} className="text-sm font-medium hover:underline whitespace-nowrap">
          {text}
        </Link>
      ) : (
        <span className={`text-sm ${color === 'blue' ? 'font-medium' : ''} ${isCopyable ? 'max-w-[120px] truncate' : ''}`} title={isCopyable ? text : undefined}>
          {text}
        </span>
      )}
      
      {isCopyable && (
        <>
          <button 
            onClick={onCopy}
            className="ml-2.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="Copy"
          >
            <DocumentTextIcon className="h-3.5 w-3.5" />
          </button>
          {isCopied && (
            <span className="text-xs text-green-600 ml-1.5">✓</span>
          )}
        </>
      )}
    </div>
  );
}

// Function to add syntax highlighting to JSON
function syntaxHighlight(json: string) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-blue-700'; // string
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-gray-700 font-semibold'; // key
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-green-600'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-rose-600'; // null
      } else {
        cls = 'text-amber-600'; // number
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
} 