'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Metric,
  Text,
  Title,
  AreaChart,
  Flex,
  Badge,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  BadgeDelta
} from '@tremor/react'
import {
  FaBolt,
  FaClock,
  FaExclamationTriangle,
  FaServer,
  FaNetworkWired,
  FaChartBar,
  FaInfoCircle,
  FaSync
} from 'react-icons/fa';
import { ConnectionStatus } from './ConnectionStatus'
import { SimpleDonutChart } from './SimpleDonutChart'
import Link from 'next/link'
import { useTimeRange, useApiRequest } from '../hooks'
import { 
  AgentService, 
  EventsService,
  AlertsService,
  MetricsService 
} from '../lib/api/services';

// Define types
type MetricsData = {
  totalAgents: number
  activeAgents: number
  totalEvents: number
  recentEvents: number
  securityAlerts: number
  criticalAlerts: number
  avgResponseTime: number
  successRate: number
}

// Extended agent type to include additional dashboard display properties
type ExtendedAgent = {
  id: number
  agent_id: string
  name: string
  description: string
  version: string
  active: boolean
  last_active: string
  creation_time: string
  
  // Additional properties for dashboard display
  type?: string
  event_count?: number
}

// Extended alert type to include additional dashboard display properties
type ExtendedAlert = {
  id: number
  alert_id: string
  event_id: string
  agent_id: string
  timestamp: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: Record<string, any>
  reviewed: boolean
  reviewed_at: string | null
  reviewed_by: string | null
  
  // Additional properties for dashboard display
  agent_name?: string
  type?: string
  action_taken?: string
}

// Mock data for dashboard
const mockHealthData = {
  agents: {
    total: 42,
    active: 38,
    change: 5.3,
  },
  uptime: {
    percentage: 99.9,
    downtime: '8m',
    change: 0.1,
  },
  alerts: {
    total: 3,
    critical: 0,
    change: -25,
  },
  processing: {
    rate: '1.2k',
    unit: 'logs/sec',
    change: 12.3,
  }
};

// Mock data for charts
const mockPerformanceData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  'Agent Count': Math.floor(Math.random() * 10) + 35,
  'CPU Usage': Math.floor(Math.random() * 30) + 10,
  'Memory Usage': Math.floor(Math.random() * 20) + 40,
}));

export default function OverviewDashboard() {
  // State for all dashboard data
  const [metrics, setMetrics] = useState<MetricsData>({
    totalAgents: 0,
    activeAgents: 0,
    totalEvents: 0,
    recentEvents: 0,
    securityAlerts: 0,
    criticalAlerts: 0,
    avgResponseTime: 0,
    successRate: 98.5,
  })

  const [eventsByHour, setEventsByHour] = useState<{ hour: string; count: number }[]>([])
  const [alertsByType, setAlertsByType] = useState<{ type: string; count: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Time range for filtering data
  const timeRange = useTimeRange({ defaultRange: '24h' })
  
  // Fetch agents data with type annotation for ExtendedAgent
  const { 
    data: agents = [] as ExtendedAgent[], 
    loading: agentsLoading, 
    error: agentsError 
  } = useApiRequest(() => 
    AgentService.getMostActive(5).then(data => {
      // Map API agents to ExtendedAgent with display properties
      return data.map(agent => ({
        ...agent,
        type: agent.description.split(' ')[0] || 'Unknown', // Simple way to derive a type
        event_count: 0 // Default value which could be updated from other API calls
      }));
    })
  )
  
  // Fetch events data with time range
  const { 
    data: eventsData, 
    loading: eventsLoading, 
    error: eventsError 
  } = useApiRequest(() => 
    EventsService.getAll({
      start_time: timeRange.startTime,
      end_time: timeRange.endTime,
      page_size: 10
    })
  , { dependencies: [timeRange.startTime, timeRange.endTime] })
  
  // Fetch alerts data with type annotation for ExtendedAlert
  const { 
    data: alertsData, 
    loading: alertsLoading, 
    error: alertsError 
  } = useApiRequest(() => 
    AlertsService.getCritical({
      start_time: timeRange.startTime,
      end_time: timeRange.endTime,
      page_size: 5
    }).then(data => {
      // Enhance alerts with additional display properties
      return {
        ...data,
        items: data.items.map(alert => ({
          ...alert,
          type: alert.alert_type, // Map alert_type to type for display
          action_taken: alert.severity === 'critical' ? 'blocked' : 'logged', // Simple action based on severity
        })) as ExtendedAlert[]
      };
    })
  , { dependencies: [timeRange.startTime, timeRange.endTime] })
  
  // Fetch metrics data with time range
  const { 
    data: responseTimeMetrics, 
    loading: metricsLoading, 
    error: metricsError 
  } = useApiRequest(() => 
    MetricsService.responseTime.getAverage({
      start_time: timeRange.startTime,
      end_time: timeRange.endTime
    })
  , { dependencies: [timeRange.startTime, timeRange.endTime] })
  
  // Fetch token usage metrics
  const { 
    data: tokenMetrics, 
    loading: tokenMetricsLoading, 
    error: tokenMetricsError
  } = useApiRequest(() => 
    MetricsService.tokenUsage.getTotal({
      start_time: timeRange.startTime,
      end_time: timeRange.endTime
    })
  , { dependencies: [timeRange.startTime, timeRange.endTime] })
  
  // Fetch hourly events data
  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        // Use the API client to fetch data from the mock API endpoint
        const hourlyResponse = await fetch(`${window.location.origin}/api/v1/metrics/hourly-events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!hourlyResponse.ok) throw new Error('Failed to fetch hourly events');
        
        // Try to parse the JSON response
        const hourlyData = await hourlyResponse.json();
        
        // Check if the data has the expected structure
        if (hourlyData && hourlyData.items) {
          setEventsByHour(hourlyData.items);
        } else {
          // If data doesn't have the expected structure, use mock data
          setEventsByHour(generateMockHourlyData());
        }
      } catch (err) {
        console.error('Error fetching hourly data:', err);
        // Use mock data as fallback
        setEventsByHour(generateMockHourlyData());
      }
    };
    
    fetchHourlyData();
  }, [timeRange.startTime, timeRange.endTime]);
  
  // Fetch alert types data
  useEffect(() => {
    const fetchAlertTypes = async () => {
      try {
        // Use the API client to fetch data from the mock API endpoint
        const typesResponse = await fetch(`${window.location.origin}/api/v1/metrics/alerts/types`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!typesResponse.ok) throw new Error('Failed to fetch alert types');
        
        // Try to parse the JSON response
        const typesData = await typesResponse.json();
        
        // Check if the data has the expected structure
        if (typesData && typesData.items) {
          // Map the API response to the expected format for alertsByType
          const formattedData = typesData.items.map(item => ({
            type: item.type,
            count: item.count
          }));
          setAlertsByType(formattedData);
        } else {
          // If data doesn't have the expected structure, use mock data
          setAlertsByType(generateMockAlertTypes());
        }
      } catch (err) {
        console.error('Error fetching alert types:', err);
        // Use mock data as fallback
        setAlertsByType(generateMockAlertTypes());
      }
    };
    
    fetchAlertTypes();
  }, [timeRange.startTime, timeRange.endTime]);
  
  // Update combined metrics when individual data loads
  useEffect(() => {
    // Always update metrics with available data, using safe defaults for missing data
    setMetrics({
      totalAgents: agents?.length || 0,
      activeAgents: agents?.filter(a => a.active)?.length || 0,
      totalEvents: eventsData?.total || 0,
      recentEvents: eventsData?.items?.length || 0,
      securityAlerts: alertsData?.total || 0,
      criticalAlerts: alertsData?.items?.filter(a => a.severity === 'critical')?.length || 0,
      avgResponseTime: responseTimeMetrics?.average_ms || 0,
      successRate: 98.5, // Default value since it's not in the API response
    });
  }, [agents, eventsData, alertsData, responseTimeMetrics]);
  
  // Check for any errors and set the global error state
  useEffect(() => {
    const errorMessage = agentsError?.message || 
                        eventsError?.message || 
                        alertsError?.message || 
                        metricsError?.message ||
                        tokenMetricsError?.message
    
    if (errorMessage) {
      setError(errorMessage)
    } else {
      setError(null)
    }
  }, [agentsError, eventsError, alertsError, metricsError, tokenMetricsError])

  // Generate mock hourly data for fallback
  const generateMockHourlyData = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: `${i}:00`,
        count: Math.floor(Math.random() * 50) + 10
      })
    }
    return hours
  }
  
  // Generate mock alert type data for fallback
  const generateMockAlertTypes = () => {
    return [
      { type: 'prompt_injection', count: 12 },
      { type: 'sensitive_data_leak', count: 8 },
      { type: 'unusual_behavior', count: 15 },
      { type: 'rate_limit', count: 5 },
      { type: 'authorization_bypass', count: 3 }
    ]
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let color

    // Normalize status to lowercase for more reliable matching
    const normalizedStatus = (status || '').toLowerCase()

    if (
      normalizedStatus.includes('active') ||
      normalizedStatus === 'running' ||
      normalizedStatus === 'online'
    ) {
      color = 'green'
    } else if (
      normalizedStatus.includes('inactive') ||
      normalizedStatus === 'offline' ||
      normalizedStatus === 'stopped'
    ) {
      color = 'gray'
    } else if (normalizedStatus.includes('error') || normalizedStatus === 'failed') {
      color = 'red'
    } else if (normalizedStatus.includes('warning')) {
      color = 'yellow'
    } else if (normalizedStatus.includes('success')) {
      color = 'green'
    } else {
      color = 'blue'
    }

    return (
      <Badge color={color} size="xs">
        {status || 'unknown'}
      </Badge>
    )
  }

  // Update the SeverityBadge component to handle lowercase severity values
  const SeverityBadge = ({ severity }: { severity: string }) => {
    const normalizedSeverity = severity.toLowerCase();

    let color = 'bg-gray-100 text-gray-600';
    let icon = <FaExclamationTriangle className="h-4 w-4" />;

    if (normalizedSeverity === 'low') {
      color = 'bg-blue-100 text-blue-700';
    } else if (normalizedSeverity === 'medium') {
      color = 'bg-yellow-100 text-yellow-700';
    } else if (normalizedSeverity === 'high') {
      color = 'bg-orange-100 text-orange-700';
    } else if (normalizedSeverity === 'critical') {
      color = 'bg-red-100 text-red-700';
      icon = <FaExclamationTriangle className="h-4 w-4" />;
    }

    return (
      <Badge
        className={`${color} capitalize px-2 py-1 text-xs flex items-center gap-1 whitespace-nowrap`}
      >
        {icon}
        {normalizedSeverity}
      </Badge>
    );
  };

  // Helper function to format dates safely
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleString()
    } catch (error) {
      return 'Invalid Date'
    }
  }

  // Helper to get agent name from agent_id
  const getAgentName = (agent_id: string) => {
    const agent = agents.find(a => a.agent_id === agent_id);
    return agent ? agent.name : agent_id;
  }

  // Loading state
  if (agentsLoading || eventsLoading || alertsLoading || metricsLoading || tokenMetricsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"
          data-testid="loading-spinner"
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FaExclamationTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            // Implement a refresh logic here
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        >
          <FaSync className="h-4 w-4 mr-2" /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with title and connection status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cylestio Monitor</h1>
          <p className="text-gray-500 mt-1">AI Agent Observability Dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time range selector */}
          <select 
            className="border rounded p-2 text-sm bg-white" 
            value={timeRange.range} 
            onChange={(e) => timeRange.setRange(e.target.value as any)}
            data-testid="time-range-selector"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <ConnectionStatus />
        </div>
      </div>

      {/* Key Metrics */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mt-6">
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="space-x-4">
            <FaServer className="h-8 w-8 text-blue-500" />
            <div>
              <Text>Total Agents</Text>
              <Metric>{metrics.totalAgents}</Metric>
              <Text className="text-blue-500 flex items-center">
                <span>{metrics.activeAgents} active</span>
                <span className="w-2 h-2 rounded-full bg-green-500 ml-2"></span>
              </Text>
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="teal">
          <Flex justifyContent="start" className="space-x-4">
            <FaBolt className="h-8 w-8 text-teal-500" />
            <div>
              <Text>Total Events</Text>
              <Metric>{(metrics.totalEvents || 0).toLocaleString()}</Metric>
              <Text className="text-teal-500 flex items-center">
                <FaBolt className="h-4 w-4 mr-1" />
                <span>+{metrics.recentEvents} new</span>
              </Text>
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" className="space-x-4">
            <FaExclamationTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Security Alerts</Text>
              <Metric>{metrics.securityAlerts}</Metric>
              <Text className="text-red-500 flex items-center">
                <FaExclamationTriangle className="h-4 w-4 mr-1" />
                <span>{metrics.criticalAlerts} critical</span>
              </Text>
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="indigo">
          <Flex justifyContent="start" className="space-x-4">
            <FaClock className="h-8 w-8 text-indigo-500" />
            <div>
              <Text>Avg Response Time</Text>
              <Metric>{`${metrics.avgResponseTime} ms`}</Metric>
              <Text className="text-green-500 flex items-center">
                <span>{metrics.successRate}% success rate</span>
              </Text>
            </div>
          </Flex>
        </Card>
      </Grid>

      {/* Main Dashboard View with Tabs */}
      <div className="mt-6">
        <TabGroup>
          <TabList className="mb-6">
            <Tab icon={FaServer}>Agents</Tab>
            <Tab icon={FaBolt}>Recent Events</Tab>
            <Tab icon={FaExclamationTriangle}>Security Alerts</Tab>
          </TabList>

          <TabPanels>
            {/* Agents Panel */}
            <TabPanel>
              <Grid numItemsMd={1} numItemsLg={2} className="gap-6">
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <Title>Agent Status</Title>
                    <Link
                      href="/agents"
                      className="text-blue-500 text-sm flex items-center hover:underline"
                    >
                      View All <FaBolt className="h-4 w-4 ml-1" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Name</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Type</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Events</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">
                            Last Active
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentsLoading ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center">
                              <div className="flex items-center justify-center">
                                <FaBolt className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                                <span>Loading agents data...</span>
                              </div>
                            </td>
                          </tr>
                        ) : agents && agents.length > 0 ? (
                          agents.map(agent => (
                            <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <FaServer className="w-5 h-5 text-gray-500" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{agent.name}</div>
                                    <div className="text-xs text-gray-500">{agent.type || 'N/A'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2 whitespace-nowrap">
                                <StatusBadge status={agent.active ? 'active' : 'inactive'} />
                              </td>
                              <td className="py-3 px-2 text-center">
                                {agent.event_count || 0}
                              </td>
                              <td className="py-3 px-2 text-right text-xs text-gray-500">
                                {formatDate(agent.last_active)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-500">
                              No agents found. {agentsError ? `Error: ${agentsError.message}` : ''}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-right">
                    <Link
                      href="/agents"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-end"
                    >
                      View all agents
                      <FaBolt className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4">
                    <Title>Events by Hour</Title>
                    <Text className="text-gray-500">Last 24 hours activity</Text>
                  </div>

                  {eventsLoading ? (
                    <div className="flex items-center justify-center h-72">
                      <div className="flex items-center">
                        <FaBolt className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                        <Text>Loading hourly events data...</Text>
                      </div>
                    </div>
                  ) : Array.isArray(eventsByHour) && eventsByHour.length > 0 ? (
                    <AreaChart
                      className="h-72 mt-4"
                      data={eventsByHour}
                      index="hour"
                      categories={['count']}
                      colors={['blue']}
                      valueFormatter={(value: number) => `${value} events`}
                      showLegend={false}
                      showAnimation={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-72">
                      <Text>No hourly events data available</Text>
                    </div>
                  )}
                </Card>
              </Grid>
            </TabPanel>

            {/* Events Panel */}
            <TabPanel>
              <Grid numItemsMd={1} numItemsLg={1} className="gap-6">
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <Title>Recent Events</Title>
                    <Link
                      href="/events"
                      className="text-blue-500 text-sm flex items-center hover:underline"
                    >
                      View All <FaBolt className="h-4 w-4 ml-1" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Time</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Agent</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Type</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">
                            Description
                          </th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventsLoading ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center">
                              <div className="flex items-center justify-center">
                                <FaBolt className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                                <span>Loading events data...</span>
                              </div>
                            </td>
                          </tr>
                        ) : eventsData?.items && eventsData.items.length > 0 ? (
                          eventsData.items.slice(0, 10).map(event => (
                            <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2 text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(event.timestamp)}
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-medium">{event.event_type}</div>
                                <div className="text-xs text-gray-500">{getAgentName(event.agent_id)}</div>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <Link href={`/events/${event.id}`} className="text-blue-500 hover:text-blue-700">
                                  View <FaBolt className="h-3 w-3 inline" />
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-500">
                              No events found. {eventsError ? `Error: ${eventsError.message}` : ''}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Grid>
            </TabPanel>

            {/* Security Alerts Panel */}
            <TabPanel>
              <Grid numItemsMd={1} numItemsLg={2} className="gap-6">
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <Title>Security Alerts</Title>
                    <Link
                      href="/alerts"
                      className="text-blue-500 text-sm flex items-center hover:underline"
                    >
                      View All <FaBolt className="h-4 w-4 ml-1" />
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Time</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Agent</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Type</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Severity</th>
                          <th className="py-3 px-2 text-sm font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alertsLoading ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center">
                              <div className="flex items-center justify-center">
                                <FaBolt className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                                <span>Loading alerts data...</span>
                              </div>
                            </td>
                          </tr>
                        ) : alertsData?.items && alertsData.items.length > 0 ? (
                          alertsData.items.slice(0, 8).map((alert: ExtendedAlert) => (
                            <tr key={alert.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2 text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(alert.timestamp)}
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-900">{alert.alert_type}</div>
                              </td>
                              <td className="py-3 px-2">
                                <SeverityBadge severity={alert.severity} />
                              </td>
                              <td className="py-3 px-2 text-xs text-gray-500">
                                {alert.action_taken || (alert.severity === 'critical' ? 'blocked' : 'logged')}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <Link href={`/alerts/${alert.id}`} className="text-blue-500 hover:text-blue-700">
                                  View <FaBolt className="h-3 w-3 inline" />
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-500">
                              No alerts found. {alertsError ? `Error: ${alertsError.message}` : ''}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4">
                    <Title>Alert Distribution</Title>
                    <Text className="text-gray-500">By alert type</Text>
                  </div>

                  {alertsLoading ? (
                    <div className="flex items-center justify-center h-72">
                      <div className="flex items-center">
                        <FaBolt className="w-5 h-5 mr-2 animate-spin text-blue-500" />
                        <Text>Loading alert distribution data...</Text>
                      </div>
                    </div>
                  ) : Array.isArray(alertsByType) && alertsByType.length > 0 ? (
                    <SimpleDonutChart
                      className="h-72 mt-4"
                      data={alertsByType.map(item => ({ name: item.type, count: item.count }))}
                      colors={['blue', 'amber', 'red', 'green', 'indigo']}
                      valueFormatter={(value: number) => `${value} alerts`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-72">
                      <Text>No alert data available</Text>
                    </div>
                  )}
                </Card>
              </Grid>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

      {/* Navigation Cards to Other Sections */}
      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/agents" className="block p-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaServer className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Agents</h3>
                <p className="text-gray-500 text-sm">Detailed agent monitoring and management</p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/events" className="block p-4">
            <div className="flex items-center space-x-4">
              <div className="bg-teal-100 p-3 rounded-full">
                <FaBolt className="h-6 w-6 text-teal-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Events & Logs</h3>
                <p className="text-gray-500 text-sm">Detailed event history and log analysis</p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/alerts" className="block p-4">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <FaExclamationTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
                <p className="text-gray-500 text-sm">Critical security issues and mitigation</p>
              </div>
            </div>
          </Link>
        </Card>
      </Grid>
    </div>
  )
}
