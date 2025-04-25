import { NextResponse } from "next/server";
import { pinecone } from "@/lib/pinecone/pinecone";
import { embedChunks } from "@/lib/utils/embedding";
import { EmbeddingModel } from "@/lib/ai/models";
import { embeddingModels } from "@/lib/ai/models";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { ragFile } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    console.log("🔵 Starting RAG file upload process...");

    const session = await auth();
    console.log("🔵 Auth check completed");

    if (!session?.user?.id) {
      console.log("🔴 Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    console.log("🔵 Form data received");

    const chunks = JSON.parse(formData.get("chunks") as string) as string[];
    const embeddingModel = formData.get("embeddingModel") as string;
    const documentTitle = formData.get("documentTitle") as string;
    const originalFileName = formData.get("originalFileName") as string;

    console.log("🔵 Extracted form data:", {
      chunksCount: chunks?.length,
      embeddingModel,
      documentTitle,
      originalFileName,
    });

    if (!chunks || !embeddingModel || !documentTitle || !originalFileName) {
      console.log("🔴 Missing required fields:", {
        hasChunks: !!chunks,
        hasEmbeddingModel: !!embeddingModel,
        hasDocumentTitle: !!documentTitle,
        hasOriginalFileName: !!originalFileName,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the embedding model
    const model = embeddingModels.find((m) => m.id === embeddingModel);
    if (!model) {
      console.log("🔴 Invalid embedding model requested:", embeddingModel);
      return NextResponse.json(
        { error: "Invalid embedding model" },
        { status: 400 }
      );
    }
    console.log("🔵 Using embedding model:", model.id);

    // Generate embeddings for chunks
    console.log("🔵 Starting chunk embedding process...");
    const embeddingsResult = await embedChunks(chunks, model);
    const embeddings = embeddingsResult.embeddings;
    console.log(
      "🔵 Successfully generated embeddings for",
      embeddings.length,
      "chunks"
    );

    // Store chunks and embeddings in Pinecone
    console.log("🔵 Preparing to upsert vectors to Pinecone...");
    const courseMaterialNamespace = pinecone.namespace("course-material");
    const vectors = embeddings.map((embedding: number[], i: number) => ({
      id: `${documentTitle}-chunk-${i}`,
      values: embedding,
      metadata: {
        documentTitle,
        originalFileName,
        chunkIndex: i,
        chunkText: chunks[i],
        lastUpdated: new Date().toISOString(),
        chunkCount: chunks.length,
      },
    }));

    console.log("🔵 Upserting", vectors.length, "vectors to Pinecone...");
    const upsertResult = await courseMaterialNamespace.upsert(vectors);
    console.log("✅ Successfully upserted vectors to Pinecone", upsertResult);

    // Save file metadata to database
    console.log("🔵 Saving file metadata to database...");
    const [fileRecord] = await db
      .insert(ragFile)
      .values({
        name: documentTitle,
        path: `pinecone:${documentTitle}`, // Store reference to Pinecone namespace
        type: "text/plain", // Default type for now
        size: 0, // Size not relevant for RAG files
        userId: session.user.id,
        vectorId: documentTitle,
        chunkCount: chunks.length, // Store the number of chunks
      })
      .returning();
    console.log("✅ File metadata saved to database");

    return NextResponse.json({
      vectors: vectors.map((vector) => vector.values),
      documentTitle,
    });
  } catch (error) {
    console.error("🔴 Error in RAG upload process:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
