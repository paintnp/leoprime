import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import type {
  AgentRun,
  Memory,
  Transaction,
  Entitlement,
  Log,
  Project,
  RetrievedMemory,
} from '@shared/types/index.js';

// ============================================================================
// MONGODB SERVICE - Single Source of Truth
// ============================================================================

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  // Collection accessors
  private get agentRuns(): Collection<AgentRun> {
    this.ensureConnected();
    return this.db!.collection<AgentRun>('agent_runs');
  }

  private get memories(): Collection<Memory> {
    this.ensureConnected();
    return this.db!.collection<Memory>('memories');
  }

  private get transactions(): Collection<Transaction> {
    this.ensureConnected();
    return this.db!.collection<Transaction>('transactions');
  }

  private get entitlements(): Collection<Entitlement> {
    this.ensureConnected();
    return this.db!.collection<Entitlement>('entitlements');
  }

  private get logs(): Collection<Log> {
    this.ensureConnected();
    return this.db!.collection<Log>('logs');
  }

  private get projects(): Collection<Project> {
    this.ensureConnected();
    return this.db!.collection<Project>('projects');
  }

  private ensureConnected(): void {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
  }

  // ============================================================================
  // CONNECTION
  // ============================================================================

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[MongoDB] Already connected');
      return;
    }

    const uri = process.env.MONGODB_ATLAS_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri) {
      throw new Error('MONGODB_ATLAS_URI environment variable is required');
    }
    if (!dbName) {
      throw new Error('MONGODB_DB_NAME environment variable is required');
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      console.log(`[MongoDB] Connected to ${dbName}`);

      // Create indexes
      await this.createIndexes();
    } catch (error) {
      console.error('[MongoDB] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('[MongoDB] Disconnected');
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Agent runs indexes
      await this.agentRuns.createIndex({ status: 1 });
      await this.agentRuns.createIndex({ createdAt: -1 });

      // Memories - regular index (vector index must be created via Atlas UI/API)
      await this.memories.createIndex({ createdAt: -1 });
      await this.memories.createIndex({ source: 1 });

      // Transactions indexes
      await this.transactions.createIndex({ runId: 1 });
      await this.transactions.createIndex({ txHash: 1 }, { unique: true });

      // Entitlements indexes
      await this.entitlements.createIndex({ runId: 1 });
      await this.entitlements.createIndex({ service: 1, isActive: 1 });

      // Logs indexes
      await this.logs.createIndex({ runId: 1, timestamp: -1 });

      // Projects indexes
      await this.projects.createIndex({ runId: 1 });

      console.log('[MongoDB] Indexes created');
    } catch (error) {
      console.warn('[MongoDB] Some indexes may already exist:', error);
    }
  }

  // ============================================================================
  // AGENT RUNS
  // ============================================================================

  async createRun(goal: string): Promise<AgentRun> {
    const now = new Date();
    const run: AgentRun = {
      _id: new ObjectId().toString(),
      status: 'pending',
      goal,
      startedAt: now,
      currentState: 'THINK',
      stateHistory: [{ state: 'THINK', timestamp: now }],
      totalCost: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.agentRuns.insertOne(run as any);
    return run;
  }

  async getRun(id: string): Promise<AgentRun | null> {
    return this.agentRuns.findOne({ _id: id } as any) as any;
  }

  async updateRunState(
    id: string,
    state: AgentRun['currentState'],
    payload?: Record<string, unknown>
  ): Promise<void> {
    const now = new Date();
    await this.agentRuns.updateOne(
      { _id: id } as any,
      {
        $set: { currentState: state, updatedAt: now },
        $push: { stateHistory: { state, timestamp: now, payload } as any },
      }
    );
  }

  async completeRun(id: string, artifactId?: string): Promise<void> {
    await this.agentRuns.updateOne(
      { _id: id } as any,
      {
        $set: {
          status: 'completed',
          currentState: 'COMPLETE',
          completedAt: new Date(),
          updatedAt: new Date(),
          ...(artifactId && { artifactId }),
        },
      }
    );
  }

  async failRun(id: string, error: string): Promise<void> {
    await this.agentRuns.updateOne(
      { _id: id } as any,
      {
        $set: {
          status: 'failed',
          currentState: 'ERROR',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
        $push: {
          stateHistory: {
            state: 'ERROR',
            timestamp: new Date(),
            payload: { error },
          } as any,
        },
      }
    );
  }

  async updateRunCost(id: string, cost: number): Promise<void> {
    await this.agentRuns.updateOne(
      { _id: id } as any,
      {
        $inc: { totalCost: cost },
        $set: { updatedAt: new Date() },
      }
    );
  }

  async listRuns(limit = 20): Promise<AgentRun[]> {
    return this.agentRuns.find().sort({ createdAt: -1 }).limit(limit).toArray() as any;
  }

  async setRunStatus(id: string, status: AgentRun['status']): Promise<void> {
    await this.agentRuns.updateOne(
      { _id: id } as any,
      { $set: { status, updatedAt: new Date() } }
    );
  }

  // ============================================================================
  // MEMORIES (Vector Search)
  // ============================================================================

  async createMemory(text: string, embedding: number[], metadata: Memory['metadata'], source: string): Promise<Memory> {
    const memory: Memory = {
      _id: new ObjectId().toString(),
      text,
      embedding,
      metadata,
      source,
      createdAt: new Date(),
    };

    await this.memories.insertOne(memory as any);
    return memory;
  }

  async searchMemories(queryEmbedding: number[], limit = 5): Promise<RetrievedMemory[]> {
    // MongoDB Atlas Vector Search aggregation pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: 'memories_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
        },
      },
      {
        $project: {
          _id: 1,
          text: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    try {
      const results = await this.memories.aggregate(pipeline).toArray();
      return results.map((doc: any) => ({
        id: doc._id.toString(),
        text: doc.text,
        score: doc.score,
        metadata: doc.metadata,
      }));
    } catch (error: any) {
      // If vector search index doesn't exist, fall back to returning empty array
      if (error.message?.includes('index') || error.codeName === 'InvalidPipelineOperator') {
        console.warn('[MongoDB] Vector search index not found. Run the seed script to create it.');
        return [];
      }
      throw error;
    }
  }

  async listMemories(limit = 50): Promise<Memory[]> {
    return this.memories.find().sort({ createdAt: -1 }).limit(limit).toArray() as any;
  }

  async getMemoryCount(): Promise<number> {
    return this.memories.countDocuments();
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async createTransaction(data: Omit<Transaction, '_id' | 'createdAt'>): Promise<Transaction> {
    const tx: Transaction = {
      _id: new ObjectId().toString(),
      ...data,
      createdAt: new Date(),
    };

    await this.transactions.insertOne(tx as any);
    return tx;
  }

  async updateTransactionStatus(txHash: string, status: Transaction['status']): Promise<void> {
    const update: any = { $set: { status } };
    if (status === 'confirmed') {
      update.$set.confirmedAt = new Date();
    }
    await this.transactions.updateOne({ txHash } as any, update);
  }

  async getTransactionByHash(txHash: string): Promise<Transaction | null> {
    return this.transactions.findOne({ txHash } as any) as any;
  }

  async listTransactions(runId?: string): Promise<Transaction[]> {
    const filter = runId ? { runId } : {};
    return this.transactions.find(filter as any).sort({ createdAt: -1 }).toArray() as any;
  }

  // ============================================================================
  // ENTITLEMENTS
  // ============================================================================

  async createEntitlement(data: Omit<Entitlement, '_id' | 'createdAt'>): Promise<Entitlement> {
    const entitlement: Entitlement = {
      _id: new ObjectId().toString(),
      ...data,
      createdAt: new Date(),
    };

    await this.entitlements.insertOne(entitlement as any);
    return entitlement;
  }

  async getActiveEntitlement(service: Entitlement['service']): Promise<Entitlement | null> {
    return this.entitlements.findOne({
      service,
      isActive: true,
      expiresAt: { $gt: new Date() },
    } as any) as any;
  }

  async listEntitlements(runId?: string): Promise<Entitlement[]> {
    const filter = runId ? { runId } : {};
    return this.entitlements.find(filter as any).sort({ createdAt: -1 }).toArray() as any;
  }

  async deactivateEntitlement(id: string): Promise<void> {
    await this.entitlements.updateOne({ _id: id } as any, { $set: { isActive: false } });
  }

  // ============================================================================
  // LOGS
  // ============================================================================

  async createLog(data: Omit<Log, '_id' | 'timestamp'>): Promise<Log> {
    const log: Log = {
      _id: new ObjectId().toString(),
      ...data,
      timestamp: new Date(),
    };

    await this.logs.insertOne(log as any);
    return log;
  }

  async listLogs(runId: string): Promise<Log[]> {
    return this.logs.find({ runId } as any).sort({ timestamp: 1 }).toArray() as any;
  }

  // ============================================================================
  // PROJECTS
  // ============================================================================

  async createProject(data: Omit<Project, '_id' | 'createdAt'>): Promise<Project> {
    const project: Project = {
      _id: new ObjectId().toString(),
      ...data,
      createdAt: new Date(),
    };

    await this.projects.insertOne(project as any);
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projects.findOne({ _id: id } as any) as any;
  }

  async listProjects(runId?: string): Promise<Project[]> {
    const filter = runId ? { runId } : {};
    return this.projects.find(filter as any).sort({ createdAt: -1 }).toArray() as any;
  }
}

// Export singleton instance
export const mongodb = new MongoDBService();
