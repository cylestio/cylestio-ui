'use client';

import { EventDetailContainer } from '../../components/events/EventDetailContainer';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <EventDetailContainer eventId={params.id} />
    </div>
  );
} 