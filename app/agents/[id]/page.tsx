import { AgentDetail } from '@/components/AgentDetail';

// This page will display detailed information about a specific agent
export default function AgentDetailPage({ params }: { params: { id: string } }) {
  return <AgentDetail agentId={params.id} />;
} 