import React, { useState, useEffect } from 'react';
import { Card, Text, Metric, Grid, Flex, Badge, Button } from '@tremor/react';
import { RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { createEnhancedApiError } from '@/lib/api/client';
import { ErrorDisplay } from '@/components/ui/error-display';

interface DashboardData {
  metrics: {
    total_agents: number;
    active_agents: number;
    total_events: number;
    security_alerts: number;
  };
  recent_events: any[];
  recent_alerts: any[];
  agent_status: {
    active: number;
    inactive: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try /dashboard endpoint
      try {
        const response = await apiClient.get('/dashboard');
        setData(response.data);
        setLastUpdated(new Date());
        return;
      } catch (err) {
        console.log('Failed to fetch from /dashboard endpoint, trying alternative endpoints...');
      }
      
      // If that fails, try to construct dashboard data from multiple endpoints
      try {
        // Get agent counts
        const agentsResponse = await apiClient.get('/agents/count');
        const agentCount = agentsResponse.data;
        
        // Get events count
        const eventsResponse = await apiClient.get('/events/', { params: { page_size: 1 } });
        const eventsCount = eventsResponse.data.total || 0;
        
        // Get alerts count
        const alertsResponse = await apiClient.get('/alerts/', { params: { page_size: 1 } });
        const alertsCount = alertsResponse.data.total || 0;
        
        // Construct dashboard data
        const dashboardData: DashboardData = {
          metrics: {
            total_agents: agentCount.total || 0,
            active_agents: agentCount.active || 0,
            total_events: eventsCount,
            security_alerts: alertsCount
          },
          recent_events: [],
          recent_alerts: [],
          agent_status: {
            active: agentCount.active || 0,
            inactive: agentCount.inactive || 0
          }
        };
        
        // Get recent events
        const recentEventsResponse = await apiClient.get('/events/', { params: { page: 1, page_size: 5 } });
        dashboardData.recent_events = recentEventsResponse.data.items || [];
        
        // Get recent alerts
        const recentAlertsResponse = await apiClient.get('/alerts/', { params: { page: 1, page_size: 5 } });
        dashboardData.recent_alerts = recentAlertsResponse.data.items || [];
        
        setData(dashboardData);
        setLastUpdated(new Date());
      } catch (err) {
        throw err; // Throw to be caught by the outer catch
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(createEnhancedApiError(err));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  if (loading && !data) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <div className="animate-pulse">
          <Grid numItemsMd={2} numItemsLg={4} className="gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-28"></Card>
            ))}
          </Grid>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <Button 
            variant="secondary" 
            size="xs" 
            icon={RefreshCw} 
            onClick={fetchDashboardData}
          >
            Retry
          </Button>
        </div>
        <ErrorDisplay 
          error={error} 
          title="Error Loading Dashboard"
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <Text className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleString()}
            </Text>
          )}
          <Button 
            variant="secondary" 
            size="xs" 
            icon={RefreshCw} 
            onClick={fetchDashboardData}
            disabled={loading}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <Grid numItemsMd={2} numItemsLg={4} className="gap-4 mb-4">
        <Card className="p-4">
          <Text>Total Agents</Text>
          <Metric>{data?.metrics.total_agents || 0}</Metric>
        </Card>
        <Card className="p-4">
          <Text>Active Agents</Text>
          <Metric>{data?.metrics.active_agents || 0}</Metric>
        </Card>
        <Card className="p-4">
          <Text>Total Events</Text>
          <Metric>{data?.metrics.total_events || 0}</Metric>
        </Card>
        <Card className="p-4">
          <Text>Security Alerts</Text>
          <Metric>{data?.metrics.security_alerts || 0}</Metric>
        </Card>
      </Grid>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3">Agent Status</h3>
          <div className="flex gap-3">
            <div className="flex-1 p-3 bg-green-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <Text>Active</Text>
              </div>
              <Metric className="mt-1">{data?.agent_status.active || 0}</Metric>
            </div>
            <div className="flex-1 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <Text>Inactive</Text>
              </div>
              <Metric className="mt-1">{data?.agent_status.inactive || 0}</Metric>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-3">Recent Alerts</h3>
          {data?.recent_alerts && data.recent_alerts.length > 0 ? (
            <div className="space-y-2">
              {data.recent_alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center">
                    <div 
                      className={`w-2 h-2 rounded-full mr-2 ${
                        alert.severity === 'critical' ? 'bg-red-600' :
                        alert.severity === 'high' ? 'bg-red-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                    ></div>
                    <Text className="text-sm">{alert.description}</Text>
                  </div>
                  <Badge 
                    size="xs"
                    color={
                      alert.severity === 'critical' ? 'red' :
                      alert.severity === 'high' ? 'rose' :
                      alert.severity === 'medium' ? 'yellow' : 'blue'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Text>No recent alerts</Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 