'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  TextInput,
  Select,
  SelectItem,
  Button,
  Flex,
  Grid,
} from '@tremor/react';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { fetchAPI } from '../../lib/api';

type EventsFilterBarProps = {
  timeRange: string;
  eventType: string;
  agentId: string;
  level: string;
  searchQuery: string;
  onFilterChange: (
    timeRange?: string,
    eventType?: string,
    agentId?: string,
    level?: string,
    searchQuery?: string
  ) => void;
};

export function EventsFilterBar({
  timeRange,
  eventType,
  agentId,
  level,
  searchQuery,
  onFilterChange,
}: EventsFilterBarProps) {
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [loading, setLoading] = useState(false);

  // Fetch available agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await fetchAPI<{ agents: { id: string; name: string }[] }>(
          '/v1/agents'
        );
        if (response && response.agents) {
          setAgents(response.agents);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(undefined, undefined, undefined, undefined, localSearchQuery);
  };

  // Reset all filters
  const handleResetFilters = () => {
    onFilterChange('1d', 'all', 'all', 'all', '');
    setLocalSearchQuery('');
  };

  return (
    <Card>
      <form onSubmit={handleSearchSubmit}>
        <Grid numItemsMd={5} numItemsLg={5} className="gap-4">
          <div>
            <Select
              value={timeRange}
              onValueChange={(value) => onFilterChange(value)}
              placeholder="Time Range"
            >
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </Select>
          </div>

          <div>
            <Select
              value={eventType}
              onValueChange={(value) => onFilterChange(undefined, value)}
              placeholder="Event Type"
            >
              <SelectItem value="all">All Event Types</SelectItem>
              <SelectItem value="llm.request">LLM Request</SelectItem>
              <SelectItem value="llm.response">LLM Response</SelectItem>
              <SelectItem value="tool.call">Tool Call</SelectItem>
              <SelectItem value="tool.result">Tool Result</SelectItem>
              <SelectItem value="security">Security Events</SelectItem>
              <SelectItem value="framework">Framework Events</SelectItem>
            </Select>
          </div>

          <div>
            <Select
              value={agentId}
              onValueChange={(value) => onFilterChange(undefined, undefined, value)}
              placeholder="Agent"
            >
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Select
              value={level}
              onValueChange={(value) => onFilterChange(undefined, undefined, undefined, value)}
              placeholder="Level"
            >
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
              <SelectItem value="SECURITY_ALERT">SECURITY ALERT</SelectItem>
            </Select>
          </div>

          <div>
            <Flex className="gap-2">
              <TextInput
                value={localSearchQuery}
                onChange={handleSearchChange}
                placeholder="Search events..."
                icon={MagnifyingGlassIcon}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                icon={ArrowPathIcon}
                onClick={handleResetFilters}
                tooltip="Reset filters"
              />
            </Flex>
          </div>
        </Grid>
      </form>
    </Card>
  );
} 