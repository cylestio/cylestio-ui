import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues with client data fetching
const AgentDetailContainer = dynamic(
  () => import('../../components/agents/AgentDetailContainer').then(mod => ({ default: mod.AgentDetailContainer })),
  { ssr: false }
);

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <AgentDetailContainer agentId={params.id} />
    </div>
  );
} 