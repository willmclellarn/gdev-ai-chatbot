import { NextResponse } from 'next/server';
import { splitTextIntoChunks, ChunkingStrategy } from '@/lib/utils/chunking';

export async function POST(request: Request) {
  try {
    const { text, strategy, chunkSize, chunkOverlap, format, keywords } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const chunks = splitTextIntoChunks(text, {
      strategy: strategy as ChunkingStrategy,
      chunkSize,
      chunkOverlap,
      format,
      keywords,
    });

    return NextResponse.json(chunks);
  } catch (error) {
    console.error('🔵 Error splitting text:', error);
    return NextResponse.json(
      { error: 'Failed to split text' },
      { status: 500 }
    );
  }
}
