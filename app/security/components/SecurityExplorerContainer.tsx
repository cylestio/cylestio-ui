'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Grid,
  Card,
  Badge,
  Flex,
} from '@tremor/react';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import EnhancedBreadcrumbs from '../../components/EnhancedBreadcrumbs';
import SecurityDashboard from './SecurityDashboard';
import SecurityAlertsTable from './SecurityAlertsTable';
import SecurityFilterBar from './SecurityFilterBar';
import { buildQueryParams } from '../../lib/api';

interface SecurityExplorerContainerProps {
  searchParams: URLSearchParams;
}

export default function SecurityExplorerContainer({ searchParams }: SecurityExplorerContainerProps) {
  const router = useRouter();
  // Initialize the activeTab based on URL parameter 'tab', or default to 0 (Dashboard)
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === null) {
      return 0;
    }
    const tabIndex = parseInt(tabParam, 10);
    return isNaN(tabIndex) || tabIndex < 0 || tabIndex > 2 ? 0 : tabIndex;
  });
  
  const [filters, setFilters] = useState({
    severity: searchParams.get('severity') || '',
    category: searchParams.get('category') || '',
    alert_level: searchParams.get('alert_level') || '',
    llm_vendor: searchParams.get('llm_vendor') || '',
    search: searchParams.get('search') || '',
    time_range: searchParams.get('time_range') || '7d',
    page: parseInt(searchParams.get('page') || '1'),
    tab: searchParams.get('tab') || '0',
  });

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryParams(filters);
    const newPath = queryString ? `/security${queryString}` : '/security';
    router.replace(newPath, { scroll: false });
  }, [filters, router]);
  
  // Handle tab changes
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setFilters({
      ...filters,
      tab: index.toString(),
    });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1, // Reset to page 1 when filters change
    });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters({
      ...filters,
      page: newPage,
    });
  };

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Security', href: '/security', active: true },
  ];

  return (
    <div>
      <EnhancedBreadcrumbs items={breadcrumbItems} />
      
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <div>
          <Flex alignItems="center" className="gap-2">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
            <Title>Security Explorer</Title>
          </Flex>
          <Text className="mt-1">Monitor, investigate, and respond to security-related issues across your LLM applications</Text>
        </div>
        
        <div>
          <Badge size="xl" color="red">Beta</Badge>
        </div>
      </Flex>
      
      <SecurityFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <TabGroup className="mt-6" index={activeTab} onIndexChange={handleTabChange}>
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Security Alerts</Tab>
          <Tab>Policy Violations</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <SecurityDashboard 
              timeRange={filters.time_range} 
              filters={filters} 
            />
          </TabPanel>
          
          <TabPanel>
            <Card className="mt-6">
              <SecurityAlertsTable 
                filters={{
                  ...filters,
                  // Filter out sensitive_data alerts from the Alerts tab
                  category_exclude: 'sensitive_data'
                }}
                onPageChange={handlePageChange} 
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Grid numItemsMd={1} className="mt-6 gap-6">
              <Card>
                <SecurityAlertsTable 
                  filters={{
                    ...filters,
                    // Only show sensitive_data alerts in the Policies tab
                    category: 'sensitive_data'
                  }}
                  onPageChange={handlePageChange}
                />
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 