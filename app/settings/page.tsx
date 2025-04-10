'use client';

import { Card, Title, Text, TextInput, Button, Select, SelectItem } from '@tremor/react';
import { useEffect, useState } from 'react';

const mockSettings = {
  apiKey: 'sk-1234567890abcdef',
  maxRequestsPerMinute: '100',
  alertThreshold: 'medium',
  notificationEmail: 'admin@example.com',
};

export default function Settings() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [settings, setSettings] = useState(mockSettings);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
  }, []);

  const handleSave = () => {
    // TODO: Implement settings save
    console.log('Saving settings:', {
      ...settings,
      maxRequestsPerMinute: parseInt(settings.maxRequestsPerMinute),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        {currentTime && (
          <div className="text-sm text-gray-500">
            Last updated: {currentTime}
          </div>
        )}
      </div>

      <Card>
        <Title>API Configuration</Title>
        <div className="mt-6 space-y-4">
          <div>
            <Text>API Key</Text>
            <TextInput
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="Enter your API key"
              type="password"
            />
          </div>

          <div>
            <Text>Max Requests per Minute</Text>
            <TextInput
              value={settings.maxRequestsPerMinute}
              onChange={(e) => setSettings({ ...settings, maxRequestsPerMinute: e.target.value })}
              type="text"
              placeholder="Enter max requests per minute"
            />
          </div>
        </div>
      </Card>

      <Card>
        <Title>Alert Settings</Title>
        <div className="mt-6 space-y-4">
          <div>
            <Text>Alert Threshold</Text>
            <Select
              value={settings.alertThreshold}
              onValueChange={(value) => setSettings({ ...settings, alertThreshold: value })}
            >
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </Select>
          </div>

          <div>
            <Text>Notification Email</Text>
            <TextInput
              value={settings.notificationEmail}
              onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
              type="email"
              placeholder="Enter notification email"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
} 