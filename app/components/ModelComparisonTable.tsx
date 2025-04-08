'use client'

import React, { useState } from 'react'
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Card,
  Title,
  Text,
  Flex,
  Button,
  Select,
  SelectItem
} from '@tremor/react'
import { ArrowPathIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'

type ModelMetrics = {
  name: string;
  request_count: number;
  response_time_avg: number;
  response_time_p95: number;
  success_rate: number;
  error_rate: number;
  token_count_input: number;
  token_count_output: number;
  token_count_total: number;
  estimated_cost_usd: number;
  cost_per_1k_tokens: number;
  cost_per_request: number;
  token_efficiency: number; // output tokens / input tokens
};

type ModelComparisonTableProps = {
  models: ModelMetrics[];
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
};

export default function ModelComparisonTable({
  models,
  className = '',
  onRefresh,
  isLoading = false
}: ModelComparisonTableProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'request_count',
    'response_time_avg',
    'token_count_total',
    'estimated_cost_usd',
    'cost_per_1k_tokens'
  ]);

  const metrics = [
    { id: 'request_count', name: 'Total Requests' },
    { id: 'response_time_avg', name: 'Avg Response Time' },
    { id: 'response_time_p95', name: 'P95 Response Time' },
    { id: 'success_rate', name: 'Success Rate' },
    { id: 'token_count_input', name: 'Input Tokens' },
    { id: 'token_count_output', name: 'Output Tokens' },
    { id: 'token_count_total', name: 'Total Tokens' },
    { id: 'estimated_cost_usd', name: 'Total Cost' },
    { id: 'cost_per_1k_tokens', name: 'Cost per 1K Tokens' },
    { id: 'cost_per_request', name: 'Cost per Request' },
    { id: 'token_efficiency', name: 'Token Efficiency' },
  ];

  const formatValue = (key: string, value: number): string => {
    switch (key) {
      case 'request_count':
        return value.toLocaleString();
      case 'response_time_avg':
      case 'response_time_p95':
        return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(2)}s`;
      case 'success_rate':
      case 'error_rate':
        return `${(value * 100).toFixed(1)}%`;
      case 'token_count_input':
      case 'token_count_output':
      case 'token_count_total':
        return value.toLocaleString();
      case 'estimated_cost_usd':
        return `$${value.toFixed(2)}`;
      case 'cost_per_1k_tokens':
        return `$${value.toFixed(4)}`;
      case 'cost_per_request':
        return `$${value.toFixed(4)}`;
      case 'token_efficiency':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getStatusColor = (key: string, value: number): string => {
    switch (key) {
      case 'success_rate':
        return value > 0.95 ? 'green' : value > 0.9 ? 'yellow' : 'red';
      case 'error_rate':
        return value < 0.05 ? 'green' : value < 0.1 ? 'yellow' : 'red';
      case 'response_time_avg':
        return value < 500 ? 'green' : value < 2000 ? 'yellow' : 'red';
      case 'response_time_p95':
        return value < 1000 ? 'green' : value < 3000 ? 'yellow' : 'red';
      case 'token_efficiency':
        return value > 1.5 ? 'green' : value > 0.8 ? 'yellow' : 'red';
      default:
        return 'gray';
    }
  };

  const showAsBadge = (key: string): boolean => {
    return ['success_rate', 'error_rate', 'token_efficiency'].includes(key);
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const sortedModels = [...models].sort((a, b) => b.request_count - a.request_count);

  return (
    <Card className={className}>
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <div>
          <Title>Model Performance Comparison</Title>
          <Text>Side-by-side comparison of model metrics</Text>
        </div>
        {onRefresh && (
          <Button
            icon={ArrowPathIcon}
            variant="light"
            onClick={onRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        )}
      </Flex>

      <div className="mb-4">
        <Text className="mb-2">Select metrics to display:</Text>
        <div className="flex flex-wrap gap-2 mt-2">
          {metrics.map((metric) => (
            <Button
              key={metric.id}
              variant={selectedMetrics.includes(metric.id) ? "secondary" : "light"}
              color={selectedMetrics.includes(metric.id) ? "blue" : "gray"}
              size="xs"
              onClick={() => toggleMetric(metric.id)}
            >
              {metric.name}
            </Button>
          ))}
        </div>
      </div>

      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Model</TableHeaderCell>
            {selectedMetrics.map((metricId) => (
              <TableHeaderCell key={metricId}>
                {metrics.find(m => m.id === metricId)?.name || metricId}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedModels.map((model) => (
            <TableRow key={model.name}>
              <TableCell>{model.name}</TableCell>
              {selectedMetrics.map((metricId) => {
                const value = model[metricId as keyof ModelMetrics] as number;
                
                return (
                  <TableCell key={metricId}>
                    {showAsBadge(metricId) ? (
                      <Badge color={getStatusColor(metricId, value)}>
                        {formatValue(metricId, value)}
                      </Badge>
                    ) : (
                      formatValue(metricId, value)
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 