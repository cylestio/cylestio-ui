'use client';

import {
  Title,
  Text,
  Grid,
  Flex,
  Select,
  SelectItem,
  Card,
  Metric,
} from '@tremor/react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type EventsHeaderProps = {
  totalEvents: number;
  errorCount: number;
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
};

export function EventsHeader({
  totalEvents,
  errorCount,
  timeRange,
  onTimeRangeChange,
}: EventsHeaderProps) {
  return (
    <div className="space-y-4">
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>Events Explorer</Title>
          <Text>View, filter, and analyze events from across the system</Text>
        </div>
        <Flex justifyContent="end" alignItems="center" className="gap-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <Select
            value={timeRange}
            onValueChange={onTimeRangeChange}
            className="w-36"
          >
            <SelectItem value="1h">Last 1 hour</SelectItem>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </Select>
        </Flex>
      </Flex>

      <Grid numItemsLg={3} className="gap-6">
        <Card className="mx-auto">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-blue-100 p-3">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <Text>Total Events</Text>
              <Metric>{totalEvents.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>

        <Card className="mx-auto">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-red-100 p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <Text>Error Events</Text>
              <Metric>{errorCount.toLocaleString()}</Metric>
            </div>
          </Flex>
        </Card>

        <Card className="mx-auto">
          <Flex justifyContent="start" alignItems="center" className="space-x-4">
            <div className="rounded-full bg-green-100 p-3">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <Text>Success Rate</Text>
              <Metric>
                {totalEvents > 0
                  ? `${Math.round(((totalEvents - errorCount) / totalEvents) * 100)}%`
                  : 'N/A'}
              </Metric>
            </div>
          </Flex>
        </Card>
      </Grid>
    </div>
  );
} 