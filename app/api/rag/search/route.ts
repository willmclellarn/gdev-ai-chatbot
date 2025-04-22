import { NextResponse } from 'next/server';
import { performRAGSearch } from '@/lib/utils/rag';

export async function POST(request: Request) {
  console.log('🔵 [RAG Search] POST request received');
  try {
    const { query, embeddingModel } = await request.json();

    const result = await performRAGSearch(query, embeddingModel);
    console.log('🔵 [RAG Search] Found', result.matches.length, 'matches');

    return NextResponse.json(result);
  } catch (error) {
    console.error('🔵 [RAG Search] Error performing vector search:', error);
    return NextResponse.json(
      { error: 'Failed to perform vector search' },
      { status: 500 },
    );
  }
}
