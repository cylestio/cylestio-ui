'use client';

import { useSearchParams } from 'next/navigation';
import ToolExplorerContainer from '../components/tools/ToolExplorerContainer';

export default function ToolExplorerPage() {
  const searchParams = useSearchParams();
  
  return <ToolExplorerContainer searchParams={searchParams} />;
} 