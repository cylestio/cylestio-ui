'use client'

import { Suspense, useState } from 'react';
import OverviewDashboard from './components/OverviewDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import Breadcrumbs from './components/Breadcrumbs';
import { Text, Select, SelectItem, Button } from '@tremor/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardKey, setDashboardKey] = useState(0);

  const handleRefresh = () => {
    // Force refresh the dashboard by changing its key
    setDashboardKey(prev => prev + 1);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Dashboard', current: true }
          ]}
          includeHome={false}
        />
        <div className="flex items-center gap-2">
          <Text>Time Range:</Text>
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
            className="w-32 sm:w-40"
          >
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </Select>
          <Button
            variant="light"
            icon={ArrowPathIcon}
            tooltip="Refresh data"
            onClick={handleRefresh}
            size="xs"
          >
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <OverviewDashboard key={dashboardKey} timeRange={timeRange} />
      </Suspense>
    </div>
  );
} 