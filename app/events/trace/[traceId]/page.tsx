'use client';

import { EventsExplorerContainer } from '../../../components/events/EventsExplorerContainer';

export default function TraceEventsPage({ params }: { params: { traceId: string } }) {
  return <EventsExplorerContainer traceId={params.traceId} />;
} 