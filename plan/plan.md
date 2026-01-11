# LEO Prime - Product Plan

## Overview

LEO Prime is an autonomous AI agent that demonstrates self-sovereign tool acquisition. The agent reasons about tasks, searches its memory semantically, identifies when it needs paid tools, autonomously purchases access using cryptocurrency, and unlocks newly acquired capabilities - all while streaming its reasoning and actions to a cinematic "Agent OS" interface.

This is NOT a CRUD app - it's a demonstration of autonomous agent economics with real blockchain payments.

## User Roles

- **Operator**: The human user who initializes and observes the agent. Can trigger demo runs, view agent reasoning, monitor wallet balance, and inspect transaction receipts.
- **Agent (LEO)**: The autonomous AI that reasons, retrieves memories, decides on actions, pays for tools, and builds artifacts.

## Core Entities

| Entity | Fields | Description |
|--------|--------|-------------|
| AgentRun | id (uuid), status (enum), goal (string), startedAt (date), completedAt (date), currentState (enum), stateHistory (array), artifactId (uuid?), totalCost (number) | Tracks a complete agent execution session |
| Memory | id (uuid), text (string), embedding (vector[1024]), metadata (object), createdAt (date), source (string) | Semantic memory with Voyage AI embeddings |
| Transaction | id (uuid), runId (uuid), txHash (string), amount (number), currency (string), recipient (string), purpose (string), status (enum), createdAt (date), confirmedAt (date?) | Blockchain payment receipts |
| Entitlement | id (uuid), runId (uuid), txId (uuid), service (enum), token (string), expiresAt (date), createdAt (date), isActive (boolean) | Access tokens for paywalled services |
| Log | id (uuid), runId (uuid), state (enum), message (string), payload (object?), timestamp (date) | Detailed execution logs |
| Project | id (uuid), runId (uuid), name (string), type (string), content (string), metadata (object), createdAt (date) | Generated artifacts/outputs |

## Agent State Machine

The agent follows this strict state progression:

```
THINK → RETRIEVE → DECIDE → PAY → VERIFY → UNLOCK → BUILD → COMPLETE
```

### State Definitions

1. **THINK**: Analyze the goal, create an execution plan
2. **RETRIEVE**: Embed query with Voyage AI, search MongoDB vector index
3. **DECIDE**: Determine if required tools are locked, explain rationale
4. **PAY**: Execute USDC payment via CDP AgentKit on Base
5. **VERIFY**: Confirm transaction on-chain, store receipt
6. **UNLOCK**: Mint entitlement token, activate service access
7. **BUILD**: Generate the requested artifact (code, spec, etc.)
8. **COMPLETE**: Finalize run, store outputs, report success

Each state transition emits a structured JSON event streamed via SSE.

## Features

### 1. Mission Control
- **User Story**: As an operator, I want to input a goal and trigger an agent run so that I can observe autonomous tool acquisition.
- **Acceptance Criteria**:
  - Text input for agent goal
  - "Run Demo" button to start execution
  - Real-time status indicator (idle/running/complete/error)
  - Ability to cancel running agents

### 2. Agent Timeline (Centerpiece)
- **User Story**: As an operator, I want to see the agent's reasoning streamed in real-time so that I can understand its decision-making process.
- **Acceptance Criteria**:
  - Streaming step cards for each state transition
  - Expandable JSON payloads per step
  - Framer Motion animations (fade-in, slide, glow effects)
  - Visual state machine progression indicator
  - Timestamps on each step

### 3. Wallet & Receipts Panel
- **User Story**: As an operator, I want to monitor the agent's wallet and view transaction receipts so that I can verify real payments occurred.
- **Acceptance Criteria**:
  - Display wallet address (with copy button)
  - Show USDC balance (live updates)
  - Transaction history list
  - Clickable receipts with full transaction details
  - Link to Base block explorer

### 4. Memory Browser
- **User Story**: As an operator, I want to explore the agent's semantic memory so that I can understand what knowledge it retrieves.
- **Acceptance Criteria**:
  - List of retrieved memories with similarity scores
  - Visual similarity bars (using Recharts)
  - Raw text and metadata viewer
  - Search/filter capabilities

### 5. Entitlements Dashboard
- **User Story**: As an operator, I want to see which services the agent has unlocked so that I can track its acquired capabilities.
- **Acceptance Criteria**:
  - Grid of available services (Voyage, MongoDB, CDP)
  - Lock/unlock status indicators
  - Entitlement expiration countdowns
  - Signed token viewer

### 6. Artifact Viewer
- **User Story**: As an operator, I want to view the artifacts the agent creates so that I can see tangible outputs.
- **Acceptance Criteria**:
  - Code syntax highlighting
  - Markdown rendering
  - Download functionality
  - Project metadata display

## User Flows

### 1. Demo Flow (Primary)
```
Landing → Click "Run Demo" → Agent starts THINK →
Streams through states → PAY shows tx confirmation →
UNLOCK shows service activation → BUILD shows artifact →
COMPLETE with summary
```

### 2. Memory Seeding Flow
```
Admin seeds initial memories → Memories embedded with Voyage →
Stored in MongoDB with vectors → Ready for semantic retrieval
```

### 3. Wallet Monitoring Flow
```
Load page → Fetch wallet balance → Display in sidebar →
After payment → Balance updates → Receipt appears in list
```

## Technical Architecture

### Backend Services

1. **MongoDBService**: Connection, CRUD, vector search aggregations
2. **VoyageEmbeddingService**: Text-to-embedding using voyage-3.5
3. **OpenAIReasoningService**: GPT-5.2 via Responses API with streaming
4. **CDPPaymentService**: USDC transfers on Base using AgentKit
5. **PaywallService**: Subscription management, entitlement minting
6. **AgentOrchestrator**: State machine, event emission, SSE streaming

### Database Collections (MongoDB Atlas)

1. **agent_runs**: Execution sessions
2. **memories**: Vector-embedded knowledge base
3. **transactions**: Blockchain payment receipts
4. **entitlements**: Service access tokens
5. **logs**: Detailed execution logs
6. **projects**: Generated artifacts

### Vector Search Index

```javascript
{
  "name": "memories_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [{
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }]
  }
}
```

### API Endpoints

- `POST /api/agent/run` - Start new agent run
- `GET /api/agent/run/:id/stream` - SSE stream for run
- `GET /api/agent/runs` - List all runs
- `GET /api/memories` - List memories
- `POST /api/memories` - Seed new memory
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/transactions` - List transactions
- `GET /api/entitlements` - List entitlements
- `POST /api/paywall/subscribe/:service` - Initiate subscription

### Frontend Routes

- `/` - Main dashboard (Mission Control)
- `/run/:id` - Individual run detail view
- `/memories` - Memory browser
- `/wallet` - Wallet and receipts
- `/entitlements` - Entitlements dashboard

## Technical Considerations

### Real Payments
- All payments use REAL USDC on Base mainnet
- Wallet address: `0x3845Ad4c3226454aCdEb624d091D906938DC1e8C`
- Transaction hashes are stored and verifiable on-chain

### Streaming
- Server-Sent Events (SSE) for real-time state updates
- Each state emits structured JSON events
- Frontend maintains reactive state from stream

### Security
- Wallet secret stored in environment variables
- Paywall tokens signed with HMAC
- API rate limiting
- Input sanitization

### Performance
- Vector search uses MongoDB Atlas indexes
- Embedding batching for large memories
- Connection pooling for database

## UI Design System

### Theme: "Agent OS"
- Dark background (#0a0a0f)
- Accent gradients (cyan → purple)
- Monospace fonts for data
- Glowing borders and shadows
- Terminal/HUD aesthetic

### Key Components
- **StateCard**: Animated step visualization
- **TransactionReceipt**: Expandable payment details
- **MemoryBar**: Similarity score visualization
- **EntitlementBadge**: Lock/unlock indicators
- **WalletWidget**: Balance and address display

### Animations
- State transitions: slide + fade
- Success states: pulse glow
- Payment confirmation: celebration burst
- Error states: shake + red glow
