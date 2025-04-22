import { myProvider } from '@/lib/ai/providers';
import { EmbeddingModel } from "@/lib/ai/models";
import { openai } from '@ai-sdk/openai';

export async function embedChunks(chunks: string[], embeddingModel: EmbeddingModel) {
  const embedder = openai.embedding(embeddingModel.id);

  const embeddingsData = await embedder.doEmbed({
    values: chunks
  });

  return { embeddings: embeddingsData.embeddings }
}
