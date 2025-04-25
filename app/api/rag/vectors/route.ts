import { NextResponse } from "next/server";
import { pinecone } from "@/lib/pinecone/pinecone";
import { db } from "@/lib/db";
import { ragFile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Get all vectors from the course-material namespace
    const courseMaterialNamespace = pinecone.namespace("course-material");
    const stats = await courseMaterialNamespace.describeIndexStats();

    // Get a sample of vectors to show document titles
    const sampleVectors = await courseMaterialNamespace.query({
      vector: new Array(1536).fill(0), // Using a zero vector to get random results
      topK: 100,
      includeMetadata: true,
    });

    const documents =
      sampleVectors.matches?.map((match) => ({
        id: match.id,
        title: match.metadata?.documentTitle || "Untitled Document",
        lastUpdated: match.metadata?.lastUpdated || new Date().toISOString(),
        chunkCount: match.metadata?.chunkCount || 1,
      })) || [];

    return NextResponse.json({
      totalVectors: stats.totalRecordCount,
      documents,
    });
  } catch (error) {
    console.error("Error fetching indexed documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch indexed documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { documentIds } = await request.json();

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "No document IDs provided" },
        { status: 400 }
      );
    }

    const courseMaterialNamespace = pinecone.namespace("course-material");

    // Get the document details to construct proper vector IDs
    const documentDetails = await db
      .select({
        name: ragFile.name,
        chunkCount: ragFile.chunkCount,
      })
      .from(ragFile)
      .where(eq(ragFile.vectorId, documentIds[0]));

    if (documentDetails.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const documentTitle = documentDetails[0].name;
    const chunkCount = documentDetails[0].chunkCount;

    // Construct vector IDs in the format used during upload
    const vectorIds = Array.from(
      { length: chunkCount },
      (_, i) => `${documentTitle}-chunk-${i}`
    );

    // Delete vectors from Pinecone
    await courseMaterialNamespace.deleteMany(vectorIds);

    // Delete the file record from the database
    await db.delete(ragFile).where(eq(ragFile.vectorId, documentIds[0]));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vectors:", error);
    return NextResponse.json(
      { error: "Failed to delete vectors" },
      { status: 500 }
    );
  }
}
