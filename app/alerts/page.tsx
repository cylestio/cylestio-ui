'use client';

import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Text } from '@tremor/react';
import { ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const mockAlerts = [
  { 
    id: 1, 
    timestamp: '2025-03-11 09:15:23', 
    type: 'Security', 
    severity: 'high',
    message: 'Multiple failed authentication attempts detected',
    source: 'Authentication Service'
  },
  { 
    id: 2, 
    timestamp: '2025-03-11 09:14:22', 
    type: 'Performance', 
    severity: 'medium',
    message: 'High latency detected in API responses',
    source: 'API Gateway'
  },
  { 
    id: 3, 
    timestamp: '2025-03-11 09:13:20', 
    type: 'Security', 
    severity: 'high',
    message: 'Suspicious pattern in API usage detected',
    source: 'Security Monitor'
  },
  { 
    id: 4, 
    timestamp: '2025-03-11 09:12:18', 
    type: 'System', 
    severity: 'low',
    message: 'Memory usage above 80%',
    source: 'System Monitor'
  },
];

export default function Alerts() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Alerts</h1>
        {currentTime && (
          <div className="text-sm text-gray-500">
            Last updated: {currentTime}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card decoration="top" decorationColor="red">
          <div className="flex items-center space-x-4">
            <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
            <div>
              <Text>Critical Alerts</Text>
              <div className="text-2xl font-bold text-red-500">2</div>
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <div className="flex items-center space-x-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
            <div>
              <Text>Total Active Alerts</Text>
              <div className="text-2xl font-bold text-amber-500">4</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Title>Active Alerts</Title>
        <Table className="mt-6">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Severity</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
              <TableHeaderCell>Message</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.timestamp}</TableCell>
                <TableCell>{alert.type}</TableCell>
                <TableCell>
                  <Badge
                    color={
                      alert.severity === 'high'
                        ? 'red'
                        : alert.severity === 'medium'
                        ? 'amber'
                        : 'emerald'
                    }
                  >
                    {alert.severity}
                  </Badge>
                </TableCell>
                <TableCell>{alert.source}</TableCell>
                <TableCell>{alert.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 