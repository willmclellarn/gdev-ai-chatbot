'use server';

import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { document } from '@/lib/db/schema';
import { ChunkingStrategy, splitTextIntoChunks } from '@/lib/utils/chunking';

// Initialize Pinecone client
const pinecone = new Pinecone();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chunkSize = Number.parseInt(formData.get('chunkSize') as string);
    const chunkOverlap = Number.parseInt(formData.get('chunkOverlap') as string);
    const chunkingStrategy = formData.get('chunkingStrategy') as ChunkingStrategy;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read PDF content
    const buffer = await file.arrayBuffer();
    const pdfData = await pdfParse(Buffer.from(buffer));
    const text = pdfData.text;

    // Split text into chunks using the selected strategy
    const chunks = splitTextIntoChunks(text, {
      strategy: chunkingStrategy,
      chunkSize,
      chunkOverlap,
    });

    // Store document in Drizzle/Postgres
    const [document] = await db
      .insert(document)
      .values({
        filename: file.name,
        content: text,
        chunkSize: chunkSize.toString(),
        chunkOverlap: chunkOverlap.toString(),
        totalChunks: chunks.length.toString(),
        chunkingStrategy,
      })
      .returning();

    // Generate embeddings and store in Pinecone
    const vectors = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk,
        });

        return {
          id: `${document.id}-${index}`,
          values: embedding.data[0].embedding,
          metadata: {
            text: chunk,
            source: file.name,
            documentId: document.id,
            chunkIndex: index,
            chunkingStrategy,
          },
        };
      }),
    );

    // Store vectors in Pinecone
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    await index.upsert({
      vectors,
    });

    return NextResponse.json({
      message: 'File processed successfully',
      documentId: document.id,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 },
    );
  }
}
