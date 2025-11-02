/**
 * Embedding Service for Semantic Search
 *
 * Generates vector embeddings for text content to enable
 * semantic similarity search for question generation.
 */

import { OpenAIEmbeddings } from '@langchain/openai'

// Initialize OpenAI embeddings (text-embedding-3-small is cost-effective)
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
})

/**
 * Generate embeddings for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embedding = await embeddings.embedQuery(text)
    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingBatch(
  texts: string[]
): Promise<number[][]> {
  try {
    const embeddingsList = await embeddings.embedDocuments(texts)
    return embeddingsList
  } catch (error) {
    console.error('Error generating embeddings batch:', error)
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Find relevant chunks using vector similarity search
 *
 * Uses PostgreSQL pgvector extension for efficient similarity search
 */
export async function findRelevantChunks(params: {
  query: string
  subject?: string
  examType?: string
  limit?: number
  similarityThreshold?: number
}): Promise<
  Array<{
    id: string
    content: string
    sourceId: string
    similarity: number
  }>
> {
  const {
    query,
    subject,
    examType,
    limit = 3,
    similarityThreshold = 0.7,
  } = params

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Note: This requires pgvector extension to be installed in PostgreSQL
    // Run: CREATE EXTENSION IF NOT EXISTS vector;
    //
    // For now, return empty array (will be implemented with raw SQL query)
    // Example query:
    // ```sql
    // SELECT
    //   sc.id,
    //   sc.content,
    //   sc."sourceId",
    //   1 - (sc.embedding <=> $1::vector) as similarity
    // FROM "source_chunks" sc
    // JOIN "source_materials" sm ON sc."sourceId" = sm.id
    // WHERE sm.subject = $2
    //   AND sm."examType" = $3
    //   AND 1 - (sc.embedding <=> $1::vector) > $4
    // ORDER BY sc.embedding <=> $1::vector
    // LIMIT $5
    // ```

    console.warn(
      'findRelevantChunks not fully implemented - requires pgvector extension'
    )
    return []
  } catch (error) {
    console.error('Error finding relevant chunks:', error)
    throw new Error(
      `Failed to find relevant chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Used for duplicate detection and semantic similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Serialize embedding array to JSON string for database storage
 */
export function serializeEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding)
}

/**
 * Deserialize embedding from JSON string
 */
export function deserializeEmbedding(embeddingStr: string): number[] {
  return JSON.parse(embeddingStr)
}

/**
 * Estimate cost of embedding generation
 * Based on OpenAI text-embedding-3-small pricing: $0.02/1M tokens
 */
export function estimateEmbeddingCost(params: {
  textCount: number
  avgTokensPerText?: number
}): {
  estimatedTokens: number
  estimatedCostUSD: number
} {
  const { textCount, avgTokensPerText = 500 } = params

  const totalTokens = textCount * avgTokensPerText
  const costUSD = (totalTokens / 1_000_000) * 0.02

  return {
    estimatedTokens: totalTokens,
    estimatedCostUSD: costUSD,
  }
}
