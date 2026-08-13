import { prisma } from "../../../lib/prisma";
import { getAIProvider } from "../providers/provider-factory";

export interface IngestDocumentInput {
  title: string;
  source: string;
  category?: string;
  content: string;
  approvedBy?: string;
}

export interface RAGSearchResult {
  chunkId: string;
  documentTitle: string;
  category: string;
  content: string;
  score: number;
}

export class RAGService {
  private provider = getAIProvider();

  async ingestDocument({
    title,
    source,
    category = "Clinical Guidelines",
    content,
    approvedBy,
  }: IngestDocumentInput) {
    // 1. Create Document Record
    const doc = await prisma.aIKnowledgeDocument.create({
      data: {
        title,
        source,
        category,
        content,
        approvedBy,
        status: "APPROVED",
      },
    });

    // 2. Chunk Content (approx 500 characters per chunk with overlap)
    const chunkSize = 500;
    const overlap = 100;
    const chunks: string[] = [];

    for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    // 3. Generate Embeddings & Save Chunks
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunkText = chunks[idx];
      const embedding = await this.provider.generateEmbedding(chunkText);

      await prisma.aIKnowledgeChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: idx,
          content: chunkText,
          embeddings: embedding,
        },
      });
    }

    return {
      documentId: doc.id,
      chunksCreated: chunks.length,
    };
  }

  async searchKnowledge(query: string, limit = 4): Promise<RAGSearchResult[]> {
    const queryEmbedding = await this.provider.generateEmbedding(query);

    // Fetch candidate chunks
    const chunks = await prisma.aIKnowledgeChunk.findMany({
      take: 20,
      include: {
        document: {
          select: { title: true, category: true, status: true },
        },
      },
    });

    // Compute Cosine Similarity between query embedding and chunk embeddings
    const scored = chunks.map((chunk) => {
      const sim = this.cosineSimilarity(queryEmbedding, chunk.embeddings);
      return {
        chunkId: chunk.id,
        documentTitle: chunk.document.title,
        category: chunk.document.category,
        content: chunk.content,
        score: sim,
      };
    });

    // Sort by highest similarity
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const ragService = new RAGService();
