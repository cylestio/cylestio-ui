'use client';

import React, { useState, useEffect } from 'react';
import { Card, Title, Text, BarChart, DonutChart, Grid, Metric, Flex } from '@tremor/react';
import { fetchAPI } from '../../lib/api';
import { AGENTS } from '../../lib/api-endpoints';
import LoadingState from '../LoadingState';
import ErrorMessage from '../ErrorMessage';

interface TokenUsage {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  by_model: {
    [key: string]: {
      total_tokens: number;
      prompt_tokens: number;
      completion_tokens: number;
      cost?: number;
    };
  };
  // Additional fields that might be in the response
  time_period?: string;
  cost?: number;
}

interface AgentTokenUsageProps {
  agentId: string;
  timeRange?: string;
}

export function AgentTokenUsage({ agentId, timeRange = '7d' }: AgentTokenUsageProps) {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTokenUsage = async () => {
      try {
        setLoading(true);
        
        // Build the endpoint with time range parameter
        const params = { time_range: timeRange };
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `${AGENTS.TOKEN_USAGE(agentId)}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetchAPI<TokenUsage>(endpoint);
        
        if (!isMounted) return;
        
        console.log('Token usage data received:', response); // Debug log
        
        // Ensure we have valid data
        const validatedData: TokenUsage = {
          total_tokens: response?.total_tokens || 0,
          prompt_tokens: response?.prompt_tokens || 0,
          completion_tokens: response?.completion_tokens || 0,
          by_model: response?.by_model || {}
        };
        
        setTokenUsage(validatedData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching token usage:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load token usage data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchTokenUsage();
    
    return () => {
      isMounted = false;
    };
  }, [agentId, timeRange]);
  
  if (loading) {
    return <LoadingState message="Loading token usage data..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (!tokenUsage) {
    return (
      <Card className="mt-4">
        <Text>No token usage data found for this agent in the selected time range.</Text>
      </Card>
    );
  }
  
  // Prepare data for the model breakdown chart
  const modelBreakdown = Object.entries(tokenUsage?.by_model || {}).map(([model, usage]: [string, any]) => ({
    model,
    tokens: usage?.total_tokens || 0,
    cost: usage?.cost || 0
  })).filter(model => model.tokens > 0); // Filter out models with zero tokens
  
  // Prepare data for the token type chart
  const tokenTypeData = [
    {
      name: 'Prompt Tokens',
      value: tokenUsage?.prompt_tokens || 0,
    },
    {
      name: 'Completion Tokens',
      value: tokenUsage.completion_tokens,
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card className="mt-4">
        <Title>Token Usage Summary</Title>
        <Text className="mb-4">Token consumption for this agent in the selected time period</Text>
        
        <Grid numItemsMd={2} numItemsLg={3} className="mt-6 gap-6">
          <Card decoration="top" decorationColor="blue">
            <Flex alignItems="start">
              <div>
                <Text>Total Tokens</Text>
                <Metric>{tokenUsage?.total_tokens ? tokenUsage.total_tokens.toLocaleString() : '0'}</Metric>
              </div>
            </Flex>
          </Card>
          
          <Card decoration="top" decorationColor="amber">
            <Flex alignItems="start">
              <div>
                <Text>Prompt Tokens</Text>
                <Metric>{tokenUsage?.prompt_tokens ? tokenUsage.prompt_tokens.toLocaleString() : '0'}</Metric>
                <Text className="mt-1 text-sm">
                  {tokenUsage?.prompt_tokens && tokenUsage?.total_tokens && tokenUsage.total_tokens > 0 
                    ? ((tokenUsage.prompt_tokens / tokenUsage.total_tokens) * 100).toFixed(1) 
                    : '0'}% of total
                </Text>
              </div>
            </Flex>
          </Card>
          
          <Card decoration="top" decorationColor="green">
            <Flex alignItems="start">
              <div>
                <Text>Completion Tokens</Text>
                <Metric>{tokenUsage?.completion_tokens ? tokenUsage.completion_tokens.toLocaleString() : '0'}</Metric>
                <Text className="mt-1 text-sm">
                  {tokenUsage?.completion_tokens && tokenUsage?.total_tokens && tokenUsage.total_tokens > 0
                    ? ((tokenUsage.completion_tokens / tokenUsage.total_tokens) * 100).toFixed(1)
                    : '0'}% of total
                </Text>
              </div>
            </Flex>
          </Card>
        </Grid>
      </Card>
      
      <Grid numItemsMd={1} numItemsLg={2} className="gap-6">
        {modelBreakdown.length > 0 && (
          <Card>
            <Title>Token Usage by Model</Title>
            <BarChart
              className="mt-4 h-80"
              data={modelBreakdown}
              index="model"
              categories={["tokens"]}
              colors={["blue"]}
              valueFormatter={(value) => `${value.toLocaleString()} tokens`}
              yAxisWidth={80}
            />
          </Card>
        )}
        
        {tokenUsage && (tokenUsage.prompt_tokens > 0 || tokenUsage.completion_tokens > 0) && (
          <Card>
            <Title>Token Type Distribution</Title>
            <DonutChart
              className="mt-4 h-80"
              data={tokenTypeData}
              category="value"
              index="name"
              colors={["amber", "green"]}
              valueFormatter={(value) => `${value.toLocaleString()} tokens`}
            />
          </Card>
        )}
      </Grid>
    </div>
  );
} 