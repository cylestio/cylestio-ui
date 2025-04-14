'use client';

import { useSearchParams } from 'next/navigation';
import ToolExplorerContainer from '../components/tools/ToolExplorerContainer';

export default function ToolExplorerPage() {
  const searchParams = useSearchParams();
  
  return (
    <div className="w-full">
      <ToolExplorerContainer searchParams={searchParams} />
    </div>
  );
} 