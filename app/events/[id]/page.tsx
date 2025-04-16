'use client';

import { EventDetailContainer } from '../../components/events/EventDetailContainer';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return <EventDetailContainer eventId={params.id} />;
} 