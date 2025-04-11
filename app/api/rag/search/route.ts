import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';
import { pinecone } from '@/lib/pinecone/pinecone';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      console.log('🔴 No query provided');
      return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    // Generate embedding for the query using the provider's embedding model
    const embedding = await myProvider.textEmbeddingModel('small-model').doEmbed({
      values: [query],
    });

    // Perform vector search in Pinecone
    const searchResults = await pinecone.query({
      vector: Array.from(embedding.embeddings[0].values()),
      topK: 3,
      includeMetadata: true,
    });

    // Format the results
    const context = searchResults.matches
      ?.map((match) => (match.metadata as { text: string })?.text)
      .join('\n\n');

    return NextResponse.json({
      context,
      matches: searchResults.matches,
    });
  } catch (error) {
    console.error('Error performing vector search:', error);
    return NextResponse.json(
      { error: 'Failed to perform vector search' },
      { status: 500 },
    );
  }
}
