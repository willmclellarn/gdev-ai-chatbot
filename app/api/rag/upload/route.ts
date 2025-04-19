'use server';

import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { document as documentSchema } from '@/lib/db/schema';
import { splitTextIntoChunks, ChunkingStrategy } from '@/lib/utils/chunking';

// Initialize Pinecone client
const pinecone = new Pinecone();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      const pdfData = await pdfParse(Buffer.from(buffer));
      return pdfData.text;

    case 'docx':
    case 'doc':
      const docxResult = await mammoth.extractRawText({ arrayBuffer: buffer });
      return docxResult.value;

    case 'txt':
      return new TextDecoder().decode(buffer).trim();

    case 'md':
      // For markdown files, we want to preserve the formatting and structure
      const markdownText = new TextDecoder().decode(buffer);
      // Preserve markdown syntax while ensuring consistent line endings
      return markdownText
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
        .trim();

    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

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

    // Extract text from the file based on its type
    const text = await extractTextFromFile(file);

    // Split text into chunks using the selected strategy
    const chunks = splitTextIntoChunks(text, {
      strategy: chunkingStrategy,
      chunkSize,
      chunkOverlap,
      format: 'plain',
    });

    // Store document in Drizzle/Postgres
    const [storedDocument] = await db
      .insert(documentSchema)
      .values({
        title: file.name,
        content: text,
        kind: 'rag',
        createdAt: new Date(),
        userId: 'system', // This should be replaced with actual user ID from session
        filename: file.name,
        chunkSize: chunkSize.toString(),
        chunkOverlap: chunkOverlap.toString(),
        totalChunks: chunks.length.toString(),
        chunkingStrategy,
        fileType: file.name.split('.').pop()?.toLowerCase() || '',
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
          id: `${storedDocument.id}-${index}`,
          values: embedding.data[0].embedding,
          metadata: {
            text: chunk,
            source: file.name,
            documentId: storedDocument.id,
            chunkIndex: index,
            chunkingStrategy,
          },
        };
      }),
    );

    // Store vectors in Pinecone
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    await index.upsert(vectors);

    return NextResponse.json({
      message: 'File processed successfully',
      documentId: storedDocument.id,
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
