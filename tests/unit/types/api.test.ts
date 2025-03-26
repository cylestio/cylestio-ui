import {
  Event,
  isLlmRequestEvent,
  isLlmResponseEvent,
  isToolCallEvent,
  isUserMessageEvent,
  isAgentMessageEvent,
  isSystemEvent,
  LlmRequestEvent,
  LlmResponseEvent,
  ToolCallEvent,
  UserMessageEvent,
  AgentMessageEvent,
  SystemEvent,
  API_PATHS
} from '@/types/api';

describe('API Type Definitions', () => {
  describe('Event Type Guards', () => {
    // Base event for testing
    const baseEvent = {
      id: 1,
      event_id: 'evt_123',
      agent_id: 'agt_123',
      session_id: 'ses_123',
      conversation_id: 'conv_123',
      timestamp: '2023-01-01T00:00:00Z',
      metadata: {}
    };

    test('isLlmRequestEvent should correctly identify LLM request events', () => {
      const llmRequestEvent: Event = {
        ...baseEvent,
        event_type: 'llm_request',
        model: 'gpt-4',
        prompt: 'Test prompt',
        tokens: 150,
        parameters: { temperature: 0.7 }
      };

      const notLlmRequestEvent: Event = {
        ...baseEvent,
        event_type: 'llm_response',
        model: 'gpt-4',
        response: 'Test response',
        tokens: 50,
        latency_ms: 300
      };

      expect(isLlmRequestEvent(llmRequestEvent)).toBe(true);
      expect(isLlmRequestEvent(notLlmRequestEvent)).toBe(false);
      
      // Type narrowing works correctly
      if (isLlmRequestEvent(llmRequestEvent)) {
        expect(llmRequestEvent.prompt).toBe('Test prompt');
        expect(llmRequestEvent.parameters?.temperature).toBe(0.7);
      }
    });

    test('isLlmResponseEvent should correctly identify LLM response events', () => {
      const llmResponseEvent: Event = {
        ...baseEvent,
        event_type: 'llm_response',
        model: 'gpt-4',
        response: 'Test response',
        tokens: 50,
        latency_ms: 300
      };

      const notLlmResponseEvent: Event = {
        ...baseEvent,
        event_type: 'tool_call',
        tool_name: 'search',
        inputs: { query: 'test' },
        success: true
      };

      expect(isLlmResponseEvent(llmResponseEvent)).toBe(true);
      expect(isLlmResponseEvent(notLlmResponseEvent)).toBe(false);
      
      // Type narrowing works correctly
      if (isLlmResponseEvent(llmResponseEvent)) {
        expect(llmResponseEvent.response).toBe('Test response');
        expect(llmResponseEvent.latency_ms).toBe(300);
      }
    });

    test('isToolCallEvent should correctly identify tool call events', () => {
      const toolCallEvent: Event = {
        ...baseEvent,
        event_type: 'tool_call',
        tool_name: 'search',
        inputs: { query: 'test' },
        outputs: { results: ['result1', 'result2'] },
        success: true
      };

      const failedToolCallEvent: Event = {
        ...baseEvent,
        event_type: 'tool_call',
        tool_name: 'search',
        inputs: { query: 'test' },
        success: false,
        error_message: 'Tool execution failed'
      };

      const notToolCallEvent: Event = {
        ...baseEvent,
        event_type: 'user_message',
        message: 'Hello'
      };

      expect(isToolCallEvent(toolCallEvent)).toBe(true);
      expect(isToolCallEvent(failedToolCallEvent)).toBe(true);
      expect(isToolCallEvent(notToolCallEvent)).toBe(false);
      
      // Type narrowing works correctly for successful tool call
      if (isToolCallEvent(toolCallEvent)) {
        expect(toolCallEvent.tool_name).toBe('search');
        expect(toolCallEvent.success).toBe(true);
        expect(toolCallEvent.outputs?.results).toEqual(['result1', 'result2']);
      }
      
      // Type narrowing works correctly for failed tool call
      if (isToolCallEvent(failedToolCallEvent)) {
        expect(failedToolCallEvent.success).toBe(false);
        expect(failedToolCallEvent.error_message).toBe('Tool execution failed');
      }
    });

    test('isUserMessageEvent should correctly identify user message events', () => {
      const userMessageEvent: Event = {
        ...baseEvent,
        event_type: 'user_message',
        message: 'Hello from user'
      };

      const notUserMessageEvent: Event = {
        ...baseEvent,
        event_type: 'agent_message',
        message: 'Hello from agent'
      };

      expect(isUserMessageEvent(userMessageEvent)).toBe(true);
      expect(isUserMessageEvent(notUserMessageEvent)).toBe(false);
      
      // Type narrowing works correctly
      if (isUserMessageEvent(userMessageEvent)) {
        expect(userMessageEvent.message).toBe('Hello from user');
      }
    });

    test('isAgentMessageEvent should correctly identify agent message events', () => {
      const agentMessageEvent: Event = {
        ...baseEvent,
        event_type: 'agent_message',
        message: 'Hello from agent'
      };

      const notAgentMessageEvent: Event = {
        ...baseEvent,
        event_type: 'system_event',
        system_event_type: 'agent_startup'
      };

      expect(isAgentMessageEvent(agentMessageEvent)).toBe(true);
      expect(isAgentMessageEvent(notAgentMessageEvent)).toBe(false);
      
      // Type narrowing works correctly
      if (isAgentMessageEvent(agentMessageEvent)) {
        expect(agentMessageEvent.message).toBe('Hello from agent');
      }
    });

    test('isSystemEvent should correctly identify system events', () => {
      const systemEvent: Event = {
        ...baseEvent,
        event_type: 'system_event',
        system_event_type: 'agent_startup'
      };

      const notSystemEvent: Event = {
        ...baseEvent,
        event_type: 'user_message',
        message: 'Hello'
      };

      expect(isSystemEvent(systemEvent)).toBe(true);
      expect(isSystemEvent(notSystemEvent)).toBe(false);
      
      // Type narrowing works correctly
      if (isSystemEvent(systemEvent)) {
        expect(systemEvent.system_event_type).toBe('agent_startup');
      }
    });
  });

  describe('API Paths', () => {
    test('API_PATHS should contain all required endpoints', () => {
      expect(API_PATHS.AGENTS).toBe('/agents');
      expect(API_PATHS.EVENTS).toBe('/events');
      expect(API_PATHS.ALERTS).toBe('/alerts');
      expect(API_PATHS.METRICS.TOKEN_USAGE).toBe('/metrics/token-usage');
      expect(API_PATHS.METRICS.RESPONSE_TIME).toBe('/metrics/response-time');
      expect(API_PATHS.TELEMETRY).toBe('/telemetry');
    });
  });
}); 