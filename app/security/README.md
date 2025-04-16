# Security Explorer

## Overview

The Security Explorer is a comprehensive feature that enables users to monitor, investigate, and respond to security-related issues across LLM applications. It provides real-time visibility into security alerts, detailed investigation capabilities, and actionable insights.

## Features

- **Security Dashboard**: Visualize security metrics and trends across your LLM applications
- **Alerts Explorer**: Browse, filter, and investigate security alerts with flexible filtering and pagination
- **Alert Details**: Dive deep into specific security alerts with rich context and related events
- **Security Policies**: (Coming soon) Manage and configure security policies

## Components Architecture

The Security Explorer is built with a modular architecture consisting of the following components:

- `SecurityExplorerContainer`: Main container component that manages state and routing
- `SecurityFilterBar`: Provides filtering capabilities for security data
- `SecurityDashboard`: Displays security metrics and visualizations
- `SecurityAlertsTable`: Lists security alerts with sorting and pagination
- `SecurityAlertDetailContainer`: Shows detailed information about a specific alert

## API Integration

The Security Explorer integrates with the following API endpoints:

- `/v1/alerts`: Get a list of security alerts with filtering and pagination
- `/v1/alerts/overview`: Get security overview metrics and trends
- `/v1/alerts/{id}`: Get detailed information about a specific alert

## Implementation

The feature is implemented using Next.js with React and TypeScript. UI components are built with Tremor.

### Data Flow

1. User interacts with filters in the UI
2. The container component updates state based on user interactions
3. API requests are made with the updated filters
4. The UI components render the returned data
5. URL parameters are synchronized with the current filter state

### URL Parameters

The following URL parameters are supported:

- `severity`: Filter by alert severity (critical, high, medium, low)
- `category`: Filter by alert category
- `alert_level`: Filter by alert level
- `llm_vendor`: Filter by LLM vendor
- `search`: Text search across alerts
- `time_range`: Time range for data (1h, 1d, 7d, 30d)
- `page`: Current page number for pagination

## Testing

Comprehensive tests have been implemented for all components:

- Unit tests for individual components
- Integration tests for component interactions
- Mocks for API and data services

To run the security tests manually, use:

```bash
node scripts/run-security-tests.js
```

## Future Enhancements

- **Security Policies Management**: Create, edit, and manage security policies
- **Alert Response Actions**: Take direct actions to respond to security alerts
- **Anomaly Detection**: Automated detection of unusual security patterns
- **Integration with LLM Guardrails**: Connect to guardrail systems for preventive security
- **Custom Alert Rules**: Create custom alert rules based on specific patterns

## Related Documentation

- [API Endpoints](../lib/api-endpoints.ts)
- [Security Alert Types](./types)
- [API Integration](../lib/api.ts) 