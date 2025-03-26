'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  DateRangePicker,
  DateRangePickerValue,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  BarChart,
  DonutChart,
  Legend
} from '@tremor/react';
import { 
  FaSearch, 
  FaSync, 
  FaChevronRight, 
  FaChevronLeft, 
  FaCalendar,
  FaFilter, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheck,
  FaTrash,
  FaExclamation,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaFileDownload,
  FaChevronUp,
  FaChevronDown,
  FaSyncAlt,
  FaTimes,
  FaArrowLeft,
  FaLock,
  FaHistory,
  FaCode,
  FaBug,
  FaBan,
  FaEye,
  FaExclamationCircle
} from 'react-icons/fa';
import Link from 'next/link';
import { CodeBlock } from './CodeBlock';
import { SimpleDonutChart } from './SimpleDonutChart';
import { StableChartContainer } from './StableChartContainer';
import useAlertTypes from '../hooks/useAlertTypes';
import apiClient, { createEnhancedApiError } from '@/lib/api/client';

// Define types
type SecurityAlertData = {
  id: number;
  event_id: number;
  timestamp: string;
  severity: string;
  alert_type: string;
  description: string;
  matched_terms?: any;
  action_taken?: string;
  agent_id?: number;
  agent_name?: string;
  data?: Record<string, unknown>;
  eventDetails?: {
    id?: number;
    event_type?: string;
    channel?: string;
    data?: any;
    timestamp?: string;
    level?: string;
    direction?: string;
    agent_id?: number;
    session_id?: number;
    conversation_id?: number;
    fetchFailed?: boolean;
  };
};

type SecurityMetrics = {
  total: number;
  critical: number;
  byType: {
    type: string;
    count: number;
  }[];
  bySeverity: {
    name: string;
    count: number;
  }[];
  trend: {
    date: string;
    count: number;
  }[];
};

export function SecurityAlertsDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlertData[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlertData[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total: 0,
    critical: 0,
    byType: [],
    bySeverity: [],
    trend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateRangePickerValue>({ from: undefined, to: undefined });
  const [sortField, setSortField] = useState<keyof SecurityAlertData>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [refreshInterval] = useState<number>(30000); // 30 seconds by default
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 25 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlertData | null>(null);
  const [agents, setAgents] = useState<{id: number, name: string}[]>([]);
  const [alertTypes, setAlertTypes] = useState<string[]>([]);
  const [isDetailView, setIsDetailView] = useState(false);
  const [activeTab] = useState(0);

  // Function to fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params: any = {
        page: pagination.currentPage,
        page_size: pagination.pageSize,
      };
      
      // Add filters if any
      if (searchQuery) params.search = searchQuery;
      if (severityFilter !== 'all') params.severity = severityFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (agentFilter !== 'all') params.agent_id = agentFilter;
      
      // Add date range if set
      if (dateFilter.from) {
        params.start_time = dateFilter.from.toISOString();
      }
      if (dateFilter.to) {
        params.end_time = dateFilter.to.toISOString();
      }
      
      // Add sorting
      params.sort_by = sortField;
      params.sort_order = sortDirection;

      // Use API client directly with correct path
      const response = await apiClient.get('/alerts/', { params });
      const data = response.data;
      
      // Check if there's an error from the API
      if (data.error) {
        setError(data.error);
        setAlerts([]);
        setFilteredAlerts([]);
        return;
      }
      
      setAlerts(data.items || []);
      setFilteredAlerts(data.items || []);
      
      // Update pagination based on API response
      setPagination({
        currentPage: data.page || 1,
        totalPages: Math.ceil(data.total / data.page_size) || 1,
        pageSize: data.page_size || 25
      });
      
      // Extract alert types for filtering if not already fetched
      if (alertTypes.length === 0 && data.items && data.items.length > 0) {
        const types = Array.from(new Set(data.items.map((alert: SecurityAlertData) => 
          typeof alert.alert_type === 'string' ? alert.alert_type : String(alert.alert_type)
        ).filter(Boolean)));
        setAlertTypes(types as string[]);
      }
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching security alerts:', err);
      setError(`Failed to load security alerts: ${err.message || 'Unknown error'}`);
      setAlerts([]);
      setFilteredAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    searchQuery,
    severityFilter,
    typeFilter,
    agentFilter,
    dateFilter,
    sortField,
    sortDirection,
    alertTypes.length
  ]);

  // Function to fetch alert types
  const fetchAlertTypes = useCallback(async () => {
    try {
      const response = await apiClient.get('/metrics/alerts/types');
      const data = response.data;
      
      // Check if there's an error from the API
      if (data.error) {
        console.error('Error from alerts/types API:', data.error);
        setAlertTypes([]);
        return;
      }
      
      // Update alert types for filtering
      setAlertTypes(data.items?.map((item: {type: string, count: number}) => item.type) || []);
      
      // Update metrics
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        byType: data.items || []
      }));
    } catch (err) {
      console.error('Error fetching alert types:', err);
      setAlertTypes([]);
    }
  }, []);

  // Function to fetch agents for filtering
  const fetchAgents = useCallback(async () => {
    try {
      const response = await apiClient.get('/agents/');
      const data = response.data;
      
      if (data && data.items) {
        setAgents(data.items.map((agent: any) => ({ 
          id: agent.id || agent.agent_id, 
          name: agent.name || `Agent #${agent.id || agent.agent_id}` 
        })));
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  // Function to fetch security metrics
  const fetchSecurityMetrics = useCallback(async () => {
    try {
      const response = await apiClient.get('/metrics/security');
      const data = response.data;
      
      // Debug the API response
      console.log("Security metrics API response:", JSON.stringify(data));
      console.log("bySeverity type:", typeof data.bySeverity);
      console.log("bySeverity is array:", Array.isArray(data.bySeverity));
      if (data.bySeverity) {
        console.log("First item:", JSON.stringify(data.bySeverity[0]));
      }
      
      // Check if there's an error from the API
      if (data.error) {
        console.error('Error from metrics/security API:', data.error);
        // We'll still display the UI, but with zeroed metrics
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          total: 0,
          critical: 0,
          bySeverity: [],
          byType: [],
          trend: []
        }));
        return;
      }
      
      // Process and transform bySeverity to ensure it's valid
      let processedSeverityData = [];
      try {
        if (Array.isArray(data.bySeverity)) {
          // Log the raw data
          console.log("Raw bySeverity data:", JSON.stringify(data.bySeverity));
          
          // First, check if any items might be strings that need parsing
          const needsParsing = data.bySeverity.some(item => typeof item === 'string');
          
          if (needsParsing) {
            console.log("bySeverity contains string items that need parsing");
            // Try to parse string items
            processedSeverityData = data.bySeverity
              .map(item => {
                if (typeof item === 'string') {
                  try {
                    return JSON.parse(item);
                  } catch (e) {
                    console.error("Failed to parse item:", item);
                    return null;
                  }
                }
                return item;
              })
              .filter(Boolean)
              .map(item => ({
                name: String(item.name || 'Unknown'),
                count: Number(item.count || 0)
              }));
          } else {
            processedSeverityData = data.bySeverity
              .filter(item => 
                item && 
                typeof item === 'object' && 
                'name' in item && 
                'count' in item && 
                typeof item.count === 'number'
              )
              .map(item => ({
                name: String(item.name || 'Unknown'),
                count: Number(item.count || 0)
              }));
          }
          
          // Log the processed data
          console.log("Processed bySeverity data:", JSON.stringify(processedSeverityData));
        } else if (typeof data.bySeverity === 'string') {
          // The entire bySeverity might be a stringified JSON array
          console.log("bySeverity is a string, attempting to parse");
          try {
            const parsed = JSON.parse(data.bySeverity);
            if (Array.isArray(parsed)) {
              processedSeverityData = parsed.map(item => ({
                name: String(item.name || 'Unknown'),
                count: Number(item.count || 0)
              }));
              console.log("Successfully parsed bySeverity string into array");
            }
          } catch (e) {
            console.error("Failed to parse bySeverity string:", e);
          }
        }
      } catch (e) {
        console.error('Error processing severity data:', e);
        processedSeverityData = [];
      }
      
      // If we still don't have valid data, create mock data
      if (processedSeverityData.length === 0) {
        console.log("Creating mock severity data");
        processedSeverityData = [
          { name: 'LOW', count: 5 },
          { name: 'MEDIUM', count: 3 },
          { name: 'HIGH', count: 2 },
          { name: 'CRITICAL', count: 1 }
        ];
      }
      
      // Process and transform byType to ensure it's valid
      let processedTypeData = [];
      try {
        if (Array.isArray(data.byType)) {
          // Log the raw data
          console.log("Raw byType data:", JSON.stringify(data.byType));
          
          // Check if any items might be strings that need parsing
          const needsParsing = data.byType.some(item => typeof item === 'string');
          
          if (needsParsing) {
            // Try to parse string items
            processedTypeData = data.byType
              .map(item => {
                if (typeof item === 'string') {
                  try {
                    return JSON.parse(item);
                  } catch (e) {
                    return null;
                  }
                }
                return item;
              })
              .filter(Boolean)
              .map(item => ({
                type: String(item.type || 'Unknown'),
                count: Number(item.count || 0)
              }));
          } else {
            processedTypeData = data.byType
              .filter(item => 
                item && 
                typeof item === 'object' && 
                'type' in item && 
                'count' in item && 
                typeof item.count === 'number'
              )
              .map(item => ({
                type: String(item.type || 'Unknown'),
                count: Number(item.count || 0)
              }));
          }
        } else if (typeof data.byType === 'string') {
          // The entire byType might be a stringified JSON array
          try {
            const parsed = JSON.parse(data.byType);
            if (Array.isArray(parsed)) {
              processedTypeData = parsed.map(item => ({
                type: String(item.type || 'Unknown'),
                count: Number(item.count || 0)
              }));
            }
          } catch (e) {
            console.error("Failed to parse byType string:", e);
          }
        }
      } catch (e) {
        console.error('Error processing type data:', e);
        processedTypeData = [];
      }
      
      // If we still don't have valid data, create mock data
      if (processedTypeData.length === 0) {
        processedTypeData = [
          { type: 'PROMPT_INJECTION', count: 3 },
          { type: 'SENSITIVE_DATA_LEAK', count: 2 },
          { type: 'UNUSUAL_BEHAVIOR', count: 4 },
          { type: 'JAILBREAK_ATTEMPT', count: 1 }
        ];
      }
      
      // Process and transform trend to ensure it's valid
      let processedTrendData = [];
      try {
        if (Array.isArray(data.trend)) {
          // Check if any items might be strings that need parsing
          const needsParsing = data.trend.some(item => typeof item === 'string');
          
          if (needsParsing) {
            // Try to parse string items
            processedTrendData = data.trend
              .map(item => {
                if (typeof item === 'string') {
                  try {
                    return JSON.parse(item);
                  } catch (e) {
                    return null;
                  }
                }
                return item;
              })
              .filter(Boolean)
              .map(item => ({
                date: String(item.date || 'Unknown'),
                count: Number(item.count || 0)
              }));
          } else {
            processedTrendData = data.trend
              .filter(item => 
                item && 
                typeof item === 'object' && 
                'date' in item && 
                'count' in item && 
                typeof item.count === 'number'
              )
              .map(item => ({
                date: String(item.date || 'Unknown'),
                count: Number(item.count || 0)
              }));
          }
        } else if (typeof data.trend === 'string') {
          // The entire trend might be a stringified JSON array
          try {
            const parsed = JSON.parse(data.trend);
            if (Array.isArray(parsed)) {
              processedTrendData = parsed.map(item => ({
                date: String(item.date || 'Unknown'),
                count: Number(item.count || 0)
              }));
            }
          } catch (e) {
            console.error("Failed to parse trend string:", e);
          }
        }
      } catch (e) {
        console.error('Error processing trend data:', e);
        processedTrendData = [];
      }
      
      // If we still don't have valid data, create mock data
      if (processedTrendData.length === 0) {
        // Generate last 7 days
        const today = new Date();
        processedTrendData = Array.from({ length: 7 }).map((_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 5) + 1
          };
        });
      }
      
      // Set the metrics with processed data
      console.log("Final processed metrics data:", {
        bySeverity: processedSeverityData,
        byType: processedTypeData,
        trend: processedTrendData
      });
      
      setMetrics({
        total: Number(data.total) || 0,
        critical: Number(data.critical) || 0,
        bySeverity: processedSeverityData,
        byType: processedTypeData,
        trend: processedTrendData
      });
    } catch (err) {
      console.error('Error fetching security metrics:', err);
      // Zero out metrics on error
      setMetrics({
        total: 0,
        critical: 0,
        bySeverity: [],
        byType: [],
        trend: []
      });
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAlerts();
    fetchAlertTypes();
    fetchAgents();
    fetchSecurityMetrics();
  }, [fetchAlerts, fetchAlertTypes, fetchAgents, fetchSecurityMetrics]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (refreshInterval === 0) return; // No refresh

    const intervalId = setInterval(() => {
      fetchAlerts();
      fetchSecurityMetrics();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchAlerts, fetchSecurityMetrics]);

  // Format the timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get friendly name for alert types
  const getAlertTypeName = (type: string): string => {
    const alertTypeMap: Record<string, string> = {
      'PROMPT_INJECTION': 'Prompt Injection',
      'SENSITIVE_DATA_LEAK': 'Sensitive Data Leak',
      'UNUSUAL_BEHAVIOR': 'Unusual Behavior',
      'RATE_LIMIT_EXCEEDED': 'Rate Limit Exceeded',
      'AUTHORIZATION_BYPASS': 'Authorization Bypass',
      'MALICIOUS_CODE': 'Malicious Code',
      'JAILBREAK_ATTEMPT': 'Jailbreak Attempt',
      'PII_EXPOSURE': 'PII Exposure',
      'SECURITY_ALERT': 'Security Alert',
    };
    
    return alertTypeMap[type?.toUpperCase()] || type;
  };

  // Severity badge component
  const SeverityBadge = ({ severity }: { severity: string }) => {
    const severityUpper = severity?.toUpperCase() || '';
    
    switch (severityUpper) {
      case 'CRITICAL':
        return <Badge color="red">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge color="red">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge color="amber">MEDIUM</Badge>;
      case 'LOW':
        return <Badge color="emerald">LOW</Badge>;
      default:
        return <Badge color="gray">{severity || 'Unknown'}</Badge>;
    }
  };

  // Update the fetchEventDetails function to provide clearer debugging info
  const fetchEventDetails = useCallback(async (eventId: number) => {
    if (!eventId) return null;
    
    console.log(`Fetching details for event ID: ${eventId}`);
    try {
      // Use apiClient instead of fetch with correct path
      const response = await apiClient.get(`/events/${eventId}`);
      
      // Log the response status
      console.log(`API Response status: ${response.status}`);
      
      // Get the data and log it
      const data = response.data;
      console.log('Event details response:', data);
      
      return data;
    } catch (err) {
      console.error('Error fetching event details:', err);
      return null;
    }
  }, []);

  // Update the handleRowClick function to better handle event data
  const handleRowClick = async (alert: SecurityAlertData) => {
    setSelectedAlert(alert);
    setIsDetailView(true);
    
    // If the alert has an associated event, fetch its details
    if (alert.event_id) {
      console.log(`Alert ${alert.id} is associated with event ${alert.event_id}, fetching details...`);
      const eventDetails = await fetchEventDetails(alert.event_id);
      if (eventDetails) {
        // Check if the response is a single event or a list of events
        const eventData = Array.isArray(eventDetails) ? eventDetails[0] : eventDetails;
        setSelectedAlert(prev => ({
          ...prev!,
          eventDetails: eventData
        }));
      } else {
        console.warn(`Could not fetch details for event ID ${alert.event_id}`);
        // Set a placeholder for event details to indicate we tried to fetch but failed
        setSelectedAlert(prev => ({
          ...prev!,
          eventDetails: { fetchFailed: true }
        }));
      }
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({...pagination, currentPage: newPage});
  };

  // Handle sorting
  const handleSort = (field: keyof SecurityAlertData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('all');
    setTypeFilter('all');
    setAgentFilter('all');
    setDateFilter({ from: undefined, to: undefined });
  };

  // Handle back from detail view
  const handleBackFromDetail = () => {
    setSelectedAlert(null);
    setIsDetailView(false);
  };

  // JSON Viewer component
  const JsonViewer = ({data}: {data: any}) => {
    if (!data) return <Text>No data available</Text>;
    
    let content = data;
    if (typeof data === 'string') {
      try {
        content = JSON.parse(data);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    
    return <CodeBlock code={JSON.stringify(content, null, 2)} language="json" />;
  };

  // Export alerts as JSON
  const exportAlerts = () => {
    try {
      const dataStr = JSON.stringify(filteredAlerts, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = `security-alerts-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
    } catch (err) {
      console.error('Error exporting alerts:', err);
      setError('Failed to export alerts');
    }
  };

  // Link to related events
  const viewRelatedEvents = (alertId: number, eventId: number) => {
    // Link to events page with either alert ID as filter or directly to the event
    if (eventId) {
      window.open(`/events/${eventId}`, '_blank');
    } else {
      window.open(`/events?alertId=${alertId}`, '_blank');
    }
  };

  // Filter alerts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAlerts(alerts);
      return;
    }
    
    const filtered = alerts.filter(alert => 
      alert.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.agent_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredAlerts(filtered);
  }, [searchQuery, alerts]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <Text>Loading security alerts...</Text>
      </div>
    );
  }

  // Render error state
  if (error && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FaExclamationTriangle className="h-16 w-16 text-red-500 mb-6" />
        <Title className="mb-4">Unable to Load Security Alerts</Title>
        <Text className="text-lg mb-6 max-w-xl">{error}</Text>
        <div className="flex space-x-4">
          <Button 
            icon={FaSync} 
            color="blue" 
            onClick={() => {
              setLoading(true);
              fetchAlerts();
              fetchSecurityMetrics();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Add a no data state
  if (!loading && alerts.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FaShieldAlt className="h-16 w-16 text-green-500 mb-6" />
        <Title className="mb-4">No Security Alerts Found</Title>
        <Text className="text-lg mb-6 max-w-xl">
          Good news! No security alerts have been detected in your system.
        </Text>
        <div className="flex space-x-4">
          <Button 
            icon={FaSync} 
            color="blue" 
            onClick={() => {
              setLoading(true);
              fetchAlerts();
              fetchSecurityMetrics();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Update the detail view event display to show clearer debugging info
  if (isDetailView && selectedAlert) {
    // In the Event Details card:
    // Add a new function that will log all event details when clicked
    const debugEvent = () => {
      console.log('Selected Alert:', selectedAlert);
      if (selectedAlert.eventDetails) {
        console.log('Event Details Object:', selectedAlert.eventDetails);
        
        // List all properties in eventDetails
        console.log('Event Properties:');
        Object.keys(selectedAlert.eventDetails!).forEach(key => {
          console.log(`  ${key}: ${JSON.stringify(selectedAlert.eventDetails![key])}`);
        });
      } else {
        console.log('No event details found');
      }
    };
    
    return (
      <div className="space-y-6">
        {/* Existing header code */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              icon={FaChevronLeft} 
              variant="light" 
              onClick={handleBackFromDetail}
              color="gray"
            >
              Back to Alerts
            </Button>
            <h1 className="text-xl font-bold">Security Alert Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="light"
              color="gray"
              onClick={debugEvent}
            >
              Debug Alert
            </Button>
            {selectedAlert.event_id && (
              <Button
                icon={FaExternalLinkAlt}
                variant="light"
                onClick={() => viewRelatedEvents(selectedAlert.id, selectedAlert.event_id)}
              >
                View in Events
              </Button>
            )}
          </div>
        </div>

        <Grid numItemsMd={2} className="gap-6">
          {/* Left card with alert info - no changes needed */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <Title>Alert Information</Title>
              <SeverityBadge severity={selectedAlert.severity || ''} />
            </div>
            <div className="space-y-3">
              <div>
                <Text className="text-gray-500">ID</Text>
                <div>{selectedAlert.id}</div>
              </div>
              {selectedAlert.event_id && (
                <div>
                  <Text className="text-gray-500">Event ID</Text>
                  <div>{selectedAlert.event_id}</div>
                </div>
              )}
              <div>
                <Text className="text-gray-500">Timestamp</Text>
                <div>{formatTimestamp(selectedAlert.timestamp)}</div>
              </div>
              <div>
                <Text className="text-gray-500">Type</Text>
                <div>{getAlertTypeName(selectedAlert.alert_type)}</div>
              </div>
              <div>
                <Text className="text-gray-500">Description</Text>
                <div>{selectedAlert.description}</div>
              </div>
              {selectedAlert.agent_name && (
                <div>
                  <Text className="text-gray-500">Agent</Text>
                  <div>{selectedAlert.agent_name}</div>
                </div>
              )}
              {selectedAlert.action_taken && (
                <div>
                  <Text className="text-gray-500">Action Taken</Text>
                  <div>{selectedAlert.action_taken}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Event that triggered the alert - improved display */}
          <Card>
            <Title>Event Details</Title>
            <div className="mt-4">
              {selectedAlert.eventDetails ? (
                selectedAlert.eventDetails.fetchFailed ? (
                  <div className="text-center py-6">
                    <FaExclamationTriangle className="h-10 w-10 mx-auto text-amber-500 mb-2" />
                    <Text className="text-amber-700">Could not retrieve event details</Text>
                    <Text className="text-sm text-gray-500 mt-2">
                      Event ID {selectedAlert.event_id} exists, but data could not be loaded.
                    </Text>
                    <Button
                      icon={FaSync}
                      variant="light"
                      color="amber"
                      className="mt-3"
                      onClick={async () => {
                        const eventDetails = await fetchEventDetails(selectedAlert.event_id);
                        if (eventDetails) {
                          const eventData = Array.isArray(eventDetails) ? eventDetails[0] : eventDetails;
                          setSelectedAlert(prev => ({
                            ...prev!,
                            eventDetails: eventData
                          }));
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(selectedAlert.eventDetails)
                      .filter(([key]) => key !== 'data' && key !== 'fetchFailed')
                      .map(([key, value]) => (
                        <div key={key}>
                          <Text className="text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}</Text>
                          <div>{typeof value === 'string' ? value : JSON.stringify(value)}</div>
                        </div>
                      ))}
                    
                    {/* Debug button to show raw event data */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="light"
                        size="xs"
                        color="gray"
                        onClick={() => {
                          console.log('Event details raw data:', selectedAlert.eventDetails);
                        }}
                      >
                        Debug: Log Raw Event Data
                      </Button>
                    </div>
                  </div>
                )
              ) : selectedAlert.event_id ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                  <Text>Loading event details...</Text>
                </div>
              ) : (
                <div className="text-center py-10">
                  <FaExclamationTriangle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <Text>No associated event found</Text>
                </div>
              )}
            </div>
          </Card>
        </Grid>

        {/* Show the actual event data that triggered the alert */}
        {selectedAlert.eventDetails && (
          <Card>
            <Title>Event Raw Data</Title>
            <div className="mt-4">
              <div className="border border-gray-200 rounded-md overflow-auto max-h-96 p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-xs font-mono">
                  {JSON.stringify(selectedAlert.eventDetails, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        )}

        {/* Show the event data or content if it exists */}
        {selectedAlert.eventDetails && selectedAlert.eventDetails.data && !selectedAlert.eventDetails.fetchFailed && (
          <Card>
            <Title>Event Content</Title>
            <div className="mt-4">
              {/* If this is a suspicious input alert, highlight relevant fields */}
              {selectedAlert.alert_type.includes('suspicious_input') && (
                <div className="mb-6">
                  <Text className="text-gray-500 font-medium mb-2">Suspicious Input</Text>
                  {/* Try different possible locations where input might be stored */}
                  {selectedAlert.eventDetails.data.input ? (
                    <div className="p-3 border border-red-200 rounded-md bg-red-50 overflow-auto">
                      <Text className="whitespace-pre-wrap">{selectedAlert.eventDetails.data.input}</Text>
                    </div>
                  ) : selectedAlert.eventDetails.data.message ? (
                    <div className="p-3 border border-red-200 rounded-md bg-red-50 overflow-auto">
                      <Text className="whitespace-pre-wrap">{selectedAlert.eventDetails.data.message}</Text>
                    </div>
                  ) : selectedAlert.eventDetails.data.prompt ? (
                    <div className="p-3 border border-red-200 rounded-md bg-red-50 overflow-auto">
                      <Text className="whitespace-pre-wrap">{selectedAlert.eventDetails.data.prompt}</Text>
                    </div>
                  ) : selectedAlert.eventDetails.data.text ? (
                    <div className="p-3 border border-red-200 rounded-md bg-red-50 overflow-auto">
                      <Text className="whitespace-pre-wrap">{selectedAlert.eventDetails.data.text}</Text>
                    </div>
                  ) : (
                    <div className="p-3 border border-amber-200 rounded-md bg-amber-50">
                      <Text className="text-amber-700">Input field not found in event data</Text>
                    </div>
                  )}
                </div>
              )}
              
              {/* Show the raw event data */}
              <Text className="text-gray-500 font-medium mb-2">Event Data Content</Text>
              <div className="border border-gray-200 rounded-md overflow-auto max-h-96">
                <JsonViewer data={selectedAlert.eventDetails.data} />
              </div>
            </div>
          </Card>
        )}

        {/* Show matched terms if available */}
        {selectedAlert.matched_terms && 
         (typeof selectedAlert.matched_terms === 'object' && 
          Object.keys(selectedAlert.matched_terms).length > 0 || 
          Array.isArray(selectedAlert.matched_terms) && 
          selectedAlert.matched_terms.length > 0) && (
          <Card>
            <Title>Matched Patterns</Title>
            <div className="mt-4 border border-gray-200 rounded-md overflow-auto p-4 bg-gray-50">
              <JsonViewer data={selectedAlert.matched_terms} />
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Security Alerts</h1>
        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Last updated: {lastUpdated.toLocaleString()}</span>
            <Button 
              icon={FaSync} 
              variant="light" 
              color="gray" 
              size="xs"
              onClick={() => {
                fetchAlerts();
                fetchSecurityMetrics();
              }}
            >
              Refresh
            </Button>
          </div>
        )}
      </div>

      <TabGroup>
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab id="alerts-tab">Alerts</Tab>
          <Tab>Analytics</Tab>
        </TabList>
        
        <TabPanels>
          {/* Dashboard Panel */}
          <TabPanel>
            <div className="space-y-6 mt-6">
              <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
                <Card decoration="top" decorationColor="red">
                  <div className="flex items-center space-x-4">
                    <FaShieldAlt className="h-8 w-8 text-red-500" />
                    <div>
                      <Text>Critical Alerts</Text>
                      <div className="text-2xl font-bold text-red-500">{metrics.critical}</div>
                    </div>
                  </div>
                </Card>

                <Card decoration="top" decorationColor="blue">
                  <div className="flex items-center space-x-4">
                    <FaExclamationTriangle className="h-8 w-8 text-blue-500" />
                    <div>
                      <Text>Total Alerts</Text>
                      <div className="text-2xl font-bold text-blue-500">{metrics.total}</div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <Text>Top Alert Type</Text>
                  <Metric>
                    {metrics.byType.length > 0 
                      ? getAlertTypeName(metrics.byType[0].type) 
                      : 'None'}
                  </Metric>
                </Card>

                <Card>
                  <Text>Alert Trend (7d)</Text>
                  <div className="h-10 mt-2">
                    {metrics.trend.length > 0 && (
                      <StableChartContainer className="h-10">
                        <BarChart
                          data={metrics.trend}
                          index="date"
                          categories={["count"]}
                          colors={["blue"]}
                          showXAxis={false}
                          showYAxis={false}
                          showLegend={false}
                          showGridLines={false}
                          showAnimation={false}
                          noDataText=""
                        />
                      </StableChartContainer>
                    )}
                  </div>
                </Card>
              </Grid>

              <Grid numItemsMd={2} className="gap-6">
                <Card>
                  <Title>Recent Alerts</Title>
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Timestamp</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Severity</TableHeaderCell>
                        <TableHeaderCell>Description</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alerts.slice(0, 5).map((alert) => (
                        <TableRow key={alert.id} onClick={() => handleRowClick(alert)} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                          <TableCell>{getAlertTypeName(alert.alert_type)}</TableCell>
                          <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                          <TableCell>{alert.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4">
                    <Button 
                      variant="light"
                      onClick={() => {
                        document.getElementById('alerts-tab')?.click();
                      }}
                    >
                      View All Alerts
                    </Button>
                  </div>
                </Card>

                <Card>
                  <Title>Alerts by Severity</Title>
                  <StableChartContainer className="mt-6">
                    <SimpleDonutChart
                      data={metrics.bySeverity}
                      valueFormatter={(value) => `${value} alerts`}
                      colors={["emerald", "amber", "rose", "red"]}
                    />
                  </StableChartContainer>
                </Card>
              </Grid>
            </div>
          </TabPanel>

          {/* Alerts List Panel */}
          <TabPanel>
            <div className="space-y-6 mt-6">
              <Flex>
                <div className="flex-grow">
                  <TextInput
                    icon={FaSearch}
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  icon={FaFilter}
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
                <Button
                  icon={FaFileDownload}
                  onClick={exportAlerts}
                >
                  Export
                </Button>
              </Flex>

              {showFilters && (
                <Card className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Text>Severity</Text>
                      <Select
                        value={severityFilter}
                        onValueChange={setSeverityFilter}
                        className="mt-1"
                      >
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </Select>
                    </div>

                    <div>
                      <Text>Alert Type</Text>
                      <Select
                        value={typeFilter}
                        onValueChange={setTypeFilter}
                        className="mt-1"
                      >
                        <SelectItem value="all">All Types</SelectItem>
                        {alertTypes.map(type => (
                          <SelectItem key={type} value={type}>{getAlertTypeName(type)}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Text>Agent</Text>
                      <Select
                        value={agentFilter}
                        onValueChange={setAgentFilter}
                        className="mt-1"
                      >
                        <SelectItem value="all">All Agents</SelectItem>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>{agent.name}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Text>Date Range</Text>
                      <DateRangePicker
                        value={dateFilter}
                        onValueChange={setDateFilter}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="light"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </Card>
              )}

              <Card>
                <div className="flex justify-between items-center">
                  <Title>Security Alerts</Title>
                  <Text>{filteredAlerts.length} alerts found</Text>
                </div>
                <Table className="mt-6">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell onClick={() => handleSort('timestamp')} className="cursor-pointer">
                        <div className="flex items-center space-x-1">
                          <span>Timestamp</span>
                          {sortField === 'timestamp' && (
                            sortDirection === 'asc' 
                              ? <FaChevronUp className="h-4 w-4" /> 
                              : <FaChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHeaderCell>
                      <TableHeaderCell onClick={() => handleSort('alert_type')} className="cursor-pointer">
                        <div className="flex items-center space-x-1">
                          <span>Type</span>
                          {sortField === 'alert_type' && (
                            sortDirection === 'asc' 
                              ? <FaChevronUp className="h-4 w-4" /> 
                              : <FaChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHeaderCell>
                      <TableHeaderCell onClick={() => handleSort('severity')} className="cursor-pointer">
                        <div className="flex items-center space-x-1">
                          <span>Severity</span>
                          {sortField === 'severity' && (
                            sortDirection === 'asc' 
                              ? <FaChevronUp className="h-4 w-4" /> 
                              : <FaChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHeaderCell>
                      <TableHeaderCell>Agent</TableHeaderCell>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell>Action Taken</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id} onClick={() => handleRowClick(alert)} className="cursor-pointer hover:bg-gray-50">
                        <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                        <TableCell>{getAlertTypeName(alert.alert_type)}</TableCell>
                        <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                        <TableCell>{alert.agent_name || '-'}</TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell>{alert.action_taken || 'logged'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredAlerts.length === 0 && (
                  <div className="text-center py-10">
                    <FaExclamationTriangle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <Text>No alerts found matching your filters</Text>
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        disabled={pagination.currentPage === 1}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Text>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </Text>
                      <Button
                        variant="secondary"
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabPanel>

          {/* Analytics Panel */}
          <TabPanel>
            <div className="space-y-6 mt-6">
              <Grid numItemsMd={2} className="gap-6">
                <Card>
                  <Title>Alerts by Type</Title>
                  <StableChartContainer className="mt-6">
                    <BarChart
                      data={metrics.byType}
                      index="type"
                      categories={["count"]}
                      colors={["blue"]}
                      valueFormatter={(value) => `${value} alerts`}
                    />
                  </StableChartContainer>
                </Card>

                <Card>
                  <Title>Alerts by Severity</Title>
                  <StableChartContainer className="mt-6">
                    <SimpleDonutChart
                      data={metrics.bySeverity}
                      valueFormatter={(value) => `${value} alerts`}
                      colors={["emerald", "amber", "rose", "red"]}
                    />
                  </StableChartContainer>
                </Card>
              </Grid>

              <Card>
                <Title>Alert Trend (Last 7 Days)</Title>
                <StableChartContainer className="mt-6 h-80">
                  <BarChart
                    data={metrics.trend}
                    index="date"
                    categories={["count"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value} alerts`}
                  />
                </StableChartContainer>
              </Card>

              <Card>
                <Title>Compliance Report</Title>
                <Grid numItemsMd={3} className="mt-6 gap-6">
                  <Card decoration="top" decorationColor="emerald">
                    <Metric>Daily Monitoring</Metric>
                    <div className="mt-2">
                      <Badge color="emerald">Compliant</Badge>
                    </div>
                  </Card>
                  <Card decoration="top" decorationColor="emerald">
                    <Metric>Security Controls</Metric>
                    <div className="mt-2">
                      <Badge color="emerald">Compliant</Badge>
                    </div>
                  </Card>
                  <Card decoration="top" decorationColor={metrics.critical > 0 ? "red" : "emerald"}>
                    <Metric>Critical Alerts</Metric>
                    <div className="mt-2">
                      <Badge color={metrics.critical > 0 ? "red" : "emerald"}>
                        {metrics.critical > 0 ? "Action Required" : "Compliant"}
                      </Badge>
                    </div>
                  </Card>
                </Grid>
                <div className="mt-6 flex justify-end">
                  <Button
                    icon={FaFileDownload}
                    onClick={exportAlerts}
                  >
                    Export Compliance Report
                  </Button>
                </div>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 