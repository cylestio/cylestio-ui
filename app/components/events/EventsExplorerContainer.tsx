'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { EventsHeader } from './EventsHeader';
import { EventsFilterBar } from './EventsFilterBar';
import { EventsTimeline } from './EventsTimeline';
import { EventsTable } from './EventsTable';
import { fetchAPI, buildQueryParams } from '../../lib/api';
import { TELEMETRY } from '../../lib/api-endpoints';

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

type TimelineInterval = {
  timestamp: string;
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
};

type TimelineResponse = {
  intervals: TimelineInterval[];
  meta: {
    timestamp: string;
    time_period: string;
    interval: string;
    filters_applied: Record<string, any>;
  };
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
  const [timelineData, setTimelineData] = useState<TimelineInterval[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  // State for filters
  const [timeRange, setTimeRange] = useState(searchParams.get('time_range') || '1d');
  const [eventType, setEventType] = useState(searchParams.get('event_type') || 'all');
  const [agentId, setAgentId] = useState(searchParams.get('agent_id') || 'all');
  const [level, setLevel] = useState(searchParams.get('level') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  // State for pagination
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a reference to track if manual fetch was triggered
  const manualFetchTriggered = useRef(false);
  
  // Function to fetch events data
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: Record<string, any> = {
        limit,
        offset
      };
      
      // Set time range
      const currentTime = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1);
      }
      
      params.from_time = startDate.toISOString();
      params.to_time = currentTime.toISOString();
      
      // Add filters
      if (eventType !== 'all') params.event_name = eventType;
      if (agentId !== 'all') params.agent_id = agentId;
      if (level !== 'all') params.level = level;
      
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
      setErrorCount(eventsData?.filter(event => event.level.toLowerCase() === 'error' || event.level.toLowerCase() === 'critical').length || 0);
      
      // Fetch timeline data
      const timelineParams: Record<string, any> = {
        time_range: timeRange,
        interval: getInterval(timeRange)
      };
      
      if (eventType !== 'all') timelineParams.event_type = eventType;
      if (agentId !== 'all') timelineParams.agent_id = agentId;
      
      const timelineResponse = await fetchAPI<TimelineResponse>(`${TELEMETRY.EVENTS}-timeline${buildQueryParams(timelineParams)}`);
      
      if (timelineResponse) {
        setTimelineData(timelineResponse.intervals);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching events data:', err);
      setError('Failed to load events data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get appropriate interval based on time range
  const getInterval = (range: string): string => {
    switch (range) {
      case '1h': return '5m';
      case '1d': return '1h';
      case '7d': return '6h';
      case '30d': return '1d';
      default: return '1h';
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (
    newTimeRange?: string,
    newEventType?: string,
    newAgentId?: string,
    newLevel?: string,
    newSearchQuery?: string
  ) => {
    // Update state
    if (newTimeRange) setTimeRange(newTimeRange);
    if (newEventType) setEventType(newEventType);
    if (newAgentId) setAgentId(newAgentId);
    if (newLevel) setLevel(newLevel);
    if (newSearchQuery !== undefined) setSearchQuery(newSearchQuery);
    
    // Reset pagination
    setOffset(0);
    
    // Update URL query parameters
    const params = new URLSearchParams(window.location.search);
    if (newTimeRange) params.set('time_range', newTimeRange);
    if (newEventType && newEventType !== 'all') params.set('event_type', newEventType);
    else if (newEventType === 'all') params.delete('event_type');
    if (newAgentId && newAgentId !== 'all') params.set('agent_id', newAgentId);
    else if (newAgentId === 'all') params.delete('agent_id');
    if (newLevel && newLevel !== 'all') params.set('level', newLevel);
    else if (newLevel === 'all') params.delete('level');
    if (newSearchQuery) params.set('search', newSearchQuery);
    else if (newSearchQuery === '') params.delete('search');
    
    // Use router.replace to update URL without full page refresh
    const queryString = params.toString();
    router.replace(`/events${queryString ? '?' + queryString : ''}`, { scroll: false });
    
    // Mark that we're triggering a manual fetch
    manualFetchTriggered.current = true;
    fetchEvents();
  };
  
  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };
  
  // View event details
  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };
  
  // Fetch data on initial render and when filters change
  useEffect(() => {
    // Skip fetch if it was manually triggered in handleFilterChange
    if (manualFetchTriggered.current) {
      manualFetchTriggered.current = false;
      return;
    }
    
    fetchEvents();
  }, [timeRange, eventType, agentId, level, offset, limit, sessionId, traceId]);
  
  return (
    <div className="space-y-6">
      <EventsHeader 
        totalEvents={totalEvents} 
        errorCount={errorCount}
        timeRange={timeRange}
        onTimeRangeChange={(newTimeRange) => handleFilterChange(newTimeRange)}
      />
      
      <EventsFilterBar 
        timeRange={timeRange}
        eventType={eventType}
        agentId={agentId}
        level={level}
        searchQuery={searchQuery}
        onFilterChange={handleFilterChange}
      />
      
      <EventsTimeline 
        timelineData={timelineData}
        timeRange={timeRange}
        loading={loading}
      />
      
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
    </div>
  );
} 