'use client';

import { useSearchParams } from 'next/navigation';
import { EventDetailContainer } from '../../components/events/EventDetailContainer';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const fromSecurity = searchParams.get('from') === 'security';
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <EventDetailContainer eventId={params.id} fromSecurity={fromSecurity} />
    </div>
  );
} 