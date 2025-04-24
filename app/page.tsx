'use client'

import { Suspense, useState } from 'react';
import OverviewDashboard from './components/OverviewDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import PageTemplate from './components/PageTemplate';
import RefreshButton from './components/RefreshButton';

export default function Home() {
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardKey, setDashboardKey] = useState(0);

  const handleRefresh = () => {
    // Force refresh the dashboard by changing its key
    setDashboardKey(prev => prev + 1);
  };

  const breadcrumbs = [
    { label: 'Dashboard', current: true }
  ];

  return (
    <PageTemplate
      title="Dashboard"
      description="Overview of system performance, LLM usage, and key metrics at a glance"
      breadcrumbs={breadcrumbs}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      contentSpacing="default"
      headerContent={<RefreshButton onClick={handleRefresh} />}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <OverviewDashboard key={dashboardKey} timeRange={timeRange} />
      </Suspense>
    </PageTemplate>
  );
} 