import { NextRequest, NextResponse } from 'next/server';
import { splitTextIntoChunks, ChunkingStrategy } from '@/lib/utils/chunking';
import { extractTextFromFile } from '@/lib/utils/file-processing';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chunkingStrategy = formData.get('chunkingStrategy') as ChunkingStrategy;
    const chunkSize = Number.parseInt(formData.get('chunkSize') as string);
    const chunkOverlap = Number.parseInt(formData.get('chunkOverlap') as string);
    const keywords = formData.get('keywords') as string;
    const limit = Number.parseInt(formData.get('limit') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const processedDoc = await extractTextFromFile(file);

    const result = await splitTextIntoChunks(processedDoc.text, {
      strategy: chunkingStrategy,
      chunkSize: chunkSize || 1000,
      chunkOverlap: chunkOverlap || 200,
      format: processedDoc.format,
      fileExtension: file.name.split('.').pop()?.toLowerCase() || '',
      keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [],
      metadata: processedDoc.metadata,
    });

    const previewText = result.chunks.slice(0, limit).join('\n\n');

    return NextResponse.json({
      chunks: result.chunks,
      previewText,
      strategy: result.strategy
    });
  } catch (error) {
    console.error('🔵 Error splitting text:', error);
    return NextResponse.json(
      { error: 'Error splitting text' },
      { status: 500 }
    );
  }
}
