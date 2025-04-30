'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '../../lib/api';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';
import ToolExecutionDetailPanel from './ToolExecutionDetailPanel';
import EnhancedBreadcrumbs from '../EnhancedBreadcrumbs';

// Types for the tool execution detail
type ToolExecutionDetail = {
  id: string;
  timestamp: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string;
  agent_id: string;
  agent_name: string;
  tool_name: string;
  tool_type: string;
  status: string;
  duration_ms: number;
  input: any;
  output: any;
  error: string | null;
  related_events: Array<{
    id: string;
    name: string;
    timestamp: string;
    level: string;
  }>;
};

type ToolExecutionDetailContainerProps = {
  executionId: string;
};

export default function ToolExecutionDetailContainer({ executionId }: ToolExecutionDetailContainerProps) {
  const [executionDetail, setExecutionDetail] = useState<ToolExecutionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchExecutionDetail = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchAPI(`/tools/executions/${executionId}`);
        setExecutionDetail(response as ToolExecutionDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tool execution details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExecutionDetail();
  }, [executionId]);
  
  // Navigation back to tools explorer
  const handleBackToExplorer = () => {
    router.push('/tools');
  };
  
  // Navigation to trace explorer
  const handleViewInTrace = () => {
    if (executionDetail?.trace_id) {
      router.push(`/traces/${executionDetail.trace_id}`);
    }
  };
  
  // Navigation to agent detail
  const handleViewAgent = () => {
    if (executionDetail?.agent_id) {
      router.push(`/agents/${executionDetail.agent_id}`);
    }
  };
  
  // Breadcrumb navigation
  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Tool Explorer', href: '/tools' },
    { label: `Tool Execution: ${executionId.substring(0, 8)}...`, href: '#' }
  ];
  
  if (isLoading) {
    return <LoadingState message="Loading tool execution details..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }
  
  if (!executionDetail) {
    return <ErrorMessage message="Tool execution not found" onRetry={handleBackToExplorer} />;
  }
  
  return (
    <div className="w-full space-y-6">
      <EnhancedBreadcrumbs items={breadcrumbs} />
      
      <ToolExecutionDetailPanel 
        execution={executionDetail}
        onBackToExplorer={handleBackToExplorer}
        onViewInTrace={handleViewInTrace}
        onViewAgent={handleViewAgent}
      />
    </div>
  );
} 