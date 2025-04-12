'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Badge,
  Grid,
  Flex,
  Divider,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Button,
} from '@tremor/react';
import {
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '../../lib/api';
import { TELEMETRY } from '../../lib/api-endpoints';

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

export function EventDetailContainer({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

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
            // Filter out the current event
            setRelatedEvents(relatedData.filter(e => e.id !== eventData.id));
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
      return <DocumentTextIcon className="h-5 w-5" />;
    } else if (name.startsWith('tool.')) {
      return <ArrowsRightLeftIcon className="h-5 w-5" />;
    } else if (name.startsWith('security.')) {
      return <ShieldExclamationIcon className="h-5 w-5" />;
    } else {
      return <ClockIcon className="h-5 w-5" />;
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
      'security.content.suspicious': 'Suspicious Content',
    };
    
    return typeMap[name] || name.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Render loading state
  if (loading) {
    return (
      <Card className="mt-6">
        <Flex justifyContent="center" alignItems="center" className="h-24">
          <Text>Loading event details...</Text>
        </Flex>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="mt-6">
        <Flex justifyContent="center" alignItems="center" className="h-24">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
          <Text color="red">{error}</Text>
        </Flex>
      </Card>
    );
  }

  // Render when no event is found
  if (!event) {
    return (
      <Card className="mt-6">
        <Flex justifyContent="center" alignItems="center" className="h-24">
          <Text>No event found with ID: {eventId}</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Flex>
        <Button 
          variant="light" 
          icon={ArrowLeftIcon}
          onClick={() => router.back()}
        >
          Back to Events
        </Button>
      </Flex>
      
      <Card>
        <Flex alignItems="center" className="mb-4">
          <Title>Event Details</Title>
          <Badge color={getLevelColor(event.level)} className="ml-2">
            {event.level.toUpperCase()}
          </Badge>
        </Flex>
        
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
          <Flex alignItems="center">
            <div className="mr-2">{getEventIcon(event.name)}</div>
            <div>
              <Text className="text-gray-500">Event Type</Text>
              <Text className="font-medium">{getEventTypeDisplay(event.name)}</Text>
            </div>
          </Flex>
          
          <Flex alignItems="center">
            <div className="mr-2"><ClockIcon className="h-5 w-5" /></div>
            <div>
              <Text className="text-gray-500">Timestamp</Text>
              <Text className="font-medium">{formatTimeAbsolute(event.timestamp)}</Text>
            </div>
          </Flex>
          
          <Flex alignItems="center">
            <div className="mr-2"><UserIcon className="h-5 w-5" /></div>
            <div>
              <Text className="text-gray-500">Agent</Text>
              <Link href={`/agents/${event.agent_id}`} className="text-blue-500 hover:underline">
                {event.agent_id}
              </Link>
            </div>
          </Flex>
          
          <Flex alignItems="center">
            <div className="mr-2"><ArrowsRightLeftIcon className="h-5 w-5" /></div>
            <div>
              <Text className="text-gray-500">Trace</Text>
              <Link href={`/events/trace/${event.trace_id}`} className="text-blue-500 hover:underline">
                {event.trace_id}
              </Link>
            </div>
          </Flex>
        </Grid>
        
        <Divider />
        
        <TabGroup index={activeTab} onIndexChange={setActiveTab} className="mt-6">
          <TabList>
            <Tab>Details</Tab>
            <Tab>Raw Data</Tab>
            <Tab>Related Events ({relatedEvents.length})</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="mt-4">
                <Title className="text-lg mb-2">Event Attributes</Title>
                
                <Accordion>
                  <AccordionHeader>Basic Information</AccordionHeader>
                  <AccordionBody>
                    <Grid numItemsMd={2} className="gap-x-4 gap-y-2">
                      <div>
                        <Text className="text-gray-500">Event ID</Text>
                        <Text>{event.id}</Text>
                      </div>
                      
                      <div>
                        <Text className="text-gray-500">Schema Version</Text>
                        <Text>{event.schema_version}</Text>
                      </div>
                      
                      <div>
                        <Text className="text-gray-500">Span ID</Text>
                        <Text>{event.span_id || 'N/A'}</Text>
                      </div>
                      
                      <div>
                        <Text className="text-gray-500">Parent Span ID</Text>
                        <Text>{event.parent_span_id || 'None (Root Span)'}</Text>
                      </div>
                    </Grid>
                  </AccordionBody>
                </Accordion>
                
                {/* Render specific sections based on event type */}
                {event.name.startsWith('llm.') && (
                  <Accordion>
                    <AccordionHeader>LLM Information</AccordionHeader>
                    <AccordionBody>
                      <Grid numItemsMd={2} className="gap-x-4 gap-y-2">
                        <div>
                          <Text className="text-gray-500">Model</Text>
                          <Text>{event.attributes['llm.model'] || 'N/A'}</Text>
                        </div>
                        
                        <div>
                          <Text className="text-gray-500">Temperature</Text>
                          <Text>{event.attributes['llm.temperature'] || 'N/A'}</Text>
                        </div>
                        
                        <div>
                          <Text className="text-gray-500">Input Tokens</Text>
                          <Text>{event.attributes['llm.input_tokens'] || 'N/A'}</Text>
                        </div>
                        
                        <div>
                          <Text className="text-gray-500">Output Tokens</Text>
                          <Text>{event.attributes['llm.output_tokens'] || 'N/A'}</Text>
                        </div>
                      </Grid>
                    </AccordionBody>
                  </Accordion>
                )}
                
                {event.name.startsWith('tool.') && (
                  <Accordion>
                    <AccordionHeader>Tool Information</AccordionHeader>
                    <AccordionBody>
                      <Grid numItemsMd={2} className="gap-x-4 gap-y-2">
                        <div>
                          <Text className="text-gray-500">Tool Name</Text>
                          <Text>{event.attributes['tool.name'] || 'N/A'}</Text>
                        </div>
                        
                        <div>
                          <Text className="text-gray-500">Execution Time (ms)</Text>
                          <Text>{event.attributes['tool.execution_time_ms'] || 'N/A'}</Text>
                        </div>
                      </Grid>
                      
                      {event.attributes['tool.parameters'] && (
                        <div className="mt-4">
                          <Text className="text-gray-500">Parameters</Text>
                          <Card className="mt-2 p-2 bg-gray-50">
                            <pre className="text-xs overflow-auto max-h-48">
                              {formatJSONData(event.attributes['tool.parameters'])}
                            </pre>
                          </Card>
                        </div>
                      )}
                      
                      {event.attributes['tool.result'] && (
                        <div className="mt-4">
                          <Text className="text-gray-500">Result</Text>
                          <Card className="mt-2 p-2 bg-gray-50">
                            <pre className="text-xs overflow-auto max-h-48">
                              {formatJSONData(event.attributes['tool.result'])}
                            </pre>
                          </Card>
                        </div>
                      )}
                    </AccordionBody>
                  </Accordion>
                )}
                
                {event.name.startsWith('security.') && (
                  <Accordion>
                    <AccordionHeader>Security Information</AccordionHeader>
                    <AccordionBody>
                      <Grid numItemsMd={2} className="gap-x-4 gap-y-2">
                        <div>
                          <Text className="text-gray-500">Category</Text>
                          <Text>{event.attributes['security.category'] || 'N/A'}</Text>
                        </div>
                        
                        <div>
                          <Text className="text-gray-500">Severity</Text>
                          <Text>{event.attributes['security.severity'] || 'N/A'}</Text>
                        </div>
                        
                        <div>
                          <Text className="text-gray-500">Alert Level</Text>
                          <Text>{event.attributes['security.alert_level'] || 'N/A'}</Text>
                        </div>
                      </Grid>
                      
                      {event.attributes['security.content_sample'] && (
                        <div className="mt-4">
                          <Text className="text-gray-500">Content Sample</Text>
                          <Card className="mt-2 p-2 bg-gray-50">
                            <pre className="text-xs overflow-auto max-h-48">
                              {event.attributes['security.content_sample']}
                            </pre>
                          </Card>
                        </div>
                      )}
                    </AccordionBody>
                  </Accordion>
                )}
                
                <Accordion>
                  <AccordionHeader>All Attributes</AccordionHeader>
                  <AccordionBody>
                    <Card className="p-2 bg-gray-50">
                      <pre className="text-xs overflow-auto max-h-96">
                        {formatJSONData(event.attributes)}
                      </pre>
                    </Card>
                  </AccordionBody>
                </Accordion>
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                <Card className="p-2 bg-gray-50">
                  <pre className="text-xs overflow-auto max-h-96">
                    {formatJSONData(event)}
                  </pre>
                </Card>
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                {relatedEvents.length === 0 ? (
                  <Text>No related events found in this trace.</Text>
                ) : (
                  <div className="space-y-4">
                    {relatedEvents.map((relatedEvent) => (
                      <Card key={relatedEvent.id} className="p-3">
                        <Flex justifyContent="between" alignItems="center">
                          <Flex alignItems="center">
                            <div className="mr-2">{getEventIcon(relatedEvent.name)}</div>
                            <div>
                              <Text className="font-medium">{getEventTypeDisplay(relatedEvent.name)}</Text>
                              <Text className="text-xs text-gray-500">{formatTimeAbsolute(relatedEvent.timestamp)}</Text>
                            </div>
                          </Flex>
                          
                          <Flex alignItems="center" className="space-x-2">
                            <Badge color={getLevelColor(relatedEvent.level)}>
                              {relatedEvent.level.toUpperCase()}
                            </Badge>
                            
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => router.push(`/events/${relatedEvent.id}`)}
                            >
                              View
                            </Button>
                          </Flex>
                        </Flex>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
} 