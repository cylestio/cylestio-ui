'use client';

import { useState, useEffect } from 'react';
import { AgentsDashboard } from './AgentsDashboard';
import { AgentService } from '../lib/api/services';

/**
 * This is a wrapper component for AgentsDashboard that uses the AgentService
 * instead of direct fetch API calls. This makes it easier to unit test
 * using the established test patterns.
 */
export function AgentsDashboardWrapper() {
  const [isLoading, setIsLoading] = useState(true);
  const [agentData, setAgentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Use the AgentService to fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await AgentService.getAll();
        setAgentData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to fetch agents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Display loading message while data is being fetched
  if (isLoading) {
    return <div className="p-6">Loading agents...</div>;
  }

  // Display error message if fetch failed
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  // Render the main dashboard with data
  return <AgentsDashboard initialData={agentData} />;
} 