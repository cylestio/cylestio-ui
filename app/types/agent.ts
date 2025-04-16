/**
 * Agent type definitions
 * Consistent types used across the application for agent-related data
 */

/**
 * Agent type represents a single agent in the system
 */
export type Agent = {
  agent_id: string;
  name: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  // Direct properties used in listing views
  request_count: number;
  token_usage: number;
  error_count: number;
  // Additional metrics for detailed views - may not be available in list responses
  metrics?: {
    request_count: number;
    token_usage: number;
    error_count: number;
    avg_response_time?: number;
    success_rate?: number;
    cost_estimate?: number;
    session_count?: number;
    avg_session_duration?: number;
    top_tools?: { name: string; count: number }[];
  };
};

/**
 * Response structure for agent list endpoint
 */
export type AgentListResponse = {
  items: Agent[];
  pagination: PaginationInfo;
  meta: {
    timestamp: string;
  };
};

/**
 * Pagination information returned from API
 */
export type PaginationInfo = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
};

/**
 * Filter state for agent explorer
 */
export type AgentFilterState = {
  status?: string;
  page: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  search?: string;
  time_range?: string;
};

/**
 * Time range options
 */
export type TimeRangeOption = '24h' | '7d' | '30d'; 