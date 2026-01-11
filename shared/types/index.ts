// Agent State Machine
export const AGENT_STATES = [
  'THINK',
  'RETRIEVE',
  'DECIDE',
  'PAY',
  'VERIFY',
  'UNLOCK',
  'BUILD',
  'COMPLETE',
  'ERROR',
] as const;

export type AgentState = (typeof AGENT_STATES)[number];

// Run Status
export const RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

// Transaction Status
export const TX_STATUSES = ['pending', 'confirmed', 'failed'] as const;
export type TxStatus = (typeof TX_STATUSES)[number];

// Paywalled Services
export const PAYWALL_SERVICES = ['voyage', 'mongodb', 'cdp'] as const;
export type PaywallService = (typeof PAYWALL_SERVICES)[number];

// ============================================================================
// DATABASE DOCUMENT TYPES (MongoDB)
// ============================================================================

export interface AgentRun {
  _id: string;
  status: RunStatus;
  goal: string;
  startedAt: Date;
  completedAt?: Date;
  currentState: AgentState;
  stateHistory: StateHistoryEntry[];
  artifactId?: string;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateHistoryEntry {
  state: AgentState;
  timestamp: Date;
  duration?: number;
  payload?: Record<string, unknown>;
}

export interface Memory {
  _id: string;
  text: string;
  embedding: number[];
  metadata: MemoryMetadata;
  source: string;
  createdAt: Date;
}

export interface MemoryMetadata {
  type?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Transaction {
  _id: string;
  runId: string;
  txHash: string;
  amount: number;
  currency: string;
  recipient: string;
  purpose: string;
  status: TxStatus;
  createdAt: Date;
  confirmedAt?: Date;
  explorerUrl?: string;
}

export interface Entitlement {
  _id: string;
  runId: string;
  txId: string;
  service: PaywallService;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface Log {
  _id: string;
  runId: string;
  state: AgentState;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  payload?: Record<string, unknown>;
  timestamp: Date;
}

export interface Project {
  _id: string;
  runId: string;
  name: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// SSE EVENT TYPES
// ============================================================================

export interface AgentEvent {
  type: 'state_change' | 'log' | 'memory_retrieved' | 'payment' | 'entitlement' | 'artifact' | 'error' | 'complete' | 'run_started';
  runId: string;
  timestamp: string;
  data: unknown;
}

export interface StateChangeEvent {
  type: 'state_change';
  runId: string;
  timestamp: string;
  data: {
    previousState: AgentState | null;
    currentState: AgentState;
    payload?: Record<string, unknown>;
  };
}

export interface MemoryRetrievedEvent {
  type: 'memory_retrieved';
  runId: string;
  timestamp: string;
  data: {
    query: string;
    memories: RetrievedMemory[];
  };
}

export interface RetrievedMemory {
  id: string;
  text: string;
  score: number;
  metadata: MemoryMetadata;
}

export interface PaymentEvent {
  type: 'payment';
  runId: string;
  timestamp: string;
  data: {
    txHash: string;
    amount: number;
    currency: string;
    purpose: string;
    status: TxStatus;
    explorerUrl: string;
  };
}

export interface EntitlementEvent {
  type: 'entitlement';
  runId: string;
  timestamp: string;
  data: {
    service: PaywallService;
    isActive: boolean;
    expiresAt: string;
  };
}

export interface ArtifactEvent {
  type: 'artifact';
  runId: string;
  timestamp: string;
  data: {
    projectId: string;
    name: string;
    type: string;
    preview: string;
  };
}

// ============================================================================
// API TYPES
// ============================================================================

export interface WalletInfo {
  address: string;
  balance: number;
  currency: string;
  network: string;
}

export interface StartRunRequest {
  goal: string;
}

export interface StartRunResponse {
  runId: string;
  status: RunStatus;
}

export interface PaywallSubscribeRequest {
  runId: string;
  service: PaywallService;
}

export interface PaywallSubscribeResponse {
  txHash: string;
  entitlementToken: string;
  expiresAt: string;
}

// ============================================================================
// FRONTEND STATE TYPES
// ============================================================================

export interface DashboardState {
  currentRun: AgentRun | null;
  wallet: WalletInfo | null;
  entitlements: Entitlement[];
  recentRuns: AgentRun[];
  memories: Memory[];
}

export interface TimelineStep {
  state: AgentState;
  timestamp: Date;
  status: 'pending' | 'active' | 'completed' | 'error';
  payload?: Record<string, unknown>;
  duration?: number;
}
