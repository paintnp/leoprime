import { useState, useCallback, useRef } from 'react';
import { agentApi } from '../lib/api';
import type { AgentEvent, AgentState, RetrievedMemory } from '@shared/types/index';

export interface AgentStreamState {
  isRunning: boolean;
  runId: string | null;
  currentState: AgentState | null;
  events: AgentEvent[];
  memories: RetrievedMemory[];
  payments: Array<{
    txHash: string;
    amount: number;
    currency: string;
    purpose: string;
    explorerUrl: string;
  }>;
  entitlements: Array<{
    service: string;
    isActive: boolean;
    expiresAt: string;
  }>;
  artifact: {
    projectId: string;
    name: string;
    type: string;
    preview: string;
  } | null;
  error: string | null;
}

export function useAgentStream() {
  const [state, setState] = useState<AgentStreamState>({
    isRunning: false,
    runId: null,
    currentState: null,
    events: [],
    memories: [],
    payments: [],
    entitlements: [],
    artifact: null,
    error: null,
  });

  const cancelRef = useRef<(() => void) | null>(null);

  const startRun = useCallback((goal: string) => {
    // Reset state
    setState({
      isRunning: true,
      runId: null,
      currentState: 'THINK',
      events: [],
      memories: [],
      payments: [],
      entitlements: [],
      artifact: null,
      error: null,
    });

    // Cancel any existing stream
    if (cancelRef.current) {
      cancelRef.current();
    }

    // Start new stream
    cancelRef.current = agentApi.streamRun(goal, (event) => {
      setState((prev) => {
        const newEvents = [...prev.events, event];

        // Handle different event types
        switch (event.type) {
          case 'run_started':
            return {
              ...prev,
              events: newEvents,
              runId: event.runId,
            };

          case 'state_change':
            const stateData = event.data as { currentState: AgentState };
            return {
              ...prev,
              events: newEvents,
              currentState: stateData.currentState,
            };

          case 'memory_retrieved':
            const memoryData = event.data as { memories: RetrievedMemory[] };
            return {
              ...prev,
              events: newEvents,
              memories: memoryData.memories,
            };

          case 'payment':
            const paymentData = event.data as {
              txHash: string;
              amount: number;
              currency: string;
              purpose: string;
              explorerUrl: string;
            };
            return {
              ...prev,
              events: newEvents,
              payments: [...prev.payments, paymentData],
            };

          case 'entitlement':
            const entitlementData = event.data as {
              service: string;
              isActive: boolean;
              expiresAt: string;
            };
            return {
              ...prev,
              events: newEvents,
              entitlements: [...prev.entitlements, entitlementData],
            };

          case 'artifact':
            const artifactData = event.data as {
              projectId: string;
              name: string;
              type: string;
              preview: string;
            };
            return {
              ...prev,
              events: newEvents,
              artifact: artifactData,
            };

          case 'complete':
            return {
              ...prev,
              events: newEvents,
              isRunning: false,
              currentState: 'COMPLETE',
            };

          case 'error':
            const errorData = event.data as { message: string };
            return {
              ...prev,
              events: newEvents,
              isRunning: false,
              currentState: 'ERROR',
              error: errorData.message,
            };

          default:
            return {
              ...prev,
              events: newEvents,
            };
        }
      });
    });
  }, []);

  const cancelRun = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  return {
    ...state,
    startRun,
    cancelRun,
  };
}
