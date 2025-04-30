'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingState from '../../../components/LoadingState';

interface AgentToolsPageProps {
  params: {
    id: string;
  };
}

export default function AgentToolsPage({ params }: AgentToolsPageProps) {
  const agentId = params.id;
  const router = useRouter();
  
  // Redirect to the main tools page with agent filter
  useEffect(() => {
    router.replace(`/tools?agent=${agentId}`);
  }, [agentId, router]);

  return <LoadingState message="Redirecting to tools page..." />;
} 