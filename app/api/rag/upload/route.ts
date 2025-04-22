import { NextResponse } from 'next/server';
import { pinecone } from '@/lib/pinecone/pinecone';
import { embedChunks } from '@/lib/utils/embedding';
import { EmbeddingModel } from '@/lib/ai/models';
import { embeddingModels } from '@/lib/ai/models';

export async function POST(request: Request) {
  console.log('Starting RAG upload process...');

  try {
    console.log('Parsing form data...');
    const formData = await request.formData();
    const chunks = JSON.parse(formData.get('chunks') as string) as string[];
    const embeddingModelId = formData.get('embeddingModel') as string;
    const embeddingModel = embeddingModels.find(m => m.id === embeddingModelId);

    console.log(`Received ${chunks?.length || 0} chunks for processing`);
    console.log(`Selected embedding model: ${embeddingModelId}`);

    if (!chunks || !embeddingModel) {
      console.error('Validation failed:', {
        hasChunks: !!chunks,
        hasValidModel: !!embeddingModel
      });
      return NextResponse.json(
        { error: 'No chunks or invalid embedding model provided' },
        { status: 400 }
      );
    }

    console.log('Generating embeddings...');
    const embeddings = await embedChunks(chunks, embeddingModel);
    console.log(`Successfully generated ${embeddings.embeddings.length} embeddings`);

    console.log('Preparing Pinecone records...');
    const pineconeRecords = chunks.map((chunk, i) => ({
      id: `chunk_${i}`,
      values: embeddings.embeddings[i],
      metadata: { text: chunk }
    }));
    console.log(`Prepared ${pineconeRecords.length} records for upsert`);

    console.log('Upserting records to Pinecone...');
    await pinecone.namespace('course-material').upsert(pineconeRecords);
    console.log('Successfully upserted records to Pinecone');

    return NextResponse.json({
      success: true,
      message: 'Chunks processed successfully',
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error('Error processing chunks:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to process chunks' },
      { status: 500 }
    );
  }
}
