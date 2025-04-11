import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
  environment: process.env.PINECONE_ENVIRONMENT || '',
});

export const pinecone = pc.Index("rag-index");
