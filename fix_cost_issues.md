# Cost Discrepancy Analysis for Cylestio Dashboard

## Overview
We've identified inconsistencies between cost values displayed in different dashboard components. This document provides a comprehensive analysis of the endpoints used for each component, calculation methods, and potential root causes.

## Component Endpoint Analysis

### 1. Model Usage & Cost by Agent (Agent Usage Tab)
**Endpoint:** `/v1/metrics/llm/agent_model_relationships`
**Parameter:** `time_range=30d` (or whatever the selected timeRange is)
**Data Access:** Uses `relationshipData` state populated from this endpoint
**Calculation Method:** Aggregates `item.metrics.estimated_cost_usd` per agent

```typescript
// Inside the getAgentModelCosts function
relationshipData.forEach(item => {
  const parts = item.key.split(':');
  const agentId = parts[0];
  
  if (!agentCosts[agentId]) {
    agentCosts[agentId] = 0;
  }
  
  agentCosts[agentId] += item.metrics.estimated_cost_usd || 0;
});
```

### 2. Cost Analysis Tab
**Endpoint:** `/v1/metrics/llm/models`
**Parameter:** `time_range=30d` (or selected timeRange)
**Data Access:** Uses `modelData` state populated from this endpoint
**Calculation Method:** Directly displays `item.metrics.estimated_cost_usd` from model breakdown

```typescript
// In getModelComparisonData function
return modelData.breakdown.map((item) => {
  const displayName = MODEL_DISPLAY_NAMES[item.key.toLowerCase()] || item.key;
  return {
    name: displayName,
    // ...other fields
    'cost': item.metrics.estimated_cost_usd,
    'Cost ($)': item.metrics.estimated_cost_usd,
    // ...other fields
  };
});
```

### 3. Overview Tab Cost Cards
**Endpoint:** `/v1/dashboard` or `/v1/metrics/pricing/token_usage_cost`
**Parameter:** Unknown, possibly `time_range=30d`
**Data Access:** Appears to be direct display of summary metrics
**Calculation Method:** Likely displaying a pre-aggregated total cost value from the response

### 4. Token Usage by Model Chart
**Endpoint:** `/v1/metrics/llm/models`
**Parameter:** `time_range=30d` (or selected timeRange)
**Data Access:** Uses the same `modelData` state as Cost Analysis tab
**Calculation Method:** May calculate cost-per-token values:

```typescript
// In getCostPerTokenData function
const costPer1KTokens = item.metrics.token_count_total > 0 
  ? (item.metrics.estimated_cost_usd / (item.metrics.token_count_total / 1000)) 
  : 0;
```

### 5. Estimated Cost Cards (Standalone)
**Endpoint:** Unknown, possibly `/v1/metrics/pricing/token_usage_cost`
**Parameter:** Unknown time range
**Data Access:** Direct display of API response data
**Calculation Method:** Likely displaying pre-calculated values from a specific API endpoint

## Root Causes of Discrepancies

1. **Different Data Sources:**
   - Multiple endpoints providing cost data
   - Each endpoint may have its own calculation method
   - Endpoints may be operating on different data subsets

2. **Time Range Inconsistencies:**
   - Different components may use different time ranges
   - Some components might respect the global time range filter while others use hardcoded ranges
   - Historical vs. real-time data differences

3. **Calculation Method Differences:**
   - Some components aggregate costs across models
   - Others display costs for specific model-agent combinations
   - Different rounding or precision handling

4. **Data Normalization Issues:**
   - Cost data isn't normalized across components
   - Different aggregation periods (daily vs. total)
   - Different baselines for calculations

5. **Potential Backend Issues:**
   - API endpoints might use different database queries
   - Caching mechanisms could result in stale data
   - Data refresh rates may vary between endpoints

## Recommended Verification Steps

1. Compare the raw API responses from each endpoint with the same time range parameter
2. Verify the calculation methods in the backend for each endpoint
3. Check for data normalization issues across the endpoints
4. Examine how time ranges are handled in each endpoint
5. Look for any caching mechanisms that might affect data freshness

## Proposed Solutions

1. **Unified Cost Data Source:**
   - Create a single endpoint for all cost-related data
   - Ensure consistent calculation methods across all cost metrics

2. **Clear Context Labels:**
   - Add time period labels to each cost display
   - Include calculation method information in tooltips

3. **Standardized Calculation:**
   - Document how each cost metric should be calculated
   - Implement shared utility functions for cost calculations

4. **Improved Documentation:**
   - Add detailed documentation about cost metrics
   - Explain differences between various cost presentations

This analysis should help identify the exact sources of discrepancies in the cost reporting across the dashboard.
