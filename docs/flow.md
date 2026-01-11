# LEO Prime - Autonomous Agent Architecture

## Overview

LEO Prime is the **world's first autonomous AI agent that can acquire its own tools** by paying for them with real cryptocurrency. Unlike traditional AI agents that are pre-configured with all their capabilities, LEO Prime starts with nothing but a goal and a crypto wallet, then autonomously:

1. **Analyzes** what capabilities it needs
2. **Pays** for access to those services
3. **Unlocks** the tools
4. **Completes** the task

This represents a fundamental shift in AI agent architecture - from static, pre-provisioned agents to dynamic, self-funding autonomous systems.

---

## The Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **LLM** | GPT-5.2 (OpenAI Responses API) | Reasoning, planning, artifact generation |
| **Embeddings** | Voyage AI (voyage-3.5) | Semantic embedding for memory search |
| **Vector Database** | MongoDB Atlas Vector Search | Store and retrieve memories semantically |
| **Payments** | CDP AgentKit (Coinbase) | Real USDC transactions on Base chain |
| **Frontend** | React + Vite + Tailwind | Real-time dashboard with SSE streaming |
| **Backend** | Express + TypeScript | Orchestration and API endpoints |

---

## The Agent State Machine

LEO Prime follows a deterministic state machine with 8 possible states:

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────┐
│  THINK  │ ──► │ RETRIEVE │ ──► │ DECIDE  │ ──► │ PAY  │
└─────────┘     └──────────┘     └─────────┘     └──────┘
                                                     │
                                                     ▼
┌──────────┐     ┌─────────┐     ┌─────────┐     ┌────────┐
│ COMPLETE │ ◄── │  BUILD  │ ◄── │ UNLOCK  │ ◄── │ VERIFY │
└──────────┘     └─────────┘     └─────────┘     └────────┘

                         ┌─────────┐
                         │  ERROR  │ (can occur from any state)
                         └─────────┘
```

### State Details

#### 1. THINK (Analysis Phase)
- **Purpose**: Analyze the user's goal and create an execution plan
- **AI Model**: GPT-5.2 via OpenAI Responses API
- **Output**: Thought process, action plan, and list of required services

```typescript
// Example output from THINK phase
{
  thought: "To build an email validation function, I need to search for existing patterns in memory and use code generation. I'll need vector search for memory retrieval.",
  action: "Search memories for email validation patterns, then generate TypeScript code",
  requiredServices: ["voyage", "mongodb"]
}
```

#### 2. RETRIEVE (Memory Search)
- **Purpose**: Find relevant memories using semantic search
- **Voyage AI**: Embeds the goal into a 1024-dimensional vector
- **MongoDB Atlas**: Uses `$vectorSearch` to find similar memories

```typescript
// Vector search pipeline
{
  $vectorSearch: {
    index: 'memories_vector_index',
    path: 'embedding',
    queryVector: queryEmbedding,  // 1024 dimensions from Voyage AI
    numCandidates: 50,
    limit: 5
  }
}
```

#### 3. DECIDE (Entitlement Check)
- **Purpose**: Determine which services need to be paid for
- **Logic**: Compares required services against active entitlements
- **AI Model**: GPT-5.2 reasons about what's needed

#### 4. PAY (Cryptocurrency Transaction)
- **Purpose**: Execute real USDC payments on Base chain
- **CDP AgentKit**: Creates and broadcasts transactions
- **Cost**: $0.50 USDC per service subscription

```typescript
// Real payment flow
const transfer = await wallet.createTransfer({
  amount: 0.50,
  assetId: 'usdc',
  destination: PAYWALL_RECIPIENT,
  gasless: true  // Gas-sponsored on Base
});
await transfer.wait();
```

#### 5. VERIFY (On-Chain Confirmation)
- **Purpose**: Wait for transaction confirmation
- **Output**: Verified transaction hash

#### 6. UNLOCK (Entitlement Minting)
- **Purpose**: Create signed JWT tokens granting service access
- **Duration**: 24-hour entitlement period
- **Storage**: Entitlements stored in MongoDB

```typescript
// JWT entitlement token structure
{
  service: "voyage",
  runId: "abc123",
  txId: "def456",
  type: "entitlement",
  exp: timestamp + 24h
}
```

#### 7. BUILD (Artifact Generation)
- **Purpose**: Generate the final output/artifact
- **AI Model**: GPT-5.2 with memory context
- **Output**: Code, specifications, or documents

#### 8. COMPLETE (Success)
- **Purpose**: Mark run as finished, emit final stats
- **Output**: Total cost, memories used, services unlocked

---

## The Paywall System

### Service Catalog

| Service | Price | Purpose |
|---------|-------|---------|
| `voyage` | $0.50 USDC | Semantic embedding for memory search |
| `mongodb` | $0.50 USDC | Vector database for memory storage/retrieval |
| `cdp` | $0.50 USDC | Cryptocurrency payment capabilities |

### Payment Modes

LEO Prime has two payment modes:

1. **Real Payments** (when wallet balance ≥ $0.50):
   - Actual USDC transfer on Base chain
   - Real transaction hash on Basescan
   - Funds sent to paywall recipient address

2. **Simulated Payments** (when wallet balance < $0.50):
   - Fake transaction hash generated
   - No actual funds transferred
   - Entitlements still created (for demo purposes)

```typescript
// Payment mode determination
async shouldUseRealPayments(): Promise<boolean> {
  const balance = await this.getBalance();
  return balance >= 0.50;
}
```

---

## Memory System (Voyage AI + MongoDB Atlas)

### How Memories Work

1. **Document Ingestion**: Text is embedded using Voyage AI's `voyage-3.5` model
2. **Storage**: Embeddings (1024 dimensions) stored in MongoDB with the source text
3. **Retrieval**: User goals are embedded as queries, then vector-searched

### Embedding Flow

```
User Goal: "Build a TypeScript email validator"
                    │
                    ▼
┌───────────────────────────────────────┐
│           Voyage AI (voyage-3.5)       │
│  inputType: 'query' | 'document'      │
│  outputDimension: 1024                │
└───────────────────────────────────────┘
                    │
                    ▼
            [0.123, -0.456, 0.789, ...]  // 1024 floats
                    │
                    ▼
┌───────────────────────────────────────┐
│      MongoDB Atlas Vector Search       │
│  index: 'memories_vector_index'       │
│  cosine similarity search             │
└───────────────────────────────────────┘
                    │
                    ▼
    Top 5 most relevant memories returned
```

### Vector Search Index

The MongoDB Atlas vector search index must be created with this definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

---

## CDP AgentKit Integration

### Wallet Architecture

LEO Prime uses a **server-side custodial wallet** managed by CDP (Coinbase Developer Platform):

- **Network**: Base Mainnet
- **Asset**: USDC (native USDC on Base)
- **Gas**: Gasless transactions (sponsored by Base)

### Wallet Initialization

```typescript
// 1. Configure SDK with API keys
Coinbase.configure({
  apiKeyName: process.env.CDP_API_KEY_ID,
  privateKey: process.env.CDP_API_KEY_SECRET,
});

// 2. Import or create wallet
if (process.env.CDP_WALLET_SEED) {
  wallet = await Wallet.import(JSON.parse(walletSeed));
} else {
  wallet = await Wallet.create({ networkId: 'base-mainnet' });
}
```

### Transaction Flow

```
Agent needs to pay for 'voyage' service
                │
                ▼
┌─────────────────────────────────────┐
│   CDP AgentKit (Coinbase SDK)       │
│   wallet.createTransfer({           │
│     amount: 0.50,                   │
│     assetId: 'usdc',                │
│     destination: recipient,         │
│     gasless: true                   │
│   })                                │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│        Base Mainnet                  │
│   USDC ERC-20 Transfer              │
│   Tx: 0x1234...                     │
└─────────────────────────────────────┘
                │
                ▼
        Entitlement Created
        (24-hour access)
```

---

## Real-Time Event Streaming

The frontend receives live updates via Server-Sent Events (SSE):

### Event Types

| Event Type | Payload | Description |
|------------|---------|-------------|
| `state_change` | `{ previousState, currentState }` | Agent transitioned states |
| `memory_retrieved` | `{ query, memories[] }` | Semantic search completed |
| `payment` | `{ txHash, amount, explorerUrl }` | USDC transfer completed |
| `entitlement` | `{ service, isActive, expiresAt }` | Service unlocked |
| `artifact` | `{ name, type, preview }` | Output generated |
| `complete` | `{ totalCost, memoriesUsed }` | Run finished |
| `error` | `{ message }` | Error occurred |

### SSE Implementation

```typescript
// Server: Stream events as they occur
app.get('/api/agent/run/:runId/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  for await (const event of orchestrator.stream()) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
});

// Client: Consume the stream
const eventSource = new EventSource(`/api/agent/run/${runId}/stream`);
eventSource.onmessage = (e) => {
  const event = JSON.parse(e.data);
  // Update UI based on event type
};
```

---

## What Makes LEO Prime Unique

### The Innovation

Traditional AI agents are configured like this:

```
Human → Provisions tools → Agent → Executes tasks
```

LEO Prime works like this:

```
Human → Gives goal → Agent → Analyzes needs → Pays for tools → Executes
```

### Key Differentiators

1. **Zero Pre-Configuration**: Agent starts with NO tools
2. **Real Economics**: Uses actual cryptocurrency (USDC on Base)
3. **Dynamic Capability Acquisition**: Buys exactly what it needs
4. **Persistent Memory**: Knowledge grows across sessions
5. **On-Chain Auditability**: All payments verifiable on Basescan

### Future Implications

This architecture enables:
- **AI Agent Marketplaces**: Agents can discover and purchase services
- **Autonomous Businesses**: AI that manages its own operating costs
- **Pay-Per-Use AI**: Only pay for capabilities actually used
- **Self-Improving Agents**: Acquire new skills based on task requirements

---

## Demo Flow

When you click "Run Demo" in LEO Prime:

1. **Goal Submitted** → Agent starts in THINK state
2. **THINK** → GPT-5.2 analyzes goal, identifies needed services
3. **RETRIEVE** → Voyage AI embeds query, MongoDB searches memories
4. **DECIDE** → Check which services are already unlocked
5. **PAY** → If services needed, pay $0.50 USDC per service
6. **VERIFY** → Wait for on-chain confirmation
7. **UNLOCK** → Mint JWT entitlement tokens (24h access)
8. **BUILD** → GPT-5.2 generates the requested artifact
9. **COMPLETE** → Display total cost and results

### What You'll See

- **Timeline**: Real-time agent state transitions
- **Wallet Panel**: Current USDC balance, payments made
- **Entitlements Panel**: Services unlocked (voyage, mongodb, cdp)
- **Memory Panel**: Retrieved semantic memories
- **Artifact Panel**: Generated code/document output

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          LEO PRIME                                   │
│                                                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │   React UI  │◄──►│   Express    │◄──►│   Agent Orchestrator    │ │
│  │  (Vite)     │SSE │   Server     │    │   (State Machine)       │ │
│  └─────────────┘    └──────────────┘    └───────────┬─────────────┘ │
│                                                     │               │
│                    ┌────────────────────────────────┼───────────────┤
│                    │                                │               │
│                    ▼                                ▼               │
│  ┌─────────────────────────┐     ┌─────────────────────────────────┐│
│  │      OpenAI GPT-5.2     │     │        Paywall Service          ││
│  │  - THINK (reasoning)    │     │  - Payment processing           ││
│  │  - DECIDE (planning)    │     │  - Entitlement minting          ││
│  │  - BUILD (generation)   │     │  - JWT token issuance           ││
│  └─────────────────────────┘     └──────────────┬──────────────────┘│
│                                                  │                  │
│                    ┌─────────────────────────────┴─────────────┐    │
│                    │                                           │    │
│                    ▼                                           ▼    │
│  ┌─────────────────────────┐     ┌────────────────────────────────┐│
│  │      Voyage AI          │     │      CDP AgentKit              ││
│  │  - voyage-3.5 model     │     │  - Base Mainnet wallet         ││
│  │  - 1024-dim embeddings  │     │  - USDC transfers              ││
│  │  - Query/Document types │     │  - Gasless transactions        ││
│  └─────────────────────────┘     └────────────────────────────────┘│
│                    │                              │                 │
│                    ▼                              ▼                 │
│  ┌─────────────────────────┐     ┌────────────────────────────────┐│
│  │  MongoDB Atlas          │     │      Base Blockchain           ││
│  │  - Vector Search        │     │  - USDC Transfers              ││
│  │  - Memories collection  │     │  - Tx verification             ││
│  │  - Entitlements         │     │  - Basescan explorer           ││
│  └─────────────────────────┘     └────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2

# Voyage AI (Embeddings)
VOYAGE_API_KEY=pa-...
VOYAGE_EMBEDDING_MODEL=voyage-3.5

# MongoDB Atlas
MONGODB_ATLAS_URI=mongodb+srv://...
MONGODB_DB_NAME=leo_prime

# CDP AgentKit (Coinbase)
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SEED={"walletId":"...", "seed":"..."}
NETWORK_ID=base-mainnet

# Paywall Configuration
PAYWALL_SIGNING_SECRET=...
PAYWALL_PRICE_VOYAGE_USDC=0.50
PAYWALL_PRICE_MONGODB_USDC=0.50
PAYWALL_PRICE_CDP_USDC=0.50
```

---

## Conclusion

LEO Prime demonstrates a paradigm shift in AI agent architecture. By giving agents their own wallets and letting them acquire capabilities dynamically, we move toward a future where AI systems are truly autonomous - not just in execution, but in resource management.

The agent doesn't just follow instructions; it **negotiates for resources**, **manages budgets**, and **acquires new skills** when needed. This is the foundation for AI agents that can operate in open economic systems.
