'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Card, 
  Title, 
  Text, 
  Grid, 
  Col,
  Flex,
  AreaChart,
  BarChart,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Divider,
  Metric,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels
} from '@tremor/react'
import { 
  UserCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

import EnhancedBreadcrumbs from '../../components/EnhancedBreadcrumbs'
import DrilldownMetricCard from '../../components/DrilldownMetricCard'
import InteractiveChart from '../../components/InteractiveChart'

// Mock data for demonstration
const mockAgentDetailData = {
  id: 'agent-1',
  name: 'Customer Support Bot',
  type: 'Chatbot',
  description: 'AI assistant that handles customer support inquiries across multiple channels',
  status: 'active',
  createdAt: '2023-01-01T10:00:00Z',
  lastActive: '2023-01-07T15:32:10Z',
  metrics: {
    totalSessions: 245,
    totalErrors: 12,
    averageSessionDuration: '2m 45s',
    successRate: '95.1%'
  },
  sessionsTrend: [
    { date: '2023-01-01', Sessions: 28, Errors: 2 },
    { date: '2023-01-02', Sessions: 32, Errors: 1 },
    { date: '2023-01-03', Sessions: 35, Errors: 3 },
    { date: '2023-01-04', Sessions: 42, Errors: 2 },
    { date: '2023-01-05', Sessions: 38, Errors: 1 },
    { date: '2023-01-06', Sessions: 45, Errors: 2 },
    { date: '2023-01-07', Sessions: 25, Errors: 1 }
  ],
  toolUsage: [
    { name: 'Database Query', value: 125 },
    { name: 'Knowledge Base', value: 87 },
    { name: 'Email Sender', value: 63 },
    { name: 'Calendar API', value: 42 },
    { name: 'CRM Integration', value: 35 }
  ],
  recentSessions: [
    { id: 'session-1', startTime: '2023-01-07T15:32:10Z', duration: '3m 12s', status: 'completed', events: 24, errors: 0 },
    { id: 'session-2', startTime: '2023-01-07T14:22:05Z', duration: '2m 45s', status: 'completed', events: 18, errors: 1 },
    { id: 'session-3', startTime: '2023-01-07T13:45:30Z', duration: '1m 52s', status: 'error', events: 12, errors: 2 },
    { id: 'session-4', startTime: '2023-01-07T12:10:15Z', duration: '4m 05s', status: 'completed', events: 32, errors: 0 },
    { id: 'session-5', startTime: '2023-01-07T11:30:45Z', duration: '2m 33s', status: 'completed', events: 21, errors: 0 }
  ]
}

const AgentDetailPage = () => {
  const searchParams = useSearchParams()
  const agentId = searchParams.get('id') || ''
  
  // In a real application, this would fetch the agent data based on the ID
  useEffect(() => {
    console.log(`Fetching agent data for ID: ${agentId}`)
    // API call would go here
  }, [agentId])
  
  if (!agentId) {
    return (
      <div className="p-4 md:p-6">
        <Card className="mx-auto max-w-lg">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <Title>Agent Not Found</Title>
            <Text className="mt-2 mb-4">No agent ID was provided in the URL.</Text>
            <Button href="/agents/explorer">Go to Agent Explorer</Button>
          </div>
        </Card>
      </div>
    )
  }
  
  // Use mock data for demonstration
  const agent = mockAgentDetailData
  
  return (
    <div className="p-4 md:p-6">
      {/* Breadcrumb Navigation */}
      <EnhancedBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Agents Explorer', href: '/agents/explorer', preserveParams: ['dateRange'] },
          { label: agent.name, current: true }
        ]}
        className="mb-4"
      />
      
      {/* Agent Header Card */}
      <Card className="mb-6">
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center">
            <div className="bg-primary-50 p-3 rounded-full mr-4">
              <UserCircleIcon className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <Title>{agent.name}</Title>
              <Text>{agent.type} • Last active {new Date(agent.lastActive).toLocaleString()}</Text>
            </div>
          </Flex>
          
          <Badge color={agent.status === 'active' ? 'green' : 'red'} size="xl">
            {agent.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </Flex>
        
        <Divider className="my-4" />
        
        <Text>{agent.description}</Text>
        
        <Divider className="my-4" />
        
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <Card decoration="top" decorationColor="blue">
            <Text>Total Sessions</Text>
            <Metric>{agent.metrics.totalSessions}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="emerald">
            <Text>Success Rate</Text>
            <Metric>{agent.metrics.successRate}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="amber">
            <Text>Avg. Duration</Text>
            <Metric>{agent.metrics.averageSessionDuration}</Metric>
          </Card>
          
          <Card decoration="top" decorationColor="red">
            <Text>Total Errors</Text>
            <Metric>{agent.metrics.totalErrors}</Metric>
          </Card>
        </Grid>
      </Card>
      
      {/* Agent Details Tabs */}
      <TabGroup className="mb-6">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Sessions</Tab>
          <Tab>Tools</Tab>
          <Tab>Configurations</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Panel */}
          <TabPanel>
            <Grid numItemsMd={2} className="gap-6 mt-6">
              <Card>
                <Title>Session Activity</Title>
                <Text>Sessions and errors over time</Text>
                
                <InteractiveChart
                  baseUrl="/events/explorer"
                  getQueryParams={(dataPoint) => ({
                    agentId: agent.id,
                    date: dataPoint.date
                  })}
                  renderTooltip={(dataPoint) => (
                    <div>
                      <div className="font-medium">{dataPoint.date}</div>
                      <div>Sessions: {dataPoint.Sessions}</div>
                      <div>Errors: {dataPoint.Errors}</div>
                    </div>
                  )}
                >
                  <AreaChart
                    className="h-72 mt-4"
                    data={agent.sessionsTrend}
                    index="date"
                    categories={['Sessions', 'Errors']}
                    colors={['blue', 'red']}
                    valueFormatter={(value) => `${value}`}
                    showLegend={true}
                  />
                </InteractiveChart>
              </Card>
              
              <Card>
                <Title>Top Tools Used</Title>
                <Text>Most frequently used tools by this agent</Text>
                
                <InteractiveChart
                  baseUrl="/tools/explorer"
                  getQueryParams={(dataPoint) => ({
                    agentId: agent.id,
                    tool: dataPoint.name
                  })}
                  renderTooltip={(dataPoint) => (
                    <div>
                      <div className="font-medium">{dataPoint.name}</div>
                      <div>Usage Count: {dataPoint.value}</div>
                    </div>
                  )}
                >
                  <BarChart
                    className="h-72 mt-4"
                    data={agent.toolUsage}
                    index="name"
                    categories={['value']}
                    colors={['indigo']}
                    valueFormatter={(value) => `${value}`}
                    showLegend={false}
                    yAxisWidth={48}
                  />
                </InteractiveChart>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* Sessions Panel */}
          <TabPanel>
            <Card className="mt-6">
              <Flex className="justify-between items-center mb-4">
                <Title>Recent Sessions</Title>
                <Button variant="light" size="xs">View All Sessions</Button>
              </Flex>
              
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Session ID</TableHeaderCell>
                    <TableHeaderCell>Start Time</TableHeaderCell>
                    <TableHeaderCell>Duration</TableHeaderCell>
                    <TableHeaderCell>Events</TableHeaderCell>
                    <TableHeaderCell>Errors</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agent.recentSessions.map((session) => {
                    const formattedDate = new Date(session.startTime).toLocaleString()
                    const hasErrors = session.errors > 0
                    
                    return (
                      <TableRow 
                        key={session.id}
                        className="cursor-pointer hover:bg-neutral-50"
                        onClick={() => {
                          window.location.href = `/sessions/detail?id=${session.id}`
                        }}
                      >
                        <TableCell>{session.id}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{session.duration}</TableCell>
                        <TableCell>{session.events}</TableCell>
                        <TableCell>{session.errors}</TableCell>
                        <TableCell>
                          <Badge color={session.status === 'completed' ? 'green' : 'red'}>
                            {session.status === 'completed' ? 'Completed' : 'Error'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
          
          {/* Tools Panel */}
          <TabPanel>
            <Card className="mt-6">
              <Title>Tool Usage Analysis</Title>
              <Text>Details about tools used by this agent</Text>
              
              <div className="flex flex-col items-center justify-center my-12 text-center text-neutral-500">
                <ShieldCheckIcon className="h-16 w-16 mb-4" />
                <Title>Tool Details</Title>
                <Text className="max-w-md">
                  This area would contain detailed information about the tools used by this agent,
                  including performance metrics, error rates, and configurations.
                </Text>
              </div>
            </Card>
          </TabPanel>
          
          {/* Configurations Panel */}
          <TabPanel>
            <Card className="mt-6">
              <Title>Agent Configuration</Title>
              <Text>Configuration settings for this agent</Text>
              
              <div className="flex flex-col items-center justify-center my-12 text-center text-neutral-500">
                <ShieldCheckIcon className="h-16 w-16 mb-4" />
                <Title>Configuration Details</Title>
                <Text className="max-w-md">
                  This area would contain configuration settings for this agent,
                  including API connections, model settings, and permission controls.
                </Text>
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}

export default AgentDetailPage 