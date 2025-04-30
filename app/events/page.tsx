'use client';

import { EventsExplorerContainer } from '../components/events/EventsExplorerContainer';
import { useSearchParams } from 'next/navigation';

export default function Events() {
  const searchParams = useSearchParams();
  
  // Get event IDs from different parameters
  const eventIds = searchParams.get('event_ids')?.split(',') || [];
  const idsParam = searchParams.get('ids')?.split(',') || [];
  const toolIds = searchParams.get('tool_ids')?.split(',') || [];
  
  // Determine which IDs to use based on parameters
  const idsToDisplay = toolIds.length > 0 ? toolIds : [...eventIds, ...idsParam];
  
  // Whether these are tool-related events
  const isToolRelated = toolIds.length > 0;
  
  return <EventsExplorerContainer 
    eventIds={idsToDisplay.filter(id => id.trim() !== '')} 
    isToolRelated={isToolRelated}
  />;
} 