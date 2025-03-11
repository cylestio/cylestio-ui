import { Suspense } from 'react';
import DashboardMetrics from './components/DashboardMetrics';
import DashboardCharts from './components/DashboardCharts';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardMetrics />
      </Suspense>
      
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardCharts />
      </Suspense>
    </div>
  );
} 