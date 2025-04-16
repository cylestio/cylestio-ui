'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Card,
  Grid,
  Flex,
  Badge,
  Divider,
  Button,
  Subtitle,
  TabGroup,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  List,
  ListItem,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@tremor/react';
import {
  ShieldExclamationIcon,
  ArrowLeftIcon,
  ClockIcon,
  ServerIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchAPI } from '../../lib/api';
import { SECURITY } from '../../lib/api-endpoints';
import { formatISOToLocalDisplay } from '../../lib/dateUtils';
import EnhancedBreadcrumbs from '../../components/EnhancedBreadcrumbs';
import LoadingState from '../../components/LoadingState';

interface SecurityAlertDetailContainerProps {
  alertId: string;
}

type RelatedEvent = {
  id: string;
  timestamp: string;
  name: string;
  level: string;
  agent_id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  attributes: Record<string, any>;
  event_name?: string;
};

type DetectionPattern = {
  pattern: string;
  match_score: number;
};

type DetectionDetails = {
  matching_patterns: DetectionPattern[];
};

type RelatedData = {
  detected_text: string;
  confidence_score: number;
  detection_details: DetectionDetails;
};

type Alert = {
  id: string;
  timestamp: string;
  schema_version: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_name: string;
  log_level: string;
  alert_level: string;
  category: string;
  severity: string;
  description: string;
  llm_vendor: string;
  content_sample: string;
  detection_time: string;
  keywords: string[];
  event_id: number;
  agent_id: string;
  model?: string;
  attributes?: Record<string, any>;
};

// Updated response type to include related events
type AlertDetailResponse = {
  alert: Alert;
  related_events: RelatedEvent[];
};

export default function SecurityAlertDetailContainer({ alertId }: SecurityAlertDetailContainerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDetail, setAlertDetail] = useState<Alert | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<RelatedEvent[]>([]);
  
  // Get appropriate color for severity
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'rose';
      case 'high': return 'orange';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };
  
  // Get appropriate color for alert level
  const getAlertLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'rose';
      case 'dangerous': return 'orange';
      case 'suspicious': return 'amber';
      case 'none': return 'gray';
      default: return 'gray';
    }
  };
  
  // Format category for display
  const formatCategory = (category: string) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  useEffect(() => {
    async function fetchAlertDetail() {
      try {
        setLoading(true);
        // Fetch the alert detail
        const alertResponse = await fetchAPI<Alert>(`${SECURITY.ALERT_DETAIL(alertId)}`);
        setAlertDetail(alertResponse);
        
        // Fetch triggered event IDs
        try {
          const triggersResponse = await fetchAPI<{ triggered_event_ids: string[] }>(`${SECURITY.ALERT_DETAIL(alertId)}/triggers`);
          
          // Fetch each event detail
          if (triggersResponse.triggered_event_ids && triggersResponse.triggered_event_ids.length > 0) {
            const eventPromises = triggersResponse.triggered_event_ids.map(eventId => 
              fetchAPI<RelatedEvent>(`/v1/telemetry/events/${eventId}`)
            );
            
            const eventResults = await Promise.all(eventPromises);
            setRelatedEvents(eventResults);
          } else {
            setRelatedEvents([]);
          }
        } catch (triggerErr) {
          console.error('Error fetching related events:', triggerErr);
          setRelatedEvents([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching alert detail:', err);
        setError('Failed to load alert details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAlertDetail();
  }, [alertId]);
  
  if (loading) {
    return <LoadingState message="Loading alert details..." />;
  }
  
  if (error || !alertDetail) {
    return (
      <Card className="mt-6">
        <Flex alignItems="center" className="gap-2">
          <ShieldExclamationIcon className="h-6 w-6 text-gray-500" />
          <Text color="rose">{error || 'Alert not found'}</Text>
        </Flex>
        <Button
          variant="light"
          icon={ArrowLeftIcon}
          className="mt-4"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Card>
    );
  }
  
  const alert = alertDetail;
  
  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Security', href: '/security' },
    { label: 'Alerts', href: '/security?tab=1' },
    { label: `Alert ${alertId.substring(0, 8)}`, href: `/security/alerts/${alertId}`, active: true },
  ];
  
  return (
    <div>
      <EnhancedBreadcrumbs items={breadcrumbItems} />
      
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Flex alignItems="center" className="gap-2">
          <ShieldExclamationIcon className={`h-8 w-8 text-${getSeverityColor(alert?.severity || '')}-500`} />
          <div>
            <Title>{alert?.category ? formatCategory(alert.category) : 'Alert Details'}</Title>
            <Text className="mt-1">{alert?.description}</Text>
          </div>
        </Flex>
        
        <Button
          variant="light"
          icon={ArrowLeftIcon}
          onClick={() => router.back()}
        >
          Back to Alerts
        </Button>
      </Flex>
      
      <Grid numItemsMd={1} numItemsLg={4} className="gap-6">
        {/* Alert overview panel - takes up full width on first row */}
        <Card className="lg:col-span-4">
          <Flex alignItems="center" className="gap-6 flex-wrap">
            <div>
              <Text>Severity</Text>
              <Badge className="mt-1" size="xl" color={getSeverityColor(alert?.severity || '')}>
                {alert?.severity}
              </Badge>
            </div>
            
            <div>
              <Text>Alert Level</Text>
              <Badge className="mt-1" size="xl" color={getAlertLevelColor(alert?.alert_level || '')}>
                {alert?.alert_level}
              </Badge>
            </div>
            
            <div>
              <Text>Category</Text>
              <Text className="mt-1 font-medium">{formatCategory(alert?.category || '')}</Text>
            </div>
            
            <div>
              <Text>LLM Vendor</Text>
              <Text className="mt-1 font-medium">{alert?.llm_vendor}</Text>
            </div>
            
            <div>
              <Text>Event Name</Text>
              <Text className="mt-1 font-medium">{alert?.event_name}</Text>
            </div>
            
            <div>
              <Text>Time</Text>
              <Flex justifyContent="start" alignItems="center" className="gap-1 mt-1">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <Text>{alert?.timestamp ? formatISOToLocalDisplay(alert.timestamp) : 'N/A'}</Text>
              </Flex>
            </div>
          </Flex>
          
          {alert?.keywords && alert.keywords.length > 0 && (
            <>
              <Divider className="my-4" />
              <div>
                <Text>Keywords</Text>
                <Flex className="mt-2 flex-wrap gap-2">
                  {alert.keywords.map((keyword, index) => (
                    <Badge key={index} color="blue" size="sm">
                      {keyword}
                    </Badge>
                  ))}
                </Flex>
              </div>
            </>
          )}
        </Card>
        
        {/* Content Sample */}
        <Card className="lg:col-span-4">
          <Title>Content Sample</Title>
          <Divider className="my-2" />
          <div className="mt-2 bg-gray-50 p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
            {alert?.content_sample || 'No content sample available'}
          </div>
        </Card>
        
        {/* Alert Details */}
        <Card className="lg:col-span-2">
          <Title>Alert Details</Title>
          <Divider className="my-2" />
          <List>
            <ListItem>
              <Text>Alert ID</Text>
              <Text>{alert?.id}</Text>
            </ListItem>
            <ListItem>
              <Text>Event ID</Text>
              <Text>{alert?.event_id}</Text>
            </ListItem>
            <ListItem>
              <Text>Agent ID</Text>
              <Text>{alert?.agent_id}</Text>
            </ListItem>
            <ListItem>
              <Text>Detection Time</Text>
              <Text>{alert?.detection_time ? formatISOToLocalDisplay(alert.detection_time) : 'N/A'}</Text>
            </ListItem>
            <ListItem>
              <Text>Log Level</Text>
              <Text>{alert?.log_level}</Text>
            </ListItem>
          </List>
        </Card>
        
        {/* Trace Information */}
        <Card className="lg:col-span-2">
          <Title>Trace Information</Title>
          <Divider className="my-2" />
          <List>
            <ListItem>
              <Text>Trace ID</Text>
              <Text className="font-mono text-xs truncate">{alert?.trace_id}</Text>
            </ListItem>
            <ListItem>
              <Text>Span ID</Text>
              <Text className="font-mono text-xs truncate">{alert?.span_id}</Text>
            </ListItem>
            <ListItem>
              <Text>Parent Span ID</Text>
              <Text className="font-mono text-xs truncate">{alert?.parent_span_id || 'None'}</Text>
            </ListItem>
            <ListItem>
              <Text>Schema Version</Text>
              <Text>{alert?.schema_version}</Text>
            </ListItem>
          </List>
        </Card>
        
        {/* Related Events - New Section */}
        <Card className="lg:col-span-4">
          <Title>Related Events</Title>
          <Divider className="my-2" />
          
          {relatedEvents && relatedEvents.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Event Name</TableHeaderCell>
                  <TableHeaderCell>Level</TableHeaderCell>
                  <TableHeaderCell>Time</TableHeaderCell>
                  <TableHeaderCell>Agent</TableHeaderCell>
                  <TableHeaderCell>Span ID</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relatedEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>
                      <Badge 
                        color={
                          event.level === 'ERROR' || event.level === 'SECURITY_ALERT' 
                            ? 'rose' 
                            : event.level === 'WARNING' 
                              ? 'amber' 
                              : 'blue'
                        } 
                        size="sm"
                      >
                        {event.level}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatISOToLocalDisplay(event.timestamp)}</TableCell>
                    <TableCell>{event.agent_id}</TableCell>
                    <TableCell className="font-mono text-xs">{event.span_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Text className="p-4 text-center text-gray-500">No related events found</Text>
          )}
        </Card>
        
        {/* Raw Attributes - New Section */}
        <Card className="lg:col-span-4">
          <Title>Raw Attributes</Title>
          <Divider className="my-2" />
          <TabGroup>
            <TabList>
              <Tab>JSON View</Tab>
              <Tab>Table View</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div className="mt-4 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(alert, null, 2)}</pre>
                </div>
              </TabPanel>
              <TabPanel>
                <div className="mt-4 overflow-auto max-h-96">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Attribute</TableHeaderCell>
                        <TableHeaderCell>Value</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alert && Object.entries(alert).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {typeof value === 'object' 
                              ? JSON.stringify(value, null, 2)
                              : String(value)
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
        
        {/* Related Event Attributes - New Section */}
        {relatedEvents && relatedEvents.length > 0 && (
          <Card className="lg:col-span-4">
            <Title>Related Event Attributes</Title>
            <Divider className="my-2" />
            <TabGroup>
              <TabList>
                {relatedEvents.map((event, index) => (
                  <Tab key={index}>Event {index + 1}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {relatedEvents.map((event, index) => (
                  <TabPanel key={index}>
                    <div className="mt-4 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                      <Text className="mb-2 font-semibold">{event.name}</Text>
                      <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(event.attributes, null, 2)}</pre>
                    </div>
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>
          </Card>
        )}
      </Grid>
    </div>
  );
} 