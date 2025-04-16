'use client';

import ToolExecutionDetailContainer from '../../../components/tools/ToolExecutionDetailContainer';

export default function ToolExecutionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full">
      <ToolExecutionDetailContainer executionId={params.id} />
    </div>
  );
} 