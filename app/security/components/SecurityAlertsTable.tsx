'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Badge,
  Button,
  Flex,
  Title,
} from '@tremor/react';
import {
  EyeIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { fetchAPI } from '../../lib/api';
import { SECURITY } from '../../lib/api-endpoints';
import { formatISOToLocalDisplay } from '../../lib/dateUtils';
import LoadingState from '../../components/LoadingState';

interface SecurityAlertsTableProps {
  filters: Record<string, any>;
  onPageChange: (page: number) => void;
}

type Alert = {
  id: string;
  timestamp: string;
  severity: string;
  category: string;
  alert_level: string;
  description: string;
  llm_vendor: string;
  content_sample: string;
  detection_time: string;
  keywords: string[];
  event_id: number;
  agent_id: string;
  schema_version: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_name: string;
  log_level: string;
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total: number;
  pages: number;
};

type AlertsResponse = {
  alerts: Alert[];
  pagination: PaginationInfo;
  total_count: number;
  metrics: {
    total_count: number;
    by_severity: Record<string, number>;
    by_category: Record<string, number>;
    by_alert_level: Record<string, number>;
    by_llm_vendor: Record<string, number>;
  };
  time_range: {
    from: string;
    to: string;
    description: string;
  };
  filters: Record<string, any>;
};

export default function SecurityAlertsTable({ filters, onPageChange }: SecurityAlertsTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 10,
    total: 0,
    pages: 0,
  });
  
  // Get appropriate color for severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'rose';
      case 'high': return 'orange';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };
  
  // Get appropriate color for alert level
  const getAlertLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'rose';
      case 'dangerous': return 'orange';
      case 'suspicious': return 'amber';
      case 'none': return 'gray';
      default: return 'gray';
    }
  };
  
  // Format category for display
  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true);
        
        // Build query params
        const params = new URLSearchParams();
        
        if (filters.severity) {
          params.append('severity', filters.severity);
        }
        
        if (filters.category) {
          params.append('category', filters.category);
        }
        
        if (filters.category_exclude) {
          params.append('category_exclude', filters.category_exclude);
        }
        
        if (filters.alert_level) {
          params.append('alert_level', filters.alert_level);
        }
        
        if (filters.llm_vendor) {
          params.append('llm_vendor', filters.llm_vendor);
        }
        
        if (filters.search) {
          params.append('search', filters.search);
        }
        
        if (filters.time_range) {
          params.append('time_range', filters.time_range);
        }
        
        if (filters.agent_id) {
          params.append('agent_id', filters.agent_id);
        }
        
        if (filters.page) {
          params.append('page', filters.page.toString());
        }
        
        // Fetch alerts data
        const data = await fetchAPI<AlertsResponse>(`${SECURITY.ALERTS}?${params.toString()}`);
        
        if (data && data.alerts && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
          setPagination(data.pagination);
        } else {
          console.error('Invalid alerts data format:', data);
          setAlerts([]);
          setPagination({
            page: 1,
            page_size: 10,
            total: 0,
            pages: 0,
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching security alerts:', err);
        setError('Failed to load security alerts. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAlerts();
  }, [filters]);
  
  if (loading) {
    return <LoadingState message="Loading security alerts..." />;
  }
  
  if (error) {
    return <Text color="rose">{error}</Text>;
  }
  
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldExclamationIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <Title>No alerts found</Title>
        <Text className="mt-2">
          No security alerts match your current filters. Try adjusting your filters or time range.
        </Text>
      </div>
    );
  }
  
  return (
    <div>
      <Table className="border border-gray-200 rounded-lg overflow-hidden w-full table-fixed">
        <TableHead className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHeaderCell className="font-semibold text-gray-700 w-[10%]">Severity</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[15%]">Category</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[12%]">Alert Level</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[30%]">Description</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[12%]">LLM Vendor</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[12%]">Time</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-gray-700 w-[9%]">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
          {alerts.map((alert) => (
            <TableRow 
              key={alert.id} 
              className="border-b border-gray-100 transition-colors hover:bg-blue-50/30 cursor-pointer"
              onClick={() => window.location.href = `/events/${alert.event_id}?from=security`}
            >
              <TableCell>
                <Badge color={getSeverityColor(alert.severity)} size="sm">
                  {alert.severity}
                </Badge>
              </TableCell>
              
              <TableCell>
                <Text className="font-medium">{formatCategory(alert.category)}</Text>
              </TableCell>
              
              <TableCell>
                <Badge color={getAlertLevelColor(alert.alert_level)} size="sm">
                  {alert.alert_level}
                </Badge>
              </TableCell>
              
              <TableCell className="max-w-xs">
                <div className="truncate">
                  <Text className="font-medium text-gray-900">
                    {alert.description.substring(0, 60) + (alert.description.length > 60 ? '...' : '')}
                  </Text>
                  {alert.keywords && alert.keywords.length > 0 && (
                    <Text className="text-xs text-gray-500 mt-1 truncate">
                      Keywords: {alert.keywords.slice(0, 3).join(', ')}
                      {alert.keywords.length > 3 ? ` +${alert.keywords.length - 3} more` : ''}
                    </Text>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Text>{alert.llm_vendor}</Text>
              </TableCell>
              
              <TableCell>
                <Flex justifyContent="start" alignItems="center" className="gap-1">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <Text>{formatISOToLocalDisplay(alert.timestamp)}</Text>
                </Flex>
              </TableCell>
              
              <TableCell>
                <Link href={`/events/${alert.event_id}?from=security`}>
                  <Button 
                    variant="light" 
                    size="xs" 
                    icon={EyeIcon}
                    tooltip="View Event Details"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {pagination.pages > 1 && (
        <Flex justifyContent="between" className="mt-6">
          <Text>
            Showing {alerts.length} of {pagination.total} alerts
          </Text>
          <Flex className="gap-2">
            <Button
              size="xs"
              icon={ChevronLeftIcon}
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="border border-gray-200"
            >
              Previous
            </Button>
            <Button
              size="xs"
              icon={ChevronRightIcon}
              iconPosition="right"
              disabled={pagination.page === pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="border border-gray-200"
            >
              Next
            </Button>
          </Flex>
        </Flex>
      )}
    </div>
  );
} 