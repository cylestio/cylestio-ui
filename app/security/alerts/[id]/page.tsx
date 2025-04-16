'use client';

import { notFound } from 'next/navigation';
import SecurityAlertDetailContainer from '../../components/SecurityAlertDetailContainer';

export default function SecurityAlertDetailPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <SecurityAlertDetailContainer alertId={params.id} />
    </div>
  );
} 