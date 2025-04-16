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
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    severity: searchParams.get('severity') || '',
    category: searchParams.get('category') || '',
    alert_level: searchParams.get('alert_level') || '',
    llm_vendor: searchParams.get('llm_vendor') || '',
    search: searchParams.get('search') || '',
    time_range: searchParams.get('time_range') || '7d',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryParams(filters);
    const newPath = queryString ? `/security${queryString}` : '/security';
    router.replace(newPath, { scroll: false });
  }, [filters, router]);

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
      
      <TabGroup className="mt-6" onIndexChange={setActiveTab}>
        <TabList>
          <Tab>Dashboard</Tab>
          <Tab>Alerts</Tab>
          <Tab>Policies</Tab>
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
                filters={filters} 
                onPageChange={handlePageChange} 
              />
            </Card>
          </TabPanel>
          
          <TabPanel>
            <Grid numItemsMd={1} className="mt-6 gap-6">
              <Card>
                <div className="h-72 flex items-center justify-center">
                  <Text>Policy management coming soon</Text>
                </div>
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 