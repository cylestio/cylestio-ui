'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableBody,
  Badge,
  Title,
  Text,
  TextInput,
  Select,
  SelectItem,
  Button,
  Flex,
  Grid,
  Metric,
  AreaChart,
  BarChart,
  DonutChart,
  Divider,
} from '@tremor/react';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  ArrowLeftIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchAPI, buildQueryParams, PaginationParams, TimeRangeParams, SearchParams } from '../lib/api';
import { SECURITY } from '../lib/api-endpoints';

// Define types based on new API
type Alert = {
  alert_id: string;
  timestamp: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  related_event_id: string;
  agent_id: string;
  agent_name: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

type AlertsResponse = {
  items: Alert[];
  pagination: PaginationInfo;
  meta: {
    time_period: string;
    from_time: string;
    to_time: string;
  };
};

type AlertMetric = {
    name: string;
  value: number;
};

type ChartDataPoint = {
  timestamp: string;
  value: number;
  dimensions?: {
    severity?: string;
    type?: string;
  };
};

type MetricsResponse = {
  data: ChartDataPoint[];
  meta: {
    time_period: string;
    from_time: string;
    to_time: string;
    interval?: string;
    dimensions?: string[];
  };
};

type AlertFilters = PaginationParams & TimeRangeParams & SearchParams & {
  severity?: string;
  type?: string;
  status?: string;
};

export function SecurityAlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0,
  });
  const [alertTrend, setAlertTrend] = useState<ChartDataPoint[]>([]);
  const [alertsBySeverity, setAlertsBySeverity] = useState<AlertMetric[]>([]);
  const [alertsByType, setAlertsByType] = useState<AlertMetric[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch alerts from the API
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: AlertFilters = {
        page: pagination.page,
        page_size: pagination.page_size,
        time_range: timeRange,
      };

      if (severityFilter !== 'all') {
        params.severity = severityFilter;
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      // Use API service to fetch alerts with centralized endpoint configuration
      const data = await fetchAPI<AlertsResponse>(`${SECURITY.ALERTS}${buildQueryParams(params)}`);
      
      setAlerts(data.items);
      setPagination(data.pagination);
      
      // Fetch alert trend data
      const trendParams = {
        time_range: timeRange,
        interval: getInterval(timeRange)
      };
      
      const trendData = await fetchAPI<MetricsResponse>(
        `${SECURITY.ALERT_METRICS}${buildQueryParams(trendParams)}`
      );
      setAlertTrend(trendData.data || []);
      
      // Fetch alerts by severity
      const severityParams = {
        time_range: timeRange,
        dimensions: 'severity'
      };
      
      const severityData = await fetchAPI<MetricsResponse>(
        `${SECURITY.ALERT_METRICS}${buildQueryParams(severityParams)}`
      );
      
      // Transform to format for charts
      const severityMetrics = Object.entries(
        severityData.data.reduce((acc: Record<string, number>, item: ChartDataPoint) => {
          const severity = item.dimensions?.severity || 'unknown';
          acc[severity] = (acc[severity] || 0) + item.value;
          return acc;
        }, {})
      ).map(([severity, count]) => ({ name: severity, value: count as number }));
      
      setAlertsBySeverity(severityMetrics);
      
      // Fetch alerts by type
      const typeParams = {
        time_range: timeRange,
        dimensions: 'type'
      };
      
      const typeData = await fetchAPI<MetricsResponse>(
        `${SECURITY.ALERT_METRICS}${buildQueryParams(typeParams)}`
      );
      
      // Transform to format for charts
      const typeMetrics = Object.entries(
        typeData.data.reduce((acc: Record<string, number>, item: ChartDataPoint) => {
          const type = item.dimensions?.type || 'unknown';
          acc[type] = (acc[type] || 0) + item.value;
          return acc;
        }, {})
      ).map(([type, count]) => ({ name: type, value: count as number }));
      
      setAlertsByType(typeMetrics);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate interval based on time range
  const getInterval = (range: string): string => {
    switch (range) {
      case '1h': return '5m';
      case '1d': return '1h';
      case '7d': return '1d';
      case '30d': return '1d';
      default: return '1d';
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAlerts();
  }, [pagination.page, timeRange, severityFilter, typeFilter, statusFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'rose';
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Format date for charts
  const formatChartDate = (timestamp: string, range: string) => {
    const date = new Date(timestamp);
    
    switch (range) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      default:
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Transform time series data for charts
  const prepareChartData = (data: ChartDataPoint[]) => {
    return data.map(item => ({
      date: formatChartDate(item.timestamp, timeRange),
      value: item.value
    }));
  };

  // Generate pagination controls
  const renderPagination = () => {
    const { page, total_pages } = pagination;
    
    if (total_pages <= 1) return null;
    
    const pageButtons = [];
    const maxButtonsToShow = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(total_pages, startPage + maxButtonsToShow - 1);
    
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    if (page > 1) {
      pageButtons.push(
          <Button 
          key="prev" 
          variant="light" 
          onClick={() => handlePageChange(page - 1)}
          icon={ArrowLeftIcon}
          size="xs"
        >
          Previous
          </Button>
      );
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
          <Button 
          key={i}
          variant={i === page ? "primary" : "light"}
          onClick={() => handlePageChange(i)}
          size="xs"
        >
          {i}
          </Button>
      );
    }
    
    if (page < total_pages) {
      pageButtons.push(
            <Button 
          key="next" 
              variant="light" 
          onClick={() => handlePageChange(page + 1)}
          iconPosition="right"
          icon={ArrowLeftIcon}
          className="rotate-180"
                        size="xs"
                      >
          Next
                      </Button>
      );
    }
    
  return (
      <Flex justifyContent="center" className="mt-4 gap-2">
        {pageButtons}
      </Flex>
    );
  };

  return (
    <div className="p-6">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <Flex alignItems="center" className="gap-2">
          <Link href="/">
            <Button variant="light" icon={ArrowLeftIcon}>
              Back to Dashboard
            </Button>
          </Link>
          <Title>Security Alerts</Title>
        </Flex>
        <Flex justifyContent="end" className="space-x-4">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
            className="w-40"
          >
            <SelectItem value="1h">Last hour</SelectItem>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </Select>
            <Button 
              icon={ArrowPathIcon} 
              variant="light" 
            loading={loading}
            onClick={() => fetchAlerts()}
            >
              Refresh
            </Button>
        </Flex>
      </Flex>

      {lastUpdated && (
        <Text className="text-xs text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      {/* Summary Cards */}
      <Grid numItemsMd={3} className="gap-6 mb-6">
                <Card decoration="top" decorationColor="red">
          <Flex justifyContent="start" className="gap-2">
            <ShieldExclamationIcon className="h-6 w-6 text-red-500" />
                    <div>
              <Text>Total Alerts</Text>
              <Metric>{pagination.total_items}</Metric>
                    </div>
          </Flex>
                </Card>
        <Card decoration="top" decorationColor="rose">
          <Flex justifyContent="start" className="gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-rose-500" />
                    <div>
              <Text>Critical/High Alerts</Text>
              <Metric>
                {alertsBySeverity
                  .filter(a => ['critical', 'high'].includes(a.name.toLowerCase()))
                  .reduce((sum, item) => sum + item.value, 0)}
              </Metric>
                    </div>
          </Flex>
                </Card>
        <Card decoration="top" decorationColor="amber">
          <Flex justifyContent="start" className="gap-2">
            <CheckBadgeIcon className="h-6 w-6 text-amber-500" />
            <div>
              <Text>Active Alerts</Text>
                  <Metric>
                {alerts.filter(a => a.status.toLowerCase() === 'active').length}
                  </Metric>
            </div>
          </Flex>
                </Card>
      </Grid>

      {/* Charts */}
      <Grid numItemsMd={2} className="gap-6 mb-6">
                <Card>
          <Title>Alert Trend</Title>
          <AreaChart
            className="h-72 mt-4"
            data={prepareChartData(alertTrend)}
                        index="date"
            categories={["value"]}
            colors={["red"]}
            valueFormatter={(value) => `${value} alerts`}
                        showLegend={false}
                      />
                </Card>
                <Card>
                  <Title>Alerts by Severity</Title>
          <DonutChart
            className="h-72 mt-4"
            data={alertsBySeverity}
            category="value"
            index="name"
            colors={["rose", "red", "orange", "yellow", "gray"]}
                    valueFormatter={(value) => `${value} alerts`}
                  />
                </Card>
              </Grid>

      {/* Alert Filters */}
      <Card className="mb-6">
        <Flex justifyContent="between" className="mb-4 gap-2">
                  <TextInput
                    icon={MagnifyingGlassIcon}
                    placeholder="Search alerts..."
            className="max-w-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchAlerts();
              }
            }}
          />
          <Flex className="gap-2">
                      <Select
                        value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value)}
              placeholder="Filter by severity"
              className="w-40"
                      >
              <SelectItem value="all">All severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </Select>
                      <Select
                        value={typeFilter}
              onValueChange={(value) => setTypeFilter(value)}
              placeholder="Filter by type"
              className="w-48"
            >
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="prompt_injection">Prompt Injection</SelectItem>
              <SelectItem value="sensitive_data">Sensitive Data</SelectItem>
              <SelectItem value="jailbreak_attempt">Jailbreak Attempt</SelectItem>
              <SelectItem value="malicious_code">Malicious Code</SelectItem>
              <SelectItem value="data_exfiltration">Data Exfiltration</SelectItem>
              <SelectItem value="pattern_match">Pattern Match</SelectItem>
                      </Select>
                      <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              placeholder="Filter by status"
              className="w-40"
            >
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
                      </Select>
          </Flex>
        </Flex>

        <Divider />

        {error ? (
          <Text color="red">{error}</Text>
        ) : (
          <Table>
                  <TableHead>
                    <TableRow>
                <TableHeaderCell>Alert ID</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                      <TableHeaderCell>Agent</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Severity</TableHeaderCell>
                      <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Text>Loading...</Text>
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <Text>No alerts found.</Text>
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.alert_id}>
                    <TableCell>{alert.alert_id}</TableCell>
                        <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/agents/${alert.agent_id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {alert.agent_name}
                      </Link>
                    </TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>
                      <Badge color={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={alert.description}>
                      {alert.description}
                    </TableCell>
                    <TableCell>
                      <Badge color={alert.status === 'resolved' ? 'green' : 'red'}>
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/events/${alert.related_event_id}`} className="text-blue-500 hover:text-blue-700">
                        <Flex className="items-center gap-1">
                          <EyeIcon className="h-4 w-4" />
                          <Text>View Event</Text>
                        </Flex>
                      </Link>
                    </TableCell>
                      </TableRow>
                ))
              )}
                  </TableBody>
                </Table>
        )}
        
        {renderPagination()}
              </Card>

      {/* Alert Types Distribution */}
                <Card>
        <Title>Alert Types Distribution</Title>
                  <BarChart
          className="h-80 mt-6"
          data={alertsByType}
          index="name"
          categories={["value"]}
          colors={["red"]}
                    valueFormatter={(value) => `${value} alerts`}
          yAxisWidth={48}
          showLegend={false}
                  />
                </Card>
    </div>
  );
} 