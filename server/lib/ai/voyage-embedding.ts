import { VoyageAIClient } from 'voyageai';

// ============================================================================
// VOYAGE AI EMBEDDING SERVICE
// ============================================================================

class VoyageEmbeddingService {
  private client: VoyageAIClient | null = null;
  private model: string;

  constructor() {
    this.model = process.env.VOYAGE_EMBEDDING_MODEL || 'voyage-3.5';
  }

  private ensureClient(): VoyageAIClient {
    if (!this.client) {
      const apiKey = process.env.VOYAGE_API_KEY;
      if (!apiKey) {
        throw new Error('VOYAGE_API_KEY environment variable is required');
      }
      this.client = new VoyageAIClient({ apiKey });
    }
    return this.client;
  }

  /**
   * Embed a single text string
   */
  async embedText(text: string, inputType: 'query' | 'document' = 'document'): Promise<number[]> {
    const client = this.ensureClient();

    console.log(`[Voyage] Embedding text (${text.length} chars) as ${inputType}`);

    try {
      const response = await client.embed({
        input: [text],
        model: this.model,
        inputType,
        truncation: true,
        outputDimension: 1024, // voyage-3.5 supports 256, 512, 1024, 2048
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from Voyage AI');
      }

      const embedding = response.data[0].embedding;
      if (!embedding) {
        throw new Error('Embedding value is null or undefined');
      }
      console.log(`[Voyage] Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error: any) {
      console.error('[Voyage] Embedding failed:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Embed multiple texts in a batch
   */
  async embedBatch(texts: string[], inputType: 'query' | 'document' = 'document'): Promise<number[][]> {
    const client = this.ensureClient();

    console.log(`[Voyage] Batch embedding ${texts.length} texts as ${inputType}`);

    try {
      const response = await client.embed({
        input: texts,
        model: this.model,
        inputType,
        truncation: true,
        outputDimension: 1024,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from Voyage AI');
      }

      const embeddings = response.data.map((item) => {
        if (!item.embedding) {
          throw new Error('Embedding value is null or undefined');
        }
        return item.embedding;
      });
      console.log(`[Voyage] Generated ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error: any) {
      console.error('[Voyage] Batch embedding failed:', error.message);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Embed a query for semantic search (uses 'query' input type for better retrieval)
   */
  async embedQuery(query: string): Promise<number[]> {
    return this.embedText(query, 'query');
  }

  /**
   * Embed a document for storage (uses 'document' input type)
   */
  async embedDocument(document: string): Promise<number[]> {
    return this.embedText(document, 'document');
  }

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the embedding dimensions
   */
  getDimensions(): number {
    return 1024;
  }
}

// Export singleton instance
export const voyageEmbedding = new VoyageEmbeddingService();
