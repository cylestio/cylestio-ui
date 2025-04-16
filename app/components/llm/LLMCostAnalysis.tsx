'use client'

import { 
  Card, 
  Title, 
  Text,
  BarChart,
  Metric,
  Flex,
  Grid,
  Badge,
  List,
  ListItem,
  LineChart
} from '@tremor/react'
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

// Define types
export type CostData = {
  totalCost: number;
  previousPeriodCost: number;
  costByModel: {
    name: string;
    cost: number;
    tokenCost: number;
    tokens: number;
  }[];
  costByAgent: {
    name: string;
    cost: number;
    tokens: number;
  }[];
  dailyCosts: {
    date: string;
    cost: number;
    forecastCost?: number;
  }[];
  costEfficiency: {
    name: string;
    costPerRequest: number;
    costPerToken: number;
    costPer1kSuccessfulTokens: number;
  }[];
}

export interface LLMCostAnalysisProps {
  data: CostData;
  loading?: boolean;
  className?: string;
}

export default function LLMCostAnalysis({
  data,
  loading = false,
  className = ''
}: LLMCostAnalysisProps) {
  // Calculate cost trend percentage
  const costTrendPercentage = data.previousPeriodCost === 0 
    ? 100 
    : ((data.totalCost - data.previousPeriodCost) / data.previousPeriodCost) * 100;
  
  // Trend direction
  const isTrendUp = costTrendPercentage > 0;
  
  // Format values for display
  const formatCost = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${Math.abs(value).toFixed(1)}%`;
  
  // Calculate forecast if we have enough data
  const hasForecast = data.dailyCosts.some(day => day.forecastCost !== undefined);
  
  // Calculate efficiency statistics
  const totalRequests = data.costByModel.reduce((acc, model) => acc + (model.tokens / 100), 0);
  const averageCostPerRequest = totalRequests > 0 ? data.totalCost / totalRequests : 0;
  
  return (
    <div className={`space-y-6 w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Flex justifyContent="start" className="gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <Text>Total Cost</Text>
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-100 rounded w-24 mt-1"></div>
              ) : (
                <Metric>{formatCost(data.totalCost)}</Metric>
              )}
            </div>
          </Flex>
          {!loading && data.previousPeriodCost > 0 && (
            <Flex className="mt-2">
              <Badge color={isTrendUp ? "red" : "emerald"} icon={isTrendUp ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}>
                {formatPercentage(costTrendPercentage)} {isTrendUp ? 'increase' : 'decrease'} from previous period
              </Badge>
            </Flex>
          )}
        </Card>
        
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <ArrowRightIcon className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <Text>Average Cost per Request</Text>
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-100 rounded w-24 mt-1"></div>
              ) : (
                <Metric>{formatCost(averageCostPerRequest)}</Metric>
              )}
            </div>
          </Flex>
        </Card>
        
        <Card decoration="top" decorationColor={hasForecast ? "amber" : "gray"}>
          <Flex justifyContent="start" className="gap-3">
            <div className={`p-2 ${hasForecast ? 'bg-amber-100' : 'bg-gray-100'} rounded-full`}>
              <ArrowTrendingUpIcon className={`h-6 w-6 ${hasForecast ? 'text-amber-700' : 'text-gray-700'}`} />
            </div>
            <div>
              <Text>Projected Monthly Cost</Text>
              {loading ? (
                <div className="animate-pulse h-8 bg-gray-100 rounded w-24 mt-1"></div>
              ) : (
                <Metric>
                  {hasForecast 
                    ? formatCost(data.dailyCosts.reduce((acc, day) => acc + (day.forecastCost || 0), 0))
                    : 'Insufficient data'}
                </Metric>
              )}
            </div>
          </Flex>
        </Card>
      </div>
      
      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Title>Cost by Model</Title>
          <Text>Breakdown of costs across different models</Text>
          {loading ? (
            <div className="animate-pulse h-72 bg-gray-100 rounded mt-4"></div>
          ) : (
            <BarChart
              className="mt-6 h-60"
              data={data.costByModel}
              index="name"
              categories={['cost']}
              colors={["emerald"]}
              valueFormatter={formatCost}
              yAxisWidth={75}
            />
          )}
        </Card>
        
        <Card>
          <Title>Cost by Agent</Title>
          <Text>Top agents by cost</Text>
          {loading ? (
            <div className="animate-pulse h-72 bg-gray-100 rounded mt-4"></div>
          ) : (
            <BarChart
              className="mt-6 h-60"
              data={data.costByAgent}
              index="name"
              categories={['cost']}
              colors={["blue"]}
              valueFormatter={formatCost}
              yAxisWidth={75}
            />
          )}
        </Card>
      </Grid>
      
      <Card>
        <Title>Daily/Weekly Cost Trends</Title>
        <Text>Cost over time with forecasting</Text>
        {loading ? (
          <div className="animate-pulse h-80 bg-gray-100 rounded mt-4"></div>
        ) : (
          <LineChart
            className="mt-6 h-80"
            data={data.dailyCosts}
            index="date"
            categories={['cost', 'forecastCost']}
            colors={["emerald", "amber"]}
            valueFormatter={formatCost}
            yAxisWidth={75}
            connectNulls={true}
            showLegend={true}
          />
        )}
      </Card>
      
      <Card>
        <Title>Cost Efficiency Metrics</Title>
        <Text>Comparing cost efficiency across models</Text>
        {loading ? (
          <div className="animate-pulse h-80 bg-gray-100 rounded mt-4"></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <Card className="ring-1 ring-gray-200">
              <Title>Cost per Request</Title>
              <BarChart
                className="mt-4 h-48"
                data={data.costEfficiency}
                index="name"
                categories={['costPerRequest']}
                colors={["emerald"]}
                valueFormatter={(value) => `$${value.toFixed(4)}`}
                showXAxis={false}
                showLegend={false}
              />
            </Card>
            
            <Card className="ring-1 ring-gray-200">
              <Title>Cost per Token</Title>
              <BarChart
                className="mt-4 h-48"
                data={data.costEfficiency}
                index="name"
                categories={['costPerToken']}
                colors={["blue"]}
                valueFormatter={(value) => `$${value.toFixed(6)}`}
                showXAxis={false}
                showLegend={false}
              />
            </Card>
            
            <Card className="ring-1 ring-gray-200">
              <Title>Cost per 1K Successful Tokens</Title>
              <BarChart
                className="mt-4 h-48"
                data={data.costEfficiency}
                index="name"
                categories={['costPer1kSuccessfulTokens']}
                colors={["indigo"]}
                valueFormatter={(value) => `$${value.toFixed(4)}`}
                showXAxis={false}
                showLegend={false}
              />
            </Card>
          </div>
        )}
      </Card>
      
      <Card>
        <Title>Cost Optimization Recommendations</Title>
        <Text>Based on your usage patterns</Text>
        {loading ? (
          <div className="animate-pulse h-40 bg-gray-100 rounded mt-4"></div>
        ) : (
          <List className="mt-4">
            {data.costByModel.length > 0 && (
              <ListItem>
                <span className="font-medium">Consider optimizing prompts for {data.costByModel[0].name}</span> to reduce token usage and cost.
              </ListItem>
            )}
            <ListItem>
              <span className="font-medium">Use caching for repetitive queries</span> to reduce redundant LLM calls.
            </ListItem>
            <ListItem>
              <span className="font-medium">Implement cost monitoring alerts</span> to get notified when costs exceed thresholds.
            </ListItem>
            <ListItem>
              <span className="font-medium">Batch similar requests</span> to improve throughput and reduce costs.
            </ListItem>
            {data.costEfficiency.length > 1 && (
              <ListItem>
                <span className="font-medium">Evaluate if {data.costEfficiency[1].name}</span> could replace some usage of {data.costEfficiency[0].name} for simpler tasks.
              </ListItem>
            )}
          </List>
        )}
      </Card>
    </div>
  );
} 