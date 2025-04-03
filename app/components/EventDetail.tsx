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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchAPI } from '../lib/api';
import { TELEMETRY, SECURITY } from '../lib/api-endpoints';
import { formatDistanceToNow } from 'date-fns';

// Define types based on new API
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

type Alert = {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  target?: string;
  entity_id?: string;
  description: string;
  details: Record<string, any>;
  trace_id?: string;
};

export function EventDetail({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedAlerts, setRelatedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Function to fetch event details
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch event details using the correct endpoint
      const eventData = await fetchAPI<Event>(`${TELEMETRY.EVENT_DETAIL(eventId)}`);
      
      setEvent(eventData);
      
      // If we have a trace_id, fetch related alerts
      if (eventData.trace_id) {
        try {
          // Fetch alerts that have the same trace_id
          const alertData = await fetchAPI<{ items: Alert[] }>(`${SECURITY.ALERTS}?trace_id=${eventData.trace_id}`);
          
          if (alertData && alertData.items) {
            setRelatedAlerts(alertData.items);
          }
        } catch (alertErr) {
          console.error('Error fetching related alerts:', alertErr);
          // Don't set an error, just log it and continue with the event details
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

  // Format the timestamp with relative time
  const formatTimeRelative = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

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

  // Check for sensitive fields in event data
  const hasSensitiveData = (data: any): boolean => {
    const sensitiveKeywords = ['password', 'token', 'secret', 'key', 'auth', 'credentials'];
    
    if (!data) return false;
    
    const checkObject = (obj: Record<string, any>): boolean => {
      return Object.keys(obj).some(key => {
        // Check if the key contains sensitive keywords
        if (sensitiveKeywords.some(keyword => key.toLowerCase().includes(keyword))) {
          return true;
        }
        
        // Recursively check values that are objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          return checkObject(obj[key]);
        }
        
        return false;
      });
    };
    
    return checkObject(data);
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
      default:
        return 'gray';
    }
  };

  // Get a friendly display name for event types
  const getEventTypeDisplay = (name: string): string => {
    // Updated to map telemetry event names
    const typeMap: Record<string, string> = {
      'llm.request': 'LLM Request',
      'llm.response': 'LLM Response',
      'llm.call.start': 'LLM Call Started',
      'llm.call.finish': 'LLM Call Finished',
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
    <div className="p-1">
      <Card className="mb-6">
        <Flex alignItems="center" className="mb-4">
          <Title>Event Details</Title>
          <Badge color={getLevelColor(event.level)} className="ml-2">
            {event.level.toUpperCase()}
          </Badge>
        </Flex>

        <Grid numItems={1} numItemsMd={2} className="gap-6 mb-6">
          <div>
            <Flex className="mb-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
              <Text className="font-medium">Event Type</Text>
            </Flex>
            <Text>{getEventTypeDisplay(event.name)}</Text>
          </div>
          <div>
            <Flex className="mb-2">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <Text className="font-medium">Timestamp</Text>
            </Flex>
            <Text>{formatTimeAbsolute(event.timestamp)}</Text>
            <Text className="text-xs text-gray-500">
              {formatTimeRelative(event.timestamp)}
            </Text>
          </div>
        </Grid>

        <Grid numItems={1} numItemsMd={2} className="gap-6">
          <div>
            <Flex className="mb-2">
              <UserIcon className="h-5 w-5 text-blue-500 mr-2" />
              <Text className="font-medium">Agent</Text>
            </Flex>
            <Link href={`/agents/${event.agent_id}`} className="text-blue-500 hover:underline">
              {event.agent_id}
            </Link>
          </div>
          <div>
            <Flex className="mb-2">
              <ArrowsRightLeftIcon className="h-5 w-5 text-blue-500 mr-2" />
              <Text className="font-medium">Trace</Text>
            </Flex>
            <Link href={`/traces/${event.trace_id}`} className="text-blue-500 hover:underline">
              {event.trace_id}
            </Link>
          </div>
        </Grid>

        {event.span_id && (
          <div className="mt-4">
            <Flex className="mb-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
              <Text className="font-medium">Span ID</Text>
            </Flex>
            <Text>{event.span_id}</Text>
          </div>
        )}

        <Divider className="my-6" />

        <TabGroup onIndexChange={setActiveTab} index={activeTab}>
          <TabList className="mb-6">
            <Tab>Attributes</Tab>
            <Tab>Related Alerts {relatedAlerts.length > 0 && `(${relatedAlerts.length})`}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="mb-4">
                <Text className="font-medium mb-2">Event Attributes</Text>
                
                {hasSensitiveData(event.attributes) && (
                  <Badge color="amber" className="mb-2">
                    Contains potentially sensitive data
                  </Badge>
                )}
                
                <Card className="bg-gray-50 mt-2">
                  <pre className={`text-xs overflow-x-auto whitespace-pre-wrap ${expanded ? '' : 'max-h-80'}`}>
                    {formatJSONData(event.attributes)}
                  </pre>
                  
                  {Object.keys(event.attributes || {}).length > 5 && (
                    <Button
                      variant="light"
                      onClick={() => setExpanded(!expanded)}
                      size="xs"
                      className="mt-2"
                    >
                      {expanded ? 'Show Less' : 'Show More'}
                    </Button>
                  )}
                </Card>
              </div>
            </TabPanel>
            
            <TabPanel>
              {relatedAlerts.length === 0 ? (
                <Text>No security alerts related to this event.</Text>
              ) : (
                <Accordion>
                  {relatedAlerts.map((alert) => (
                    <div key={alert.id}>
                      <AccordionHeader>
                        <Flex alignItems="center">
                          <ShieldExclamationIcon className="h-5 w-5 text-red-500 mr-2" />
                          <div>
                            <Text className="font-medium">{alert.type}</Text>
                            <Text className="text-xs">
                              {formatTimeRelative(alert.timestamp)}
                            </Text>
                          </div>
                          <Badge
                            color={
                              alert.severity === 'critical' ? 'rose' :
                              alert.severity === 'high' ? 'red' :
                              alert.severity === 'medium' ? 'amber' :
                              alert.severity === 'low' ? 'yellow' : 'gray'
                            }
                            className="ml-auto"
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </Flex>
                      </AccordionHeader>
                      <AccordionBody>
                        <div className="ml-7">
                          <Text className="mb-2">{alert.description}</Text>
                          <Link
                            href={`/security/alerts/${alert.id}`}
                            className="text-blue-500 hover:underline text-sm"
                          >
                            View Alert Details
                          </Link>
                        </div>
                      </AccordionBody>
                    </div>
                  ))}
                </Accordion>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
} 