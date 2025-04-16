'use client';

import { useSearchParams } from 'next/navigation';
import SecurityExplorerContainer from './components/SecurityExplorerContainer';

export default function SecurityExplorerPage() {
  const searchParams = useSearchParams();
  
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <SecurityExplorerContainer searchParams={searchParams} />
    </div>
  );
} 