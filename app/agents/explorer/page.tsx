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
  BarList,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button
} from '@tremor/react'
import { ChartBarIcon, UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

import FilterBar from '../../components/FilterBar'
import EnhancedBreadcrumbs from '../../components/EnhancedBreadcrumbs'
import DrilldownMetricCard from '../../components/DrilldownMetricCard'
import InteractiveChart from '../../components/InteractiveChart'
import appSettings from '../../config/app-settings'

// Mock data for demonstration
const mockAgentData = {
  metrics: {
    totalAgents: 124,
    activeAgents: 87,
    agentsWithErrors: 12,
    averageRuntime: '3.2s'
  },
  agentsByType: [
    { name: 'Chatbot', value: 45 },
    { name: 'Data Processing', value: 32 },
    { name: 'Content Generation', value: 28 },
    { name: 'Research Assistant', value: 19 }
  ],
  activityTrend: [
    { date: '2023-01-01', Sessions: 45, Errors: 3 },
    { date: '2023-01-02', Sessions: 52, Errors: 2 },
    { date: '2023-01-03', Sessions: 49, Errors: 5 },
    { date: '2023-01-04', Sessions: 63, Errors: 4 },
    { date: '2023-01-05', Sessions: 58, Errors: 3 },
    { date: '2023-01-06', Sessions: 71, Errors: 6 },
    { date: '2023-01-07', Sessions: 82, Errors: 5 }
  ],
  recentAgents: [
    { id: 'agent-1', name: 'Customer Support Bot', type: 'Chatbot', sessions: 245, errors: 12, lastActive: '2023-01-07T15:32:10Z' },
    { id: 'agent-2', name: 'Data Analyzer', type: 'Data Processing', sessions: 187, errors: 3, lastActive: '2023-01-07T14:22:05Z' },
    { id: 'agent-3', name: 'Blog Writer', type: 'Content Generation', sessions: 132, errors: 8, lastActive: '2023-01-07T13:45:30Z' },
    { id: 'agent-4', name: 'Market Researcher', type: 'Research Assistant', sessions: 95, errors: 2, lastActive: '2023-01-07T12:10:15Z' },
    { id: 'agent-5', name: 'Email Assistant', type: 'Chatbot', sessions: 156, errors: 5, lastActive: '2023-01-07T11:30:45Z' }
  ]
}

const AgentExplorerPage = () => {
  const searchParams = useSearchParams()
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  
  // Define filter options
  const filterOptions = [
    {
      id: 'agentType',
      label: 'Agent Type',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Types' },
        { value: 'Chatbot', label: 'Chatbot' },
        { value: 'Data Processing', label: 'Data Processing' },
        { value: 'Content Generation', label: 'Content Generation' },
        { value: 'Research Assistant', label: 'Research Assistant' }
      ]
    },
    {
      id: 'search',
      label: 'Search Agents',
      type: 'search' as const,
      placeholder: 'Search by name or ID...'
    },
    {
      id: 'dateRange',
      label: 'Time Range',
      type: 'dateRange' as const
    }
  ]
  
  // Handle filter changes
  const handleFilterChange = (values: Record<string, any>) => {
    setFilterValues(values)
    // In a real implementation, this would trigger API calls to fetch filtered data
    console.log('Filter values changed:', values)
  }
  
  return (
    <div className="p-4 md:p-6">
      {/* Breadcrumb Navigation */}
      <EnhancedBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Agents Explorer', current: true }
        ]}
        className="mb-4"
      />
      
      {/* Page Header */}
      <div className="mb-6">
        <Title>Agents Explorer</Title>
        <Text>Analyze and monitor your agent performance and activities</Text>
      </div>
      
      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        onFilterChange={handleFilterChange}
      />
      
      {/* Summary Metrics */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <DrilldownMetricCard
          title="Total Agents"
          value={mockAgentData.metrics.totalAgents}
          icon={<UserCircleIcon className="h-5 w-5" />}
          href="/agents/explorer"
          variant="primary"
        />
        
        <DrilldownMetricCard
          title="Active Agents"
          value={mockAgentData.metrics.activeAgents}
          icon={<UserCircleIcon className="h-5 w-5" />}
          trend={{ value: 12, direction: 'up', label: 'vs last week' }}
          href="/agents/explorer"
          queryParams={{ status: 'active' }}
          variant="success"
        />
        
        <DrilldownMetricCard
          title="Agents With Errors"
          value={mockAgentData.metrics.agentsWithErrors}
          icon={<UserCircleIcon className="h-5 w-5" />}
          trend={{ value: 8, direction: 'up', label: 'vs last week', isPositive: false }}
          href="/agents/explorer"
          queryParams={{ status: 'error' }}
          variant="error"
        />
        
        <DrilldownMetricCard
          title="Average Runtime"
          value={mockAgentData.metrics.averageRuntime}
          icon={<ClockIcon className="h-5 w-5" />}
          trend={{ value: 5, direction: 'down', label: 'vs last week', isPositive: true }}
          href="/agents/explorer"
          queryParams={{ view: 'performance' }}
          variant="secondary"
        />
      </Grid>
      
      {/* Charts Section */}
      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Flex className="items-center justify-between mb-4">
            <Title>Agent Activity Trend</Title>
            <Button variant="light" size="xs">View All</Button>
          </Flex>
          
          <InteractiveChart
            baseUrl="/events/explorer"
            getQueryParams={(dataPoint) => ({
              date: dataPoint.date,
              type: 'agent_activity'
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
              className="h-72"
              data={mockAgentData.activityTrend}
              index="date"
              categories={['Sessions', 'Errors']}
              colors={['blue', 'red']}
              valueFormatter={(value) => `${value}`}
              showLegend={true}
            />
          </InteractiveChart>
        </Card>
        
        {appSettings.agents.charts.showAgentTypeDistribution && (
          <Card>
            <Flex className="items-center justify-between mb-4">
              <Title>Agents by Type</Title>
              <Button variant="light" size="xs">View All</Button>
            </Flex>
            
            <InteractiveChart
              baseUrl="/agents/explorer"
              getQueryParams={(dataPoint) => ({
                agentType: dataPoint.name
              })}
              renderTooltip={(dataPoint) => (
                <div>
                  <div className="font-medium">{dataPoint.name}</div>
                  <div>Count: {dataPoint.value}</div>
                </div>
              )}
            >
              <BarList
                data={mockAgentData.agentsByType}
                className="h-72"
                showAnimation={true}
              />
            </InteractiveChart>
          </Card>
        )}
      </Grid>
      
      {/* Recent Agents Table */}
      <Card className="mb-6">
        <Flex className="items-center justify-between mb-4">
          <Title>Recent Agents</Title>
          <Button variant="light" size="xs">View All</Button>
        </Flex>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Sessions</TableHeaderCell>
              <TableHeaderCell>Errors</TableHeaderCell>
              <TableHeaderCell>Last Active</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockAgentData.recentAgents.map((agent) => {
              const hasErrors = agent.errors > 0
              const formattedDate = new Date(agent.lastActive).toLocaleString()
              
              return (
                <TableRow 
                  key={agent.id}
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => {
                    window.location.href = `/agents/detail?id=${agent.id}`
                  }}
                >
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.type}</TableCell>
                  <TableCell>{agent.sessions}</TableCell>
                  <TableCell>{agent.errors}</TableCell>
                  <TableCell>{formattedDate}</TableCell>
                  <TableCell>
                    <Badge color={hasErrors ? 'red' : 'green'}>
                      {hasErrors ? 'Issues Detected' : 'Healthy'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export default AgentExplorerPage 