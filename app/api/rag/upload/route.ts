import { NextResponse } from 'next/server';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PDFParser } from 'pdf-parse';
import { encoding_for_model } from 'tiktoken';
import OpenAI from 'openai';
import { db } from '@/db';
import { documents } from '@/drizzle/schema';

// Initialize Pinecone client
const pinecone = new PineconeClient();
await pinecone.init({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to split text into chunks based on token count
function splitTextIntoChunks(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  const enc = encoding_for_model('text-embedding-ada-002');
  const tokens = enc.encode(text);
  const chunks: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const chunkTokens = tokens.slice(i, i + chunkSize);
    const chunkText = enc.decode(chunkTokens);
    chunks.push(chunkText);

    i += chunkSize - chunkOverlap;
  }

  enc.free();
  return chunks;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chunkSize = Number.parseInt(formData.get('chunkSize') as string);
    const chunkOverlap = Number.parseInt(
      formData.get('chunkOverlap') as string,
    );

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read PDF content
    const buffer = await file.arrayBuffer();
    const pdfData = await PDFParser(Buffer.from(buffer));
    const text = pdfData.text;

    // Split text into chunks
    const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);

    // Store document in Drizzle/Postgres
    const [document] = await db
      .insert(documents)
      .values({
        filename: file.name,
        content: text,
        chunkSize: chunkSize.toString(),
        chunkOverlap: chunkOverlap.toString(),
        totalChunks: chunks.length.toString(),
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
