import type {
  AgentRun,
  Transaction,
  Entitlement,
  Log,
  Project,
  WalletInfo,
  AgentEvent,
  PaywallService,
  RetrievedMemory,
} from '@shared/types/index';

const API_BASE = '/api';

// ============================================================================
// API CLIENT
// ============================================================================

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// AGENT API
// ============================================================================

export const agentApi = {
  startRun: (goal: string) =>
    request<{ runId: string; status: string }>('/agent/run', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    }),

  getRun: (id: string) => request<AgentRun>(`/agent/run/${id}`),

  listRuns: (limit = 20) => request<AgentRun[]>(`/agent/runs?limit=${limit}`),

  getLogs: (runId: string) => request<Log[]>(`/agent/run/${runId}/logs`),

  /**
   * Stream agent events via SSE
   */
  streamRun: (goal: string, onEvent: (event: AgentEvent) => void): (() => void) => {
    const abortController = new AbortController();

    fetch(`${API_BASE}/agent/run/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal }),
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Stream failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6)) as AgentEvent;
                onEvent(event);
              } catch {
                console.warn('Failed to parse SSE event:', line);
              }
            }
          }
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Stream error:', error);
          onEvent({
            type: 'error',
            runId: '',
            timestamp: new Date().toISOString(),
            data: { message: error.message },
          });
        }
      });

    return () => abortController.abort();
  },
};

// ============================================================================
// WALLET API
// ============================================================================

export const walletApi = {
  getInfo: () => request<WalletInfo>('/wallet'),

  getBalance: () => request<{ balance: number; currency: string }>('/wallet/balance'),

  listTransactions: (runId?: string) => {
    const params = runId ? `?runId=${runId}` : '';
    return request<Transaction[]>(`/wallet/transactions${params}`);
  },

  getTransaction: (txHash: string) => request<Transaction>(`/wallet/transactions/${txHash}`),
};

// ============================================================================
// MEMORIES API
// ============================================================================

export interface MemoryListItem {
  _id: string;
  text: string;
  metadata: Record<string, unknown>;
  source: string;
  createdAt: string;
  embeddingDimensions: number;
}

export interface SearchResult {
  query: string;
  results: RetrievedMemory[];
  model: string;
}

export const memoriesApi = {
  list: (limit = 50) => request<MemoryListItem[]>(`/memories?limit=${limit}`),

  create: (text: string, metadata?: Record<string, unknown>) =>
    request<MemoryListItem>('/memories', {
      method: 'POST',
      body: JSON.stringify({ text, metadata }),
    }),

  search: (query: string, limit = 5) =>
    request<SearchResult>('/memories/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    }),

  getCount: () => request<{ count: number }>('/memories/count'),
};

// ============================================================================
// ENTITLEMENTS API
// ============================================================================

export interface EntitlementWithStatus extends Entitlement {
  isExpired: boolean;
  timeRemaining: number;
}

export interface EntitlementStatus {
  [key: string]: {
    active: boolean;
    expiresAt?: string;
  };
}

export const entitlementsApi = {
  list: (runId?: string) => {
    const params = runId ? `?runId=${runId}` : '';
    return request<EntitlementWithStatus[]>(`/entitlements${params}`);
  },

  getStatus: () => request<EntitlementStatus>('/entitlements/status'),

  getPrices: () => request<Record<PaywallService, number>>('/entitlements/prices'),

  subscribe: (runId: string, service: PaywallService) =>
    request<{ success: boolean; txHash: string; entitlement: Entitlement; explorerUrl: string }>(
      `/entitlements/subscribe/${service}`,
      {
        method: 'POST',
        body: JSON.stringify({ runId }),
      }
    ),
};

// ============================================================================
// PROJECTS API
// ============================================================================

export const projectsApi = {
  list: (runId?: string) => {
    const params = runId ? `?runId=${runId}` : '';
    return request<Project[]>(`/projects${params}`);
  },

  get: (id: string) => request<Project>(`/projects/${id}`),
};

// ============================================================================
// HEALTH API
// ============================================================================

export const healthApi = {
  check: () =>
    request<{
      status: string;
      timestamp: string;
      services: Record<string, string>;
    }>('/health'),
};
