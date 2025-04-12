'use client';

import { EventsExplorerContainer } from '../../../components/events/EventsExplorerContainer';

export default function SessionEventsPage({ params }: { params: { sessionId: string } }) {
  return <EventsExplorerContainer sessionId={params.sessionId} />;
} 