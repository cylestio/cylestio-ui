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
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react';
import {
  EyeIcon,
  ShieldExclamationIcon,
  ClockIcon,
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
  llm_vendor: string;
  title: string;
  description: string;
  keywords: string[];
  agent_id: string;
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
  time_range: {
    from: string;
    to: string;
    description: string;
  };
  filters: Record<string, any>;
  metrics: {
    total_count: number;
    by_severity: Record<string, number>;
    by_category: Record<string, number>;
    by_alert_level: Record<string, number>;
    by_llm_vendor: Record<string, number>;
  };
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
        const params = {
          page: filters.page || 1,
          page_size: 10,
          time_range: filters.time_range || '7d',
        };
        
        if (filters.severity) {
          Object.assign(params, { severity: filters.severity });
        }
        
        if (filters.category) {
          Object.assign(params, { category: filters.category });
        }
        
        if (filters.alert_level) {
          Object.assign(params, { alert_level: filters.alert_level });
        }
        
        if (filters.llm_vendor) {
          Object.assign(params, { llm_vendor: filters.llm_vendor });
        }
        
        if (filters.search) {
          Object.assign(params, { pattern: filters.search });
        }
        
        if (filters.agent_id) {
          Object.assign(params, { agent_id: filters.agent_id });
        }
        
        // Convert params to query string
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
        
        const data = await fetchAPI<AlertsResponse>(`${SECURITY.ALERTS}?${queryParams.toString()}`);
        
        setAlerts(data.alerts);
        setPagination(data.pagination);
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
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Severity</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Alert Level</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>LLM Vendor</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} className="hover:bg-gray-50">
              <TableCell>
                <Badge color={getSeverityColor(alert.severity)} size="sm">
                  {alert.severity}
                </Badge>
              </TableCell>
              
              <TableCell>
                <Text>{formatCategory(alert.category)}</Text>
              </TableCell>
              
              <TableCell>
                <Badge color={getAlertLevelColor(alert.alert_level)} size="sm">
                  {alert.alert_level}
                </Badge>
              </TableCell>
              
              <TableCell>
                <Link href={`/security/alerts/${alert.id}`}>
                  <Text className="font-medium hover:text-blue-500 cursor-pointer">
                    {alert.title || alert.description.substring(0, 60) + (alert.description.length > 60 ? '...' : '')}
                  </Text>
                </Link>
                {alert.keywords && alert.keywords.length > 0 && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Keywords: {alert.keywords.slice(0, 3).join(', ')}
                    {alert.keywords.length > 3 ? ` +${alert.keywords.length - 3} more` : ''}
                  </Text>
                )}
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
                <Link href={`/security/alerts/${alert.id}`}>
                  <Button size="xs" variant="light" icon={EyeIcon}>
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <Flex justifyContent="end" className="mt-4">
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="light"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <Text>
              Page {pagination.page} of {pagination.pages}
            </Text>
            
            <Button
              size="xs"
              variant="light"
              onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </Flex>
      )}
    </div>
  );
} 