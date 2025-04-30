'use client';

import {
  Text,
  Flex,
  Card,
  Metric,
} from '@tremor/react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import MetricsDisplay from '../MetricsDisplay';
import { SPACING } from '../spacing';

type MetricVariant = 'primary' | 'error' | 'success' | 'secondary' | 'warning' | 'neutral';

type EventsHeaderProps = {
  totalEvents: number;
  errorCount: number;
  timeRange: string;
  onTimeRangeChange: (timeRange: string) => void;
};

const MetricCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <Card className="mx-auto">
    <Flex justifyContent="start" alignItems="center" className="space-x-4">
      <div className="rounded-full bg-blue-100 p-3">
        {icon}
      </div>
      <div>
        <Text>{title}</Text>
        <Metric>{value}</Metric>
      </div>
    </Flex>
  </Card>
);

export function EventsHeader({
  totalEvents,
  errorCount,
  timeRange,
  onTimeRangeChange,
}: EventsHeaderProps) {
  const metrics = [
    {
      title: 'Total Events',
      value: totalEvents.toLocaleString(),
      icon: <ClockIcon className="h-6 w-6 text-blue-600" />,
      variant: 'primary' as MetricVariant,
    },
    {
      title: 'Error Events',
      value: errorCount.toLocaleString(),
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />,
      variant: 'error' as MetricVariant,
    },
    {
      title: 'Success Rate',
      value: totalEvents > 0
        ? `${Math.round(((totalEvents - errorCount) / totalEvents) * 100)}%`
        : 'N/A',
      icon: <ClockIcon className="h-6 w-6 text-green-600" />,
      variant: 'success' as MetricVariant,
    }
  ];

  return (
    <MetricsDisplay
      metrics={metrics}
      columns={{ default: 1, sm: 3 }}
      metricCardComponent={MetricCard}
    />
  );
}