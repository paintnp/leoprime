import OpenAI from 'openai';
import type { RetrievedMemory, PaywallService } from '@shared/types/index.js';

// ============================================================================
// OPENAI REASONING SERVICE (GPT-5.2 via Responses API)
// ============================================================================

export interface ReasoningResult {
  thought: string;
  action?: string;
  requiredServices?: PaywallService[];
  artifactSpec?: ArtifactSpec;
}

export interface ArtifactSpec {
  name: string;
  type: 'code' | 'spec' | 'document';
  description: string;
  content: string;
}

export interface DecisionResult {
  needsPayment: boolean;
  services: PaywallService[];
  reasoning: string;
}

class OpenAIReasoningService {
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    // Use GPT-5.2 as default for Responses API
    this.model = process.env.OPENAI_MODEL || 'gpt-5.2';
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * THINK phase: Analyze the goal and create an execution plan
   */
  async think(goal: string): Promise<ReasoningResult> {
    const client = this.ensureClient();

    console.log(`[OpenAI] THINK: Analyzing goal "${goal.substring(0, 50)}..."`);

    const response = await client.responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content: `You are LEO Prime, an autonomous AI agent that can acquire its own tools by paying for them with cryptocurrency.

Your task is to analyze a user's goal and create an execution plan.

You have access to the following PAYWALLED services (require payment to use):
- voyage: Semantic embedding service for memory search
- mongodb: Vector database for storing and retrieving memories
- cdp: Cryptocurrency payment service for autonomous transactions

Analyze the goal and determine what steps are needed. Be concise but thorough.

Respond in JSON format:
{
  "thought": "Your analysis of the goal and what needs to be done",
  "action": "The first action to take",
  "requiredServices": ["voyage", "mongodb", "cdp"] // services needed for this task
}`,
        },
        {
          role: 'user',
          content: goal,
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const result = JSON.parse(response.output_text);
    console.log(`[OpenAI] THINK complete: ${result.thought?.substring(0, 100) || 'No thought'}...`);

    return {
      thought: result.thought || 'Analyzing the request...',
      action: result.action,
      requiredServices: result.requiredServices || [],
    };
  }

  /**
   * DECIDE phase: Determine if payment is required based on retrieved memories and current entitlements
   */
  async decide(
    goal: string,
    memories: RetrievedMemory[],
    activeEntitlements: PaywallService[]
  ): Promise<DecisionResult> {
    const client = this.ensureClient();

    console.log(`[OpenAI] DECIDE: Evaluating required services`);

    const memoryContext = memories.length > 0
      ? memories.map(m => `- ${m.text} (relevance: ${(m.score * 100).toFixed(1)}%)`).join('\n')
      : 'No relevant memories found.';

    const response = await client.responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content: `You are LEO Prime, an autonomous AI agent.

You are in the DECIDE phase. Based on the user's goal and retrieved memories, determine if you need to pay for any services.

Currently active entitlements (already paid for): ${activeEntitlements.length > 0 ? activeEntitlements.join(', ') : 'NONE'}

Available services that require payment:
- voyage: Required for embedding queries and semantic search
- mongodb: Required for storing and retrieving vector memories
- cdp: Required for making cryptocurrency payments

Respond in JSON format:
{
  "needsPayment": true/false,
  "services": ["voyage", "mongodb"], // services that need to be paid for
  "reasoning": "Explanation of why these services are needed"
}`,
        },
        {
          role: 'user',
          content: `Goal: ${goal}

Retrieved memories:
${memoryContext}`,
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const result = JSON.parse(response.output_text);
    console.log(`[OpenAI] DECIDE complete: needsPayment=${result.needsPayment}`);

    return {
      needsPayment: result.needsPayment ?? false,
      services: result.services || [],
      reasoning: result.reasoning || 'Evaluating service requirements...',
    };
  }

  /**
   * BUILD phase: Generate an artifact based on the goal
   */
  async build(goal: string, memories: RetrievedMemory[]): Promise<ArtifactSpec> {
    const client = this.ensureClient();

    console.log(`[OpenAI] BUILD: Generating artifact for goal`);

    const memoryContext = memories.length > 0
      ? memories.map(m => `- ${m.text}`).join('\n')
      : 'No relevant memories available.';

    const response = await client.responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content: `You are LEO Prime, an autonomous AI agent in the BUILD phase.

Your task is to create a tangible artifact based on the user's goal. This could be:
- Code (TypeScript, Python, etc.)
- A technical specification
- A document or analysis

Use the retrieved memories as context to inform your output.

Respond in JSON format:
{
  "name": "artifact-name",
  "type": "code" | "spec" | "document",
  "description": "What this artifact does",
  "content": "The actual content (code, markdown, etc.)"
}`,
        },
        {
          role: 'user',
          content: `Goal: ${goal}

Relevant context from memory:
${memoryContext}`,
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    });

    const result = JSON.parse(response.output_text);
    console.log(`[OpenAI] BUILD complete: created ${result.type} "${result.name}"`);

    return {
      name: result.name || 'artifact',
      type: result.type || 'document',
      description: result.description || 'Generated artifact',
      content: result.content || '',
    };
  }

  /**
   * Stream a reasoning response (for UI display)
   */
  async *streamReasoning(prompt: string): AsyncGenerator<string, void, unknown> {
    const client = this.ensureClient();

    const stream = await client.responses.create({
      model: this.model,
      input: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        yield event.delta;
      }
    }
  }

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.model;
  }
}

// Export singleton instance
export const openaiReasoning = new OpenAIReasoningService();
