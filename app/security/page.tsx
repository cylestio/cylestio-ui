'use client';

import { useSearchParams } from 'next/navigation';
import SecurityExplorerContainer from './components/SecurityExplorerContainer';

export default function SecurityExplorerPage() {
  const searchParams = useSearchParams();
  
  return <SecurityExplorerContainer searchParams={searchParams} />;
} 