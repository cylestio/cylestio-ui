'use client';

import PageTemplate from '../components/PageTemplate';
import { EnhancedBreadcrumbItem } from '../components/EnhancedBreadcrumbs';
import { useUser } from '@descope/react-sdk';
import { AccessKeyManagement } from '@descope/nextjs-sdk';

export default function Settings() {
  const { user } = useUser();

  const tenantId = user?.userTenants[0]?.tenantId;

  const breadcrumbs: EnhancedBreadcrumbItem[] = [
    { label: 'Settings', href: '/settings' }
  ];

  return (
    <PageTemplate
      title="Settings"
      description="Manage your application settings and preferences"
      breadcrumbs={breadcrumbs}
      timeRange="24h"
      onTimeRangeChange={() => { }}
      showTimeRangeFilter={false}
    >
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Manage Access Keys</h1>
        <p className="text-gray-600">Manage your access keys for your application</p>
        <div className="h-px bg-gray-200 my-4"></div>
        <AccessKeyManagement
          widgetId="access-key-management-widget"
          tenant={tenantId}
        />
      </div>
    </PageTemplate>
  );
} 