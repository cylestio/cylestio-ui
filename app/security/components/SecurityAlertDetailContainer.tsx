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
  severity: string;
  category: string;
  alert_level: string;
  llm_vendor: string;
  title: string;
  description: string;
  keywords: string[];
  trace_id: string;
  span_id: string;
  model: string;
  agent_id: string;
  related_data: RelatedData;
};

type AlertDetailResponse = {
  alert: Alert;
  related_events: RelatedEvent[];
};

export default function SecurityAlertDetailContainer({ alertId }: SecurityAlertDetailContainerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertDetail, setAlertDetail] = useState<AlertDetailResponse | null>(null);
  
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
        const data = await fetchAPI<AlertDetailResponse>(`${SECURITY.ALERT_DETAIL(alertId)}?include_related_events=true`);
        setAlertDetail(data);
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
  
  const { alert, related_events } = alertDetail;
  
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
          <ShieldExclamationIcon className={`h-8 w-8 text-${getSeverityColor(alert.severity)}-500`} />
          <div>
            <Title>{alert.title || formatCategory(alert.category)}</Title>
            <Text className="mt-1">{alert.description}</Text>
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
          <Flex alignItems="center" className="gap-6">
            <div>
              <Text>Severity</Text>
              <Badge className="mt-1" size="xl" color={getSeverityColor(alert.severity)}>
                {alert.severity}
              </Badge>
            </div>
            
            <div>
              <Text>Alert Level</Text>
              <Badge className="mt-1" size="xl" color={getAlertLevelColor(alert.alert_level)}>
                {alert.alert_level}
              </Badge>
            </div>
            
            <div>
              <Text>Category</Text>
              <Text className="mt-1 font-medium">{formatCategory(alert.category)}</Text>
            </div>
            
            <div>
              <Text>LLM Vendor</Text>
              <Text className="mt-1 font-medium">{alert.llm_vendor}</Text>
            </div>
            
            <div>
              <Text>Model</Text>
              <Text className="mt-1 font-medium">{alert.model}</Text>
            </div>
            
            <div>
              <Text>Time</Text>
              <Flex justifyContent="start" alignItems="center" className="gap-1 mt-1">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <Text>{formatISOToLocalDisplay(alert.timestamp)}</Text>
              </Flex>
            </div>
          </Flex>
          
          {alert.keywords && alert.keywords.length > 0 && (
            <>
              <Divider className="my-4" />
              <div>
                <Text>Keywords</Text>
                <Flex className="mt-2 flex-wrap gap-2">
                  {alert.keywords.map((keyword, index) => (
                    <Badge key={index} size="sm" color="gray">
                      {keyword}
                    </Badge>
                  ))}
                </Flex>
              </div>
            </>
          )}
        </Card>
        
        {/* Left column - Alert details */}
        <Card className="lg:col-span-3">
          <TabGroup>
            <TabList>
              <Tab icon={DocumentTextIcon}>Alert Details</Tab>
              <Tab icon={ChatBubbleLeftEllipsisIcon}>Related Events</Tab>
              <Tab icon={CodeBracketIcon}>Raw Data</Tab>
            </TabList>
            
            <TabPanels>
              {/* Alert Details Tab */}
              <TabPanel>
                <div className="space-y-6 mt-4">
                  {alert.related_data?.detected_text && (
                    <div>
                      <Subtitle className="mb-2">Detected Text</Subtitle>
                      <Card className="bg-gray-50 p-4">
                        <Text className="whitespace-pre-wrap font-mono text-sm">
                          {alert.related_data.detected_text}
                        </Text>
                      </Card>
                    </div>
                  )}
                  
                  {alert.related_data?.confidence_score && (
                    <div>
                      <Subtitle className="mb-2">Confidence Score</Subtitle>
                      <Text>{(alert.related_data.confidence_score * 100).toFixed(1)}%</Text>
                    </div>
                  )}
                  
                  {alert.related_data?.detection_details?.matching_patterns && (
                    <div>
                      <Subtitle className="mb-2">Matching Patterns</Subtitle>
                      <List>
                        {alert.related_data.detection_details.matching_patterns.map((pattern, index) => (
                          <ListItem key={index}>
                            <Flex justifyContent="between">
                              <Text>{pattern.pattern}</Text>
                              <Badge size="xs" color="indigo">
                                {(pattern.match_score * 100).toFixed(1)}% match
                              </Badge>
                            </Flex>
                          </ListItem>
                        ))}
                      </List>
                    </div>
                  )}
                  
                  <div>
                    <Subtitle className="mb-2">Correlation IDs</Subtitle>
                    <Grid numItemsSm={2} className="gap-4">
                      <div>
                        <Text>Trace ID</Text>
                        <Link href={`/events/traces/${alert.trace_id}`}>
                          <Text className="font-mono text-sm text-blue-500 hover:underline">
                            {alert.trace_id}
                          </Text>
                        </Link>
                      </div>
                      
                      <div>
                        <Text>Span ID</Text>
                        <Text className="font-mono text-sm">{alert.span_id}</Text>
                      </div>
                    </Grid>
                  </div>
                </div>
              </TabPanel>
              
              {/* Related Events Tab */}
              <TabPanel>
                {related_events.length === 0 ? (
                  <div className="text-center py-8">
                    <Text>No related events found</Text>
                  </div>
                ) : (
                  <div className="mt-4">
                    <List>
                      {related_events.map((event) => (
                        <ListItem key={event.id}>
                          <Flex justifyContent="between" alignItems="center">
                            <div>
                              <Flex alignItems="center" className="gap-2">
                                <Badge size="xs" color={event.level === 'warning' ? 'amber' : event.level === 'error' ? 'rose' : 'blue'}>
                                  {event.level}
                                </Badge>
                                <Text className="font-medium">{event.name}</Text>
                              </Flex>
                              <Text className="text-xs text-gray-500 mt-1">
                                {formatISOToLocalDisplay(event.timestamp)}
                              </Text>
                            </div>
                            
                            <Link href={`/events/${event.id}`}>
                              <Button size="xs" variant="light">
                                View Event
                              </Button>
                            </Link>
                          </Flex>
                        </ListItem>
                      ))}
                    </List>
                  </div>
                )}
              </TabPanel>
              
              {/* Raw Data Tab */}
              <TabPanel>
                <div className="mt-4">
                  <Card className="bg-gray-50 p-4 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(alert, null, 2)}
                    </pre>
                  </Card>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
        
        {/* Right column - Contextual information */}
        <Card className="lg:col-span-1">
          <Title>Contextual Info</Title>
          
          <div className="mt-4">
            <Subtitle>Agent Information</Subtitle>
            <Link href={`/agents/${alert.agent_id}`}>
              <Flex justifyContent="start" alignItems="center" className="gap-2 mt-2 hover:text-blue-500">
                <ServerIcon className="h-5 w-5" />
                <Text className="font-medium">{alert.agent_id}</Text>
              </Flex>
            </Link>
          </div>
          
          <Divider className="my-4" />
          
          <div>
            <Subtitle>Security Resources</Subtitle>
            <List className="mt-2">
              <ListItem>
                <Link href="/security/documentation/prompt-injection">
                  <Text className="text-blue-500 hover:underline">
                    Prompt Injection Guide
                  </Text>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/security/documentation/best-practices">
                  <Text className="text-blue-500 hover:underline">
                    LLM Security Best Practices
                  </Text>
                </Link>
              </ListItem>
              <ListItem>
                <Link href="/security/documentation/severity-guide">
                  <Text className="text-blue-500 hover:underline">
                    Alert Severity Guide
                  </Text>
                </Link>
              </ListItem>
            </List>
          </div>
          
          <Divider className="my-4" />
          
          <div>
            <Subtitle>Similar Alerts</Subtitle>
            <Text className="text-gray-500 mt-2 text-sm">
              Similar alerts feature coming soon
            </Text>
          </div>
        </Card>
      </Grid>
    </div>
  );
} 