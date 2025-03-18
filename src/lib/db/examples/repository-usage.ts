/**
 * Example repository usage
 */
import { 
  AgentRepository,
  SessionRepository,
  ConversationRepository,
  EventRepository,
  LLMCallRepository,
  ToolCallRepository,
  SecurityAlertRepository,
  EventSecurityRepository,
  PerformanceMetricRepository
} from '../repositories';
import { getDatabase } from '../';

// Initialize the database connection
const db = getDatabase();

// Create repositories
const agentRepo = new AgentRepository();
const sessionRepo = new SessionRepository();
const conversationRepo = new ConversationRepository();
const eventRepo = new EventRepository();
const llmCallRepo = new LLMCallRepository();
const toolCallRepo = new ToolCallRepository();
const securityAlertRepo = new SecurityAlertRepository();
const eventSecurityRepo = new EventSecurityRepository();
const performanceMetricRepo = new PerformanceMetricRepository();

/**
 * Example 1: Getting agent data with metrics
 */
async function getAgentDataWithMetrics(agentId: number) {
  // Get the agent
  const agent = agentRepo.findById(agentId);
  if (!agent) {
    console.error(`Agent with ID ${agentId} not found`);
    return null;
  }

  // Get agent metrics
  const metrics = agentRepo.getAgentMetrics(agentId);
  
  // Get agent's active sessions
  const activeSessions = sessionRepo.getActiveSessionsForAgent(agentId);
  
  // Get agent's recent events
  const recentEvents = eventRepo.findByAgentId(agentId, 20);
  
  // Get token usage
  const tokenUsage = llmCallRepo.getTotalTokensUsedByAgent(agentId);
  
  // Get tool usage statistics
  const toolStats = toolCallRepo.getToolUsageStatistics();
  
  // Get security alerts
  const securityAlerts = securityAlertRepo.getSecurityAlertsForAgent(agentId);
  
  return {
    agent,
    metrics,
    activeSessions,
    activeSessionCount: activeSessions.length,
    recentEvents,
    tokenUsage,
    toolStats,
    securityAlerts,
    securityAlertCount: securityAlerts.length
  };
}

/**
 * Example 2: Dashboard overview statistics
 */
async function getDashboardOverview() {
  // Get agents with status
  const agents = agentRepo.getAllWithStatus();
  
  // Get active sessions
  const activeSessions = sessionRepo.getActiveSessions();
  
  // Get recent conversations with agent info
  const recentConversations = conversationRepo.getConversationsWithSessionAndAgentInfo(10);
  
  // Get recent events
  const recentEvents = eventRepo.findAll({ transaction: true }).slice(0, 20);
  
  // Get model usage statistics
  const modelStats = llmCallRepo.getModelUsageStatistics();
  
  // Get tool usage statistics
  const toolStats = toolCallRepo.getToolUsageStatistics();
  
  // Get security statistics by agent
  const securityStatsByAgent = eventSecurityRepo.getSecurityStatisticsByAgent();
  
  // Get performance metric statistics
  const performanceStats = performanceMetricRepo.getMetricStatisticsByType();
  
  // Count total LLM calls
  const llmCallsResult = db.getDb().prepare('SELECT COUNT(*) as count FROM llm_calls').get() as { count: number };
  const totalLLMCalls = llmCallsResult.count;
  
  // Count total tool calls
  const toolCallsResult = db.getDb().prepare('SELECT COUNT(*) as count FROM tool_calls').get() as { count: number };
  const totalToolCalls = toolCallsResult.count;
  
  return {
    agents,
    agentCount: agents.length,
    activeAgentCount: agents.filter(a => a.active).length,
    activeSessions,
    activeSessionCount: activeSessions.length,
    recentConversations,
    recentEvents,
    modelStats,
    toolStats,
    securityStatsByAgent,
    performanceStats,
    totalLLMCalls,
    totalToolCalls
  };
}

/**
 * Example 3: Session timeline with all related events
 */
async function getSessionTimeline(sessionId: number) {
  // Get the session
  const session = sessionRepo.findById(sessionId);
  if (!session) {
    console.error(`Session with ID ${sessionId} not found`);
    return null;
  }
  
  // Get the agent
  const agent = agentRepo.findById(session.agent_id);
  
  // Get conversations in this session
  const conversations = conversationRepo.findBySessionId(sessionId);
  
  // Get all events for this session
  const events = eventRepo.findBySessionId(sessionId, 1000);
  
  // Get LLM calls for this session
  const llmCalls = llmCallRepo.getLLMCallsForSession(sessionId);
  
  // Get tool calls for this session
  const toolCalls = toolCallRepo.getToolCallsForSession(sessionId);
  
  // Get security alerts for this session
  const securityAlerts = securityAlertRepo.getSecurityAlertsForSession(sessionId);
  
  // Get performance metrics for this session
  const performanceMetrics = performanceMetricRepo.getPerformanceMetricsForSession(sessionId);
  
  // Create a timeline of all events with their details
  const timeline = events.map(event => {
    const details: any = { ...event };
    
    if (event.event_type === 'LLM_REQUEST' || event.event_type === 'LLM_RESPONSE') {
      // Find LLM call for this event
      const llmCall = llmCalls.find(call => call.event_id === event.id);
      if (llmCall) {
        details.llm = llmCall;
      }
    }
    
    if (event.event_type === 'TOOL_CALL' || event.event_type === 'TOOL_RESPONSE') {
      // Find tool call for this event
      const toolCall = toolCalls.find(call => call.event_id === event.id);
      if (toolCall) {
        details.tool = toolCall;
      }
    }
    
    // Add security alert if exists
    const security = securityAlerts.find(alert => alert.event_id === event.id);
    if (security) {
      details.security = security;
    }
    
    // Add performance metric if exists
    const performance = performanceMetrics.find(metric => metric.event_id === event.id);
    if (performance) {
      details.performance = performance;
    }
    
    return details;
  });
  
  return {
    session,
    agent,
    conversations,
    conversationCount: conversations.length,
    timeline,
    sessionDuration: sessionRepo.getSessionDuration(sessionId)
  };
}

// Export the example functions
export {
  getAgentDataWithMetrics,
  getDashboardOverview,
  getSessionTimeline
}; 