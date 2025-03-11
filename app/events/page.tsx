'use client';

import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import { useEffect, useState } from 'react';

const mockEvents = [
  { id: 1, timestamp: '2025-03-11 09:15:23', type: 'API Call', status: 'success', duration: 234, details: 'GET /api/users' },
  { id: 2, timestamp: '2025-03-11 09:15:22', type: 'LLM Request', status: 'success', duration: 456, details: 'Text completion request' },
  { id: 3, timestamp: '2025-03-11 09:15:20', type: 'API Call', status: 'error', duration: 789, details: 'POST /api/analyze failed' },
  { id: 4, timestamp: '2025-03-11 09:15:18', type: 'Security', status: 'warning', duration: 123, details: 'Rate limit warning' },
];

export default function Events() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Events</h1>
        {currentTime && (
          <div className="text-sm text-gray-500">
            Last updated: {currentTime}
          </div>
        )}
      </div>

      <Card>
        <Title>Recent Events</Title>
        <Table className="mt-6">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Duration (ms)</TableHeaderCell>
              <TableHeaderCell>Details</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.timestamp}</TableCell>
                <TableCell>{event.type}</TableCell>
                <TableCell>
                  <Badge
                    color={
                      event.status === 'success'
                        ? 'emerald'
                        : event.status === 'warning'
                        ? 'amber'
                        : 'red'
                    }
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>{event.duration}</TableCell>
                <TableCell>{event.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 