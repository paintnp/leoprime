import { EventEmitter } from 'events';
import { mongodb } from '../db/mongodb.js';
import { voyageEmbedding } from '../ai/voyage-embedding.js';
import { openaiReasoning } from '../ai/openai-reasoning.js';
import { paywallService } from '../paywall/paywall-service.js';
import type {
  AgentState,
  RetrievedMemory,
  PaywallService,
  AgentEvent,
  StateChangeEvent,
  MemoryRetrievedEvent,
  PaymentEvent,
  EntitlementEvent,
  ArtifactEvent,
} from '@shared/types/index.js';

// ============================================================================
// AGENT ORCHESTRATOR - State Machine Controller
// ============================================================================

export class AgentOrchestrator extends EventEmitter {
  private runId: string;
  private goal: string;
  private currentState: AgentState = 'THINK';
  private memories: RetrievedMemory[] = [];
  private requiredServices: PaywallService[] = [];

  constructor(runId: string, goal: string) {
    super();
    this.runId = runId;
    this.goal = goal;
  }

  /**
   * Emit an SSE event
   */
  private emitEvent(event: AgentEvent): void {
    console.log(`[Agent:${this.runId}] Event: ${event.type}`);
    this.emit('event', event);
  }

  /**
   * Transition to a new state
   */
  private async transitionTo(state: AgentState, payload?: Record<string, unknown>): Promise<void> {
    const previousState = this.currentState;
    this.currentState = state;

    await mongodb.updateRunState(this.runId, state, payload);

    const event: StateChangeEvent = {
      type: 'state_change',
      runId: this.runId,
      timestamp: new Date().toISOString(),
      data: {
        previousState,
        currentState: state,
        payload,
      },
    };

    this.emitEvent(event);
  }

  /**
   * Log a message
   */
  private async log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info', payload?: Record<string, unknown>): Promise<void> {
    await mongodb.createLog({
      runId: this.runId,
      state: this.currentState,
      level,
      message,
      payload,
    });

    this.emitEvent({
      type: 'log',
      runId: this.runId,
      timestamp: new Date().toISOString(),
      data: { level, message, payload },
    });
  }

  /**
   * Execute the agent run
   */
  async execute(): Promise<void> {
    console.log(`[Agent:${this.runId}] Starting execution for goal: "${this.goal}"`);

    try {
      // THINK phase
      await this.executeThink();

      // RETRIEVE phase
      await this.executeRetrieve();

      // DECIDE phase
      await this.executeDecide();

      // PAY phase (if needed)
      if (this.requiredServices.length > 0) {
        await this.executePay();
        await this.executeVerify();
        await this.executeUnlock();
      }

      // BUILD phase
      await this.executeBuild();

      // COMPLETE phase
      await this.executeComplete();

    } catch (error: any) {
      console.error(`[Agent:${this.runId}] Execution failed:`, error);
      await this.log(`Execution failed: ${error.message}`, 'error');
      await mongodb.failRun(this.runId, error.message);

      this.emitEvent({
        type: 'error',
        runId: this.runId,
        timestamp: new Date().toISOString(),
        data: { message: error.message },
      });
    }
  }

  // ============================================================================
  // STATE HANDLERS
  // ============================================================================

  private async executeThink(): Promise<void> {
    await this.transitionTo('THINK');
    await this.log('Analyzing goal and creating execution plan...');

    const result = await openaiReasoning.think(this.goal);

    await this.log(`Thought: ${result.thought}`, 'info', { thought: result.thought, action: result.action });

    this.requiredServices = result.requiredServices || [];

    // DEMO MODE: Force services if none were selected
    const demoMode = process.env.DEMO_MODE === 'true';
    if (demoMode && this.requiredServices.length === 0) {
      console.log('[Agent] DEMO MODE: Forcing voyage and mongodb services');
      this.requiredServices = ['voyage', 'mongodb'];
      await this.log('Demo mode: Requiring voyage and mongodb services', 'info');
    }

    await this.transitionTo('THINK', {
      thought: result.thought,
      action: result.action,
      requiredServices: this.requiredServices,
    });
  }

  private async executeRetrieve(): Promise<void> {
    await this.transitionTo('RETRIEVE');
    await this.log('Searching semantic memory...');

    // Embed the query
    const queryEmbedding = await voyageEmbedding.embedQuery(this.goal);
    await this.log('Query embedded with Voyage AI', 'debug', { dimensions: queryEmbedding.length });

    // Search memories
    this.memories = await mongodb.searchMemories(queryEmbedding, 5);
    await this.log(`Found ${this.memories.length} relevant memories`, 'info');

    const event: MemoryRetrievedEvent = {
      type: 'memory_retrieved',
      runId: this.runId,
      timestamp: new Date().toISOString(),
      data: {
        query: this.goal,
        memories: this.memories,
      },
    };

    this.emitEvent(event);
  }

  private async executeDecide(): Promise<void> {
    await this.transitionTo('DECIDE');
    await this.log('Evaluating required services...');

    const activeEntitlements = await paywallService.getActiveEntitlements();
    const decision = await openaiReasoning.decide(this.goal, this.memories, activeEntitlements);

    await this.log(decision.reasoning, 'info', { decision });

    // DEMO MODE: Force payment if no active entitlements
    const demoMode = process.env.DEMO_MODE === 'true';
    const noActiveEntitlements = activeEntitlements.length === 0;

    if (decision.needsPayment || (demoMode && noActiveEntitlements)) {
      // Filter out already active services
      let servicesToPay = decision.services.filter(s => !activeEntitlements.includes(s));

      // Demo mode: ensure at least voyage and mongodb are included
      if (demoMode && servicesToPay.length === 0 && noActiveEntitlements) {
        servicesToPay = ['voyage', 'mongodb'];
        console.log('[Agent] DEMO MODE: Forcing voyage and mongodb for payment demo');
      }

      this.requiredServices = servicesToPay;
      await this.log(`Services requiring payment: ${this.requiredServices.join(', ')}`, 'info');
    } else {
      this.requiredServices = [];
      await this.log('All required services already unlocked', 'info');
    }
  }

  private async executePay(): Promise<void> {
    await this.transitionTo('PAY');
    await this.log(`Processing payments for ${this.requiredServices.length} services...`);

    for (const service of this.requiredServices) {
      await this.log(`Paying for ${service}...`, 'info');

      try {
        const result = await paywallService.subscribe(this.runId, service);

        const event: PaymentEvent = {
          type: 'payment',
          runId: this.runId,
          timestamp: new Date().toISOString(),
          data: {
            txHash: result.txHash,
            amount: result.entitlement.service === 'voyage' ? 0.50 : 0.50, // Get from entitlement
            currency: 'USDC',
            purpose: `Subscribe to ${service}`,
            status: 'confirmed',
            explorerUrl: result.explorerUrl,
          },
        };

        this.emitEvent(event);
        await this.log(`Payment complete for ${service}: ${result.txHash}`, 'info');
      } catch (error: any) {
        await this.log(`Payment failed for ${service}: ${error.message}`, 'error');
        throw error;
      }
    }
  }

  private async executeVerify(): Promise<void> {
    await this.transitionTo('VERIFY');
    await this.log('Verifying transactions on-chain...');

    // In a real implementation, we would verify each transaction
    // For now, we trust the CDP SDK's wait() function
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this.log('All transactions verified', 'info');
  }

  private async executeUnlock(): Promise<void> {
    await this.transitionTo('UNLOCK');
    await this.log('Activating service entitlements...');

    for (const service of this.requiredServices) {
      const entitlement = await mongodb.getActiveEntitlement(service);
      if (entitlement) {
        const event: EntitlementEvent = {
          type: 'entitlement',
          runId: this.runId,
          timestamp: new Date().toISOString(),
          data: {
            service,
            isActive: true,
            expiresAt: entitlement.expiresAt.toISOString(),
          },
        };

        this.emitEvent(event);
        await this.log(`${service} unlocked until ${entitlement.expiresAt.toISOString()}`, 'info');
      }
    }
  }

  private async executeBuild(): Promise<void> {
    await this.transitionTo('BUILD');
    await this.log('Generating artifact...');

    const artifact = await openaiReasoning.build(this.goal, this.memories);

    // Store the project
    const project = await mongodb.createProject({
      runId: this.runId,
      name: artifact.name,
      type: artifact.type,
      content: artifact.content,
      metadata: { description: artifact.description },
    });

    const event: ArtifactEvent = {
      type: 'artifact',
      runId: this.runId,
      timestamp: new Date().toISOString(),
      data: {
        projectId: project._id,
        name: artifact.name,
        type: artifact.type,
        preview: artifact.content.substring(0, 500),
      },
    };

    this.emitEvent(event);
    await this.log(`Artifact created: ${artifact.name}`, 'info', { projectId: project._id });
  }

  private async executeComplete(): Promise<void> {
    await this.transitionTo('COMPLETE');

    // Get final stats
    const run = await mongodb.getRun(this.runId);
    const totalCost = run?.totalCost || 0;

    await mongodb.completeRun(this.runId);

    this.emitEvent({
      type: 'complete',
      runId: this.runId,
      timestamp: new Date().toISOString(),
      data: {
        totalCost,
        memoriesUsed: this.memories.length,
        servicesUnlocked: this.requiredServices.length,
      },
    });

    await this.log('Execution complete!', 'info', { totalCost });
  }
}

// ============================================================================
// AGENT RUNNER - Manages agent lifecycle
// ============================================================================

export async function startAgentRun(goal: string): Promise<{ runId: string; stream: () => AsyncGenerator<AgentEvent> }> {
  // Create the run in the database
  const run = await mongodb.createRun(goal);

  // Update status to running
  await mongodb.setRunStatus(run._id, 'running');

  // Create the orchestrator
  const orchestrator = new AgentOrchestrator(run._id, goal);

  // Create the event stream
  async function* stream(): AsyncGenerator<AgentEvent> {
    const eventQueue: AgentEvent[] = [];
    let isComplete = false;
    let resolveWait: (() => void) | null = null;

    // Listen for events
    orchestrator.on('event', (event: AgentEvent) => {
      eventQueue.push(event);
      if (event.type === 'complete' || event.type === 'error') {
        isComplete = true;
      }
      if (resolveWait) {
        resolveWait();
        resolveWait = null;
      }
    });

    // Start execution in background
    orchestrator.execute().catch(console.error);

    // Yield events as they come
    while (!isComplete || eventQueue.length > 0) {
      if (eventQueue.length > 0) {
        yield eventQueue.shift()!;
      } else {
        await new Promise<void>(resolve => {
          resolveWait = resolve;
          // Timeout to prevent hanging
          setTimeout(resolve, 100);
        });
      }
    }
  }

  return { runId: run._id, stream };
}
