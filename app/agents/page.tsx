import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to avoid hydration issues
const AgentsExplorerContainer = dynamic(
  () => import('../components/agents/AgentsExplorerContainer').then(mod => ({ default: mod.AgentsExplorerContainer })),
  { ssr: false }
);

export default function AgentsExplorerPage() {
  return <AgentsExplorerContainer />;
} 