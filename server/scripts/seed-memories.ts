import 'dotenv/config';
import { mongodb } from '../lib/db/mongodb.js';
import { voyageEmbedding } from '../lib/ai/voyage-embedding.js';

// Sample memories to seed the agent's knowledge base
const SEED_MEMORIES = [
  {
    text: 'LEO Prime is an autonomous AI agent that can acquire tools by paying for them with cryptocurrency. It uses MongoDB Atlas for vector search, Voyage AI for embeddings, OpenAI GPT-5.2 for reasoning, and CDP AgentKit for payments.',
    metadata: { type: 'system', category: 'identity' },
    source: 'seed',
  },
  {
    text: 'To generate code artifacts, the agent needs access to the Voyage embedding service for semantic search and the MongoDB vector database for memory retrieval. These services require payment via USDC on the Base network.',
    metadata: { type: 'capability', category: 'code-generation' },
    source: 'seed',
  },
  {
    text: 'The agent state machine follows this sequence: THINK (analyze goal) → RETRIEVE (search memories) → DECIDE (determine required services) → PAY (execute USDC payment) → VERIFY (confirm transaction) → UNLOCK (activate entitlements) → BUILD (generate artifact) → COMPLETE.',
    metadata: { type: 'process', category: 'state-machine' },
    source: 'seed',
  },
  {
    text: 'Entitlements are time-limited access tokens that unlock specific services. Each entitlement is valid for 24 hours from the time of purchase. The agent must pay again to renew expired entitlements.',
    metadata: { type: 'system', category: 'entitlements' },
    source: 'seed',
  },
  {
    text: 'The wallet address 0x3845Ad4c3226454aCdEb624d091D906938DC1e8C is the agent\'s autonomous wallet on the Base network. It holds USDC tokens that the agent uses to pay for services.',
    metadata: { type: 'system', category: 'wallet' },
    source: 'seed',
  },
  {
    text: 'TypeScript is a strongly typed programming language that builds on JavaScript. Best practices include using strict mode, defining interfaces for data structures, and leveraging union types for state management.',
    metadata: { type: 'knowledge', category: 'programming' },
    source: 'seed',
  },
  {
    text: 'React is a JavaScript library for building user interfaces. Key concepts include components, hooks (useState, useEffect), and the virtual DOM. Framer Motion provides powerful animation capabilities for React applications.',
    metadata: { type: 'knowledge', category: 'frontend' },
    source: 'seed',
  },
  {
    text: 'MongoDB Atlas Vector Search enables semantic search by storing embeddings alongside documents. The $vectorSearch aggregation stage performs approximate nearest neighbor (ANN) search using cosine similarity.',
    metadata: { type: 'knowledge', category: 'database' },
    source: 'seed',
  },
  {
    text: 'The Voyage AI embedding model voyage-3.5 produces 1024-dimensional vectors optimized for retrieval tasks. Use "query" input type for search queries and "document" input type for stored content.',
    metadata: { type: 'knowledge', category: 'embeddings' },
    source: 'seed',
  },
  {
    text: 'CDP AgentKit enables AI agents to perform on-chain transactions autonomously. The SDK supports USDC transfers, token swaps, and smart contract interactions on multiple networks including Base.',
    metadata: { type: 'knowledge', category: 'blockchain' },
    source: 'seed',
  },
];

async function seedMemories() {
  console.log('🌱 Starting memory seeding...\n');

  try {
    // Connect to MongoDB
    await mongodb.connect();
    console.log('✅ Connected to MongoDB\n');

    // Check existing count
    const existingCount = await mongodb.getMemoryCount();
    console.log(`📊 Existing memories: ${existingCount}\n`);

    // Seed each memory
    for (let i = 0; i < SEED_MEMORIES.length; i++) {
      const memory = SEED_MEMORIES[i];
      console.log(`📝 [${i + 1}/${SEED_MEMORIES.length}] Embedding: "${memory.text.substring(0, 50)}..."`);

      try {
        // Generate embedding
        const embedding = await voyageEmbedding.embedDocument(memory.text);
        console.log(`   ✅ Embedding generated (${embedding.length} dimensions)`);

        // Store in MongoDB
        await mongodb.createMemory(memory.text, embedding, memory.metadata, memory.source);
        console.log(`   ✅ Stored in MongoDB\n`);
      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
    }

    // Final count
    const finalCount = await mongodb.getMemoryCount();
    console.log(`\n📊 Final memory count: ${finalCount}`);
    console.log('✅ Seeding complete!\n');

    // Reminder about vector index
    console.log('⚠️  IMPORTANT: You must create a Vector Search index in MongoDB Atlas!');
    console.log('   1. Go to MongoDB Atlas → Your Cluster → Atlas Search');
    console.log('   2. Create a new Search Index with type "Vector Search"');
    console.log('   3. Use this JSON configuration:\n');
    console.log(`{
  "name": "memories_vector_index",
  "type": "vectorSearch",
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 1024,
    "similarity": "cosine"
  }]
}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongodb.disconnect();
  }
}

seedMemories();
