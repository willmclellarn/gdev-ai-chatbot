import { myProvider } from '@/lib/ai/providers';
import { pinecone } from '@/lib/pinecone/pinecone';
import { openai } from '@ai-sdk/openai';

export interface RAGSearchResult {
  context: string;
  matches: any[];
}

export async function performRAGSearch(query: string, embeddingModel: string): Promise<RAGSearchResult> {
  if (!query) {
    throw new Error('No query provided');
  }

  // Generate embedding for the query using the provider's embedding model
  const embedding = await openai.embedding(embeddingModel).doEmbed({
    values: [query],
  });
  const courseMaterialNamespace = pinecone.namespace("course-material");
  const embeddingValues = Array.from(embedding.embeddings[0].values());

  console.log('Generated embedding:', {
    dimensions: embeddingValues.length, // Ensure this is the correct length
    model: embeddingModel,
    query: query
  });

  const allResults = await courseMaterialNamespace.query({
    vector: embeddingValues,
    topK: 100,
    includeMetadata: true,
  });

  console.log('Raw Pinecone results:', {
    totalMatches: allResults.matches?.length || 0,
    matches: allResults.matches?.map(m => ({
      score: m.score,
      metadata: m.metadata
    }))
  });

  // Perform vector search in Pinecone
  const searchResults = await courseMaterialNamespace.query({
    vector: embeddingValues,
    topK: 3,
    includeMetadata: true,
  });

  // Format the results
  const context = searchResults.matches
    ?.map((match) => (match.metadata as { text: string })?.text)
    .join('\n\n');

  return {
    context,
    matches: searchResults.matches || [],
  };
}
