'use client'

import React from 'react'
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Card,
  Title,
  Text,
  Flex,
  Button,
} from '@tremor/react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

type ModelMetrics = {
  name: string;
  request_count: number;
  response_time_avg: number;
  token_count_total: number;
  estimated_cost_usd: number;
  // Removed success_rate and other less important fields
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
  // Removed selectedMetrics state and related toggle functions to simplify UI

  const formatValue = (key: string, value: number): string => {
    switch (key) {
      case 'request_count':
        return value.toLocaleString();
      case 'response_time_avg':
        return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(2)}s`;
      case 'token_count_total':
        return value.toLocaleString();
      case 'estimated_cost_usd':
        return `$${value.toFixed(2)}`;
      default:
        return value.toString();
    }
  };

  const sortedModels = [...models].sort((a, b) => b.request_count - a.request_count);

  return (
    <Card className={`${className} overflow-hidden`}>
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <div>
          <Title>Model Comparison</Title>
          <Text>Key metrics across different models</Text>
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

      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="font-semibold">Model</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-right">Requests</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-right">Tokens</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-right">Avg. Time</TableHeaderCell>
            <TableHeaderCell className="font-semibold text-right">Cost</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedModels.map((model) => (
            <TableRow key={model.name}>
              <TableCell className="font-medium">{model.name}</TableCell>
              <TableCell className="text-right">{formatValue('request_count', model.request_count)}</TableCell>
              <TableCell className="text-right">{formatValue('token_count_total', model.token_count_total)}</TableCell>
              <TableCell className="text-right">{formatValue('response_time_avg', model.response_time_avg)}</TableCell>
              <TableCell className="text-right">{formatValue('estimated_cost_usd', model.estimated_cost_usd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 