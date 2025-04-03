'use client'

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
} from '@tremor/react'
import {
  BoltIcon,
  ClockIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { ConnectionStatus } from './ConnectionStatus'
import { SimpleDonutChart } from './SimpleDonutChart'
import Link from 'next/link'

// Define API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

type AgentData = {
  id: number
  name: string
  status: 'active' | 'inactive' | 'error'
  type: string
  last_active: string
  event_count: number
}

type EventData = {
  id: number
  timestamp: string
  type: string
  agent_id: number
  agent_name: string
  description: string
  status: string
}

type AlertData = {
  id: number
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  type: string
  description: string
  agent_id: number
  agent_name: string
  action_taken: string
}

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

  const [agents, setAgents] = useState<AgentData[]>([])
  const [events, setEvents] = useState<EventData[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [eventsByHour, setEventsByHour] = useState<{ hour: string; count: number }[]>([])
  const [alertsByType, setAlertsByType] = useState<{ type: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch all data
  const fetchAllData = async (isInitialLoad = false) => {
    // Only show loading state on initial load, not during refreshes
    if (isInitialLoad) {
      setLoading(true)
    }
    setError(null)

    try {
      // Fetch agents
      const agentsResponse = await fetch(`${API_BASE_URL}/api/agents`)
      if (!agentsResponse.ok) throw new Error('Failed to fetch agents')
      const agentsData = await agentsResponse.json()

      // Fetch events
      const eventsResponse = await fetch(`${API_BASE_URL}/api/events`)
      if (!eventsResponse.ok) throw new Error('Failed to fetch events')
      const eventsData = await eventsResponse.json()

      // Fetch alerts
      const alertsResponse = await fetch(`${API_BASE_URL}/api/alerts`)
      if (!alertsResponse.ok) throw new Error('Failed to fetch alerts')
      const alertsData = await alertsResponse.json()

      // Fetch metrics
      const metricsResponse = await fetch(`${API_BASE_URL}/api/metrics`)
      if (!metricsResponse.ok) throw new Error('Failed to fetch metrics')
      const metricsData = await metricsResponse.json()

      // Fetch events by hour
      const hourlyResponse = await fetch(`${API_BASE_URL}/api/events/hourly`)
      if (!hourlyResponse.ok) throw new Error('Failed to fetch hourly events')
      const hourlyData = await hourlyResponse.json()

      // Fetch alerts by type
      const typesResponse = await fetch(`${API_BASE_URL}/api/alerts/types`)
      if (!typesResponse.ok) throw new Error('Failed to fetch alert types')
      const typesData = await typesResponse.json()

      // Update state only after all requests complete to minimize renders
      setAgents(agentsData || [])
      setEvents(eventsData.events || [])
      setAlerts(alertsData.alerts || [])
      setEventsByHour(hourlyData || [])
      setAlertsByType(typesData || [])

      // Update metrics
      setMetrics({
        totalAgents: agentsData.length,
        activeAgents: agentsData.filter((a: AgentData) =>
          (a.status || '').toLowerCase().includes('active')
        ).length,
        totalEvents: eventsData.total || 0,
        recentEvents: Math.min(100, eventsData.events?.length || 0),
        securityAlerts: alertsData.total || 0,
        criticalAlerts: alertsData.critical || 0,
        avgResponseTime: metricsData.avgResponseTime || 0,
        successRate: metricsData.successRate || 98.5,
      })

      if (isInitialLoad) {
        setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data. Please try again later.')
      setLoading(false)

      // Use mock data as fallback
      initializeMockData()
    }
  }

  // Initial data load
  useEffect(() => {
    fetchAllData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mock data initialization (as fallback)
  const initializeMockData = () => {
    // Mock agents
    const mockAgents: AgentData[] = [
      {
        id: 1,
        name: 'Customer Service Bot',
        status: 'active',
        type: 'chat',
        last_active: new Date().toISOString(),
        event_count: 2435,
      },
      {
        id: 2,
        name: 'Data Analyzer',
        status: 'active',
        type: 'analysis',
        last_active: new Date().toISOString(),
        event_count: 1526,
      },
      {
        id: 3,
        name: 'Security Monitor',
        status: 'active',
        type: 'security',
        last_active: new Date().toISOString(),
        event_count: 892,
      },
      {
        id: 4,
        name: 'Legacy Integration',
        status: 'inactive',
        type: 'integration',
        last_active: new Date(Date.now() - 86400000).toISOString(),
        event_count: 421,
      },
      {
        id: 5,
        name: 'Inventory Assistant',
        status: 'error',
        type: 'assistant',
        last_active: new Date(Date.now() - 3600000).toISOString(),
        event_count: 198,
      },
    ]

    // Mock events
    const eventTypes = ['query', 'response', 'tool_call', 'llm_call', 'action', 'error']
    const mockEvents: EventData[] = Array(20)
      .fill(null)
      .map((_, i) => {
        const agentIndex = Math.floor(Math.random() * mockAgents.length)
        return {
          id: i + 1,
          timestamp: new Date(Date.now() - i * 300000).toISOString(),
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          agent_id: mockAgents[agentIndex].id,
          agent_name: mockAgents[agentIndex].name,
          description: `Event ${i + 1} description`,
          status: Math.random() > 0.2 ? 'success' : Math.random() > 0.5 ? 'warning' : 'error',
        }
      })

    // Mock alerts
    const alertTypes = [
      'prompt_injection',
      'sensitive_data_leak',
      'unusual_behavior',
      'rate_limit',
      'authorization_bypass',
    ]
    const severityLevels: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = [
      'LOW',
      'MEDIUM',
      'HIGH',
      'CRITICAL',
    ]
    const mockAlerts: AlertData[] = Array(10)
      .fill(null)
      .map((_, i) => {
        const agentIndex = Math.floor(Math.random() * mockAgents.length)
        const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)]
        return {
          id: i + 1,
          timestamp: new Date(Date.now() - i * 600000).toISOString(),
          severity,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          description: `Alert ${i + 1} description`,
          agent_id: mockAgents[agentIndex].id,
          agent_name: mockAgents[agentIndex].name,
          action_taken: severity === 'CRITICAL' || severity === 'HIGH' ? 'blocked' : 'logged',
        }
      })

    // Mock hourly data
    const mockHourlyData = []
    for (let i = 0; i < 24; i++) {
      const hour = `${i < 10 ? '0' + i : i}:00`
      const count = Math.floor(Math.random() * 10)
      mockHourlyData.push({ hour, count })
    }

    // Mock alert types
    const mockAlertTypes = alertTypes.map(type => ({
      type,
      count: Math.floor(Math.random() * 20),
    }))

    // Initialize state with mock values
    setAgents(mockAgents)
    setEvents(mockEvents)
    setAlerts(mockAlerts)
    setEventsByHour(mockHourlyData)
    setAlertsByType(mockAlertTypes)

    setMetrics({
      totalAgents: mockAgents.length,
      activeAgents: mockAgents.filter(a => a.status === 'active').length,
      totalEvents: 5472,
      recentEvents: mockEvents.length,
      securityAlerts: 48,
      criticalAlerts: mockAlerts.filter(a => a.severity === 'CRITICAL').length,
      avgResponseTime: 245,
      successRate: 98.5,
    })
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

  // Alert severity badge component
  const SeverityBadge = ({ severity }: { severity: string }) => {
    let color

    switch (severity) {
      case 'CRITICAL':
        color = 'red'
        break
      case 'HIGH':
        color = 'orange'
        break
      case 'MEDIUM':
        color = 'yellow'
        break
      case 'LOW':
        color = 'green'
        break
      default:
        color = 'blue'
    }

    return (
      <Badge color={color} size="xs">
        {severity}
      </Badge>
    )
  }

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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <ExclamationTriangleIcon className="h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchAllData(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" /> Retry
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
        <ConnectionStatus />
      </div>

      {/* Key Metrics */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mt-6">
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="space-x-4">
            <CpuChipIcon className="h-8 w-8 text-blue-500" />
            <div>
              <Text>Total Agents</Text>
              <Metric>{metrics.totalAgents}</Metric>
              <Text className="text-blue-500 flex items-center">
                <span>{metrics.activeAgents} active</span>
                <div className="w-2 h-2 rounded-full bg-green-500 ml-2"></div>
              </Text>
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="teal">
          <Flex justifyContent="start" className="space-x-4">
            <BoltIcon className="h-8 w-8 text-teal-500" />
            <div>
              <Text>Total Events</Text>
              <Metric>{(metrics.totalEvents || 0).toLocaleString()}</Metric>
              <Text className="text-teal-500 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+{metrics.recentEvents} new</span>
              </Text>
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" className="space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Security Alerts</Text>
              <Metric>{metrics.securityAlerts}</Metric>
              <Text className="text-red-500 flex items-center">
                <ShieldExclamationIcon className="h-4 w-4 mr-1" />
                <span>{metrics.criticalAlerts} critical</span>
              </Text>
            </div>
          </Flex>
        </Card>

        <Card decoration="top" decorationColor="indigo">
          <Flex justifyContent="start" className="space-x-4">
            <ClockIcon className="h-8 w-8 text-indigo-500" />
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
            <Tab icon={CpuChipIcon}>Agents</Tab>
            <Tab icon={ChatBubbleLeftRightIcon}>Recent Events</Tab>
            <Tab icon={ShieldExclamationIcon}>Security Alerts</Tab>
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
                      View All <ArrowPathIcon className="h-4 w-4 ml-1" />
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
                        {agents.map(agent => (
                          <tr key={agent.id} className="cursor-pointer hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <Link
                                href={`/agents/${agent.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {agent.name}
                              </Link>
                            </td>
                            <td className="py-3 px-2 text-gray-500">{agent.type}</td>
                            <td className="py-3 px-2">
                              <StatusBadge status={agent.status} />
                            </td>
                            <td className="py-3 px-2 text-gray-500">{agent.event_count}</td>
                            <td className="py-3 px-2 text-gray-500">
                              {formatDate(agent.last_active)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-right">
                    <Link
                      href="/agents"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-end"
                    >
                      View all agents
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4">
                    <Title>Events by Hour</Title>
                    <Text className="text-gray-500">Last 24 hours activity</Text>
                  </div>

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
                      View All <ArrowPathIcon className="h-4 w-4 ml-1" />
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
                        {events.slice(0, 10).map(event => (
                          <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(event.timestamp)}
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-medium text-gray-900">{event.agent_name}</div>
                            </td>
                            <td className="py-3 px-2 text-gray-500">{event.type}</td>
                            <td className="py-3 px-2 text-gray-500">{event.description}</td>
                            <td className="py-3 px-2">
                              <StatusBadge status={event.status} />
                            </td>
                          </tr>
                        ))}
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
                      View All <ArrowPathIcon className="h-4 w-4 ml-1" />
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
                        {alerts.slice(0, 8).map(alert => (
                          <tr key={alert.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(alert.timestamp)}
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-medium text-gray-900">{alert.agent_name}</div>
                            </td>
                            <td className="py-3 px-2 text-gray-500">{alert.type}</td>
                            <td className="py-3 px-2">
                              <SeverityBadge severity={alert.severity} />
                            </td>
                            <td className="py-3 px-2 text-gray-500">
                              {alert.action_taken === 'blocked' ? (
                                <span className="text-red-500 font-medium">Blocked</span>
                              ) : (
                                <span className="text-gray-500">Logged</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4">
                    <Title>Alert Distribution</Title>
                    <Text className="text-gray-500">By alert type</Text>
                  </div>

                  {Array.isArray(alertsByType) ? (
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
                <CpuChipIcon className="h-6 w-6 text-blue-500" />
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
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-teal-500" />
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
                <ShieldExclamationIcon className="h-6 w-6 text-red-500" />
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
