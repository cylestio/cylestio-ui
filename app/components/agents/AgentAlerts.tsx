'use client';

import React, { useState, useEffect } from 'react';
import { Card, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Flex } from '@tremor/react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '../../lib/api';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';

// Interface to match the API response format shown in the screenshots
interface SecurityAlert {
  alert_id: string;
  timestamp: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  related_event_id?: string;
  policy_violation?: boolean;
}

interface AgentAlertsProps {
  agentId: string;
  timeRange?: string;
}

export function AgentAlerts({ agentId, timeRange = '7d' }: AgentAlertsProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        
        // Build the endpoint using the format shown in the screenshot
        const params = new URLSearchParams({
          time_range: timeRange,
          page: '1',
          page_size: '50'
        });
        
        // Use the exact endpoint format from the screenshot
        const endpoint = `/v1/agents/${agentId}/alerts?${params.toString()}`;
        
        try {
          const response = await fetchAPI<{ items: SecurityAlert[] }>(endpoint);
          
          if (!isMounted) return;
          
          // Determine which alerts are policy violations based on type
          const processedAlerts = (response.items || []).map(alert => ({
            ...alert,
            policy_violation: alert.type === 'sensitive_data' // Mark sensitive data as policy violations
          }));
          
          setAlerts(processedAlerts);
          setError(null);
        } catch (err) {
          console.error('Error fetching real alerts, using mock data', err);
          
          // Use mock data for development/demo purposes that matches the API format
          const mockAlerts: SecurityAlert[] = [
            {
              alert_id: "1946",
              timestamp: "2025-04-28T14:12:24.352793",
              type: "sensitive_data",
              severity: "medium",
              description: "Sensitive information like PII, credentials, and other confidential data",
              status: "OPEN",
              related_event_id: "1946",
              policy_violation: true
            },
            {
              alert_id: "1944",
              timestamp: "2025-04-28T14:12:22.803794",
              type: "sensitive_data",
              severity: "high",
              description: "Credit Card Number",
              status: "OPEN",
              related_event_id: "1944",
              policy_violation: true
            },
            {
              alert_id: "1935",
              timestamp: "2025-04-28T13:05:08.086334",
              type: "dangerous_commands",
              severity: "high",
              description: "Potential dangerous command execution detected",
              status: "OPEN",
              related_event_id: "1935",
              policy_violation: false
            },
            {
              alert_id: "1925",
              timestamp: "2025-04-28T12:45:18.086334",
              type: "prompt_injection",
              severity: "critical",
              description: "Potential prompt injection attempt",
              status: "OPEN",
              related_event_id: "1925",
              policy_violation: false
            },
            {
              alert_id: "1920",
              timestamp: "2025-04-28T11:32:08.086334",
              type: "hallucination",
              severity: "medium",
              description: "Potential hallucination in response",
              status: "OPEN",
              related_event_id: "1920",
              policy_violation: false
            }
          ];
          
          setAlerts(mockAlerts);
        }
      } catch (err: any) {
        console.error('Error in alert fetching process:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load security alerts');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchAlerts();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);
  
  if (loading) {
    return <LoadingState message="Loading security alerts..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Helper function to get badge color based on severity
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'low': return 'blue';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  // Navigation function
  const navigateToSecurityView = () => {
    const params = new URLSearchParams({
      agent_id: agentId,
      time_range: timeRange,
      tab: '1' // Tab index for Security Alerts
    });
    router.push(`/security?${params.toString()}`);
  };

  // Render empty state when no alerts
  if (alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-40 flex flex-col items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-200 mb-4">
            <path d="M24 4L4 36H44L24 4Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <Text className="text-center text-gray-500">No security alerts found for this agent in the selected time range.</Text>
          <Text className="text-center text-gray-400 text-sm mt-2">Alerts will appear here when security concerns are detected</Text>
          <button
            className="mt-4 text-blue-500 text-sm font-medium flex items-center"
            onClick={navigateToSecurityView}
          >
            View security center
          </button>
        </div>
      </Card>
    );
  }
  
  return (
    <div>
      <Card>
        <Flex className="justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security Alerts ({alerts.length})</h3>
          </div>
          <button
            className="text-blue-500 font-medium flex items-center text-sm"
            onClick={navigateToSecurityView}
          >
            View all in Security
            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
          </button>
        </Flex>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Severity</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.slice(0, 5).map((alert) => (
              <TableRow key={alert.alert_id}>
                <TableCell>
                  <Badge color={getSeverityColor(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {alert.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {alert.description}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 