/**
 * API services exports
 */

// Import API paths and types
import { API_PATHS } from '@/types/api';

// Export API paths
export { API_PATHS };

// Export types
export type { AlertSeverity, AlertType } from '@/types/api';

// Import services for direct export
import { EventsService } from './events';
import { AgentService } from './agents';
import { AlertsService } from './alerts';
import { MetricsService } from './metrics';
import * as EventService from './event-service';

// Export services
export { EventsService, AgentService, AlertsService, MetricsService, EventService };

// Re-export the service parameter types
export type { AlertServiceParams } from './alerts';
export type { AgentServiceParams } from './agents';
export type { EventServiceParams } from './events';
export type { MetricsServiceParams } from './metrics'; 