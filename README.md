# LEO Prime

> An Autonomous Agent That Acquires Its Own Tools

LEO Prime is a demonstration of autonomous agent economics. It reasons about tasks, searches semantic memory, identifies when it needs paid tools, and autonomously purchases access using cryptocurrency - all while streaming its reasoning to a cinematic "Agent OS" interface.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB Atlas (documents + vector search)
- **Embeddings**: Voyage AI (voyage-3.5)
- **Reasoning**: OpenAI GPT-5.2 (Responses API)
- **Payments**: Coinbase Developer Platform (CDP AgentKit)

## Features

- **State Machine**: THINK → RETRIEVE → DECIDE → PAY → VERIFY → UNLOCK → BUILD → COMPLETE
- **Real Payments**: USDC transfers on Base network
- **Vector Search**: MongoDB Atlas with Voyage AI embeddings
- **SSE Streaming**: Real-time event streaming to UI
- **Entitlements**: Time-limited access tokens for services

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas cluster with Vector Search enabled
- Voyage AI API key
- OpenAI API key
- CDP API credentials

### Installation

```bash
# Install dependencies
npm install

# Seed the memory database
npm run seed

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```bash
# MongoDB Atlas
MONGODB_ATLAS_URI=mongodb+srv://...
MONGODB_DB_NAME=leo_agent_db

# Voyage AI
VOYAGE_API_KEY=pa-...
VOYAGE_EMBEDDING_MODEL=voyage-3.5

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2

# CDP AgentKit
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
CDP_WALLET_ADDRESS=0x...
CDP_NETWORK=base
NETWORK_ID=base-mainnet

# Paywall
PAYWALL_SIGNING_SECRET=...
PAYWALL_PRICE_VOYAGE_USDC=0.50
PAYWALL_PRICE_MONGODB_USDC=0.50
PAYWALL_PRICE_CDP_USDC=0.50
```

### MongoDB Vector Search Index

Create a vector search index in MongoDB Atlas:

1. Go to Atlas → Your Cluster → Atlas Search
2. Create a new index with type "Vector Search"
3. Use this configuration:

```json
{
  "name": "memories_vector_index",
  "type": "vectorSearch",
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 1024,
    "similarity": "cosine"
  }]
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/run` | Start a new agent run |
| POST | `/api/agent/run/stream` | Start run with SSE streaming |
| GET | `/api/agent/runs` | List all runs |
| GET | `/api/wallet` | Get wallet info |
| GET | `/api/memories` | List memories |
| POST | `/api/memories` | Create new memory |
| POST | `/api/memories/search` | Semantic search |
| GET | `/api/entitlements` | List entitlements |
| GET | `/api/projects` | List generated artifacts |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌─────────────────┐   │
│  │Mission  │ │ Timeline │ │ Wallet │ │  Entitlements   │   │
│  │Control  │ │ (SSE)    │ │ Panel  │ │     Panel       │   │
│  └─────────┘ └──────────┘ └────────┘ └─────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ SSE Events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express Backend                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Agent Orchestrator                     │  │
│  │  THINK → RETRIEVE → DECIDE → PAY → VERIFY → UNLOCK   │  │
│  │                            ↓                          │  │
│  │                         BUILD → COMPLETE              │  │
│  └───────────────────────────────────────────────────────┘  │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ MongoDB  │   │ Voyage   │   │ OpenAI   │   │   CDP    │
│  Atlas   │   │   AI     │   │ GPT-5.2  │   │ AgentKit │
│ (Vector) │   │(Embed)   │   │(Reason)  │   │ (Pay)    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## License

MIT
