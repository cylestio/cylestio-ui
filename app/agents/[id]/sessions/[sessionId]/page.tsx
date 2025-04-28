'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingState from '@/components/LoadingState';

interface SessionDetailsPageProps {
  params: {
    id: string;
    sessionId: string;
  };
}

export default function SessionDetailsPage({ params }: SessionDetailsPageProps) {
  const { sessionId } = params;
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the events page filtered by session ID
    router.push(`/events/session/${sessionId}`);
  }, [sessionId, router]);

  // Show loading while redirecting
  return <LoadingState message="Redirecting to events..." />;
} 