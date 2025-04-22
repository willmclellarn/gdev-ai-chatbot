import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

export const pinecone = pc.Index("titans-ai");
