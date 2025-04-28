'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Text, Button, Flex } from '@tremor/react';

import { fetchAPI, buildQueryParams } from '../../lib/api';
import { TELEMETRY } from '../../lib/api-endpoints';
import PageTemplate from '../PageTemplate';
import ContentSection from '../ContentSection';
import RefreshButton from '../RefreshButton';
import { EventsTable } from './EventsTable';

// Types based on the API specification
type Event = {
  id: string;
  schema_version: string;
  timestamp: string;
  trace_id: string;
  span_id?: string;
  parent_span_id?: string;
  name: string;
  level: string;
  agent_id: string;
  attributes: Record<string, any>;
};

export function EventsExplorerContainer({ 
  sessionId, 
  traceId 
}: { 
  sessionId?: string;
  traceId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for events data
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Simplified state - keep only time range for page header
  const [timeRange, setTimeRange] = useState('30d');
  
  // State for pagination
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a reference to track if manual fetch was triggered
  const manualFetchTriggered = useRef(false);
  
  // Add refresh key state
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Function to fetch events data - simplified to only support session filtering
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: Record<string, any> = {
        limit,
        offset
      };
      
      // Set time range for context but not for filtering
      const currentTime = new Date();
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Default to 30 days
      
      params.from_time = startDate.toISOString();
      params.to_time = currentTime.toISOString();
      
      // Handle specific contexts
      let endpoint = TELEMETRY.EVENTS;
      
      if (sessionId) {
        endpoint = `/v1/telemetry/sessions/${sessionId}/events`;
      } else if (traceId) {
        endpoint = `/v1/telemetry/traces/${traceId}`;
      }
      
      // Fetch events
      const eventsData = await fetchAPI<Event[]>(`${endpoint}${buildQueryParams(params)}`);
      
      setEvents(eventsData || []);
      setTotalEvents(eventsData?.length || 0);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching events data:', err);
      setError('Failed to load events data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle time range changes for page header only
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
  };
  
  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };
  
  // View event details
  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };
  
  // Add refresh handler after fetchEvents function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    manualFetchTriggered.current = true;
    fetchEvents();
  };
  
  // Fetch data on initial render and when pagination changes
  useEffect(() => {
    // Skip fetch if it was manually triggered
    if (manualFetchTriggered.current) {
      manualFetchTriggered.current = false;
      return;
    }
    
    fetchEvents();
  }, [offset, limit, sessionId, traceId]);
  
  const breadcrumbs = [
    { label: 'Events', href: '/events', current: true },
  ];
  
  return (
    <PageTemplate
      title="Events Explorer"
      description="View, filter, and analyze events from across the system"
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={handleTimeRangeChange}
      headerContent={<RefreshButton onClick={handleRefresh} />}
      contentSpacing="default"
    >
      {sessionId && (
        <ContentSection spacing="default">
          <Card className="mb-4 bg-blue-50 border border-blue-200">
            <Flex justifyContent="between" alignItems="center">
              <Text className="font-medium">Filtered by Session ID: {sessionId}</Text>
              <Button 
                variant="light"
                size="xs"
                onClick={() => router.push('/events')}
              >
                Clear Filter
              </Button>
            </Flex>
          </Card>
        </ContentSection>
      )}
      
      {!sessionId && (
        <ContentSection spacing="default">
          <Card className="p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem('sessionId') as HTMLInputElement;
              const sessionId = input.value;
              if (sessionId) {
                router.push(`/events/session/${sessionId}`);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Text className="font-medium mb-2">Filter by Session ID</Text>
                  <Text className="text-sm text-gray-500 mb-4">
                    Enter a session ID to view its events
                  </Text>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="sessionId"
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Enter Session ID"
                  />
                  <Button type="submit">View Session</Button>
                </div>
              </div>
            </form>
          </Card>
        </ContentSection>
      )}
      
      {/* Events table */}
      <ContentSection spacing="default">
        <EventsTable 
          events={events}
          loading={loading}
          error={error}
          limit={limit}
          offset={offset}
          totalEvents={totalEvents}
          onPageChange={handlePageChange}
          onViewEvent={handleViewEvent}
        />
      </ContentSection>
    </PageTemplate>
  );
} 