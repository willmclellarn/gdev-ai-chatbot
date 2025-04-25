import { NextResponse } from "next/server";
import { pinecone } from "@/lib/pinecone/pinecone";
import { db } from "@/lib/db";
import { ragFile } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

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
  console.log("🔵 [RAG] Delete vectors route hit");
  try {
    const { documentIds, documentTitle } = await request.json();

    const courseMaterialNamespace = pinecone.namespace("course-material");

    // If documentTitle is provided, delete by title
    if (documentTitle) {
      console.log("🔵 [RAG] Deleting document by title:", documentTitle);

      // Get document details to construct vector IDs
      const documentDetails = await db
        .select({
          vectorId: ragFile.vectorId,
          chunkCount: ragFile.chunkCount,
        })
        .from(ragFile)
        .where(eq(ragFile.name, documentTitle));

      if (documentDetails.length > 0) {
        const { vectorId, chunkCount } = documentDetails[0];

        if (vectorId) {
          // Construct and delete vector IDs
          const vectorIds = Array.from(
            { length: chunkCount },
            (_, i) => `${documentTitle}-chunk-${i}`
          );
          await courseMaterialNamespace.deleteMany(vectorIds);

          // Delete from database
          await db.delete(ragFile).where(eq(ragFile.vectorId, vectorId));
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted document "${documentTitle}" if it existed`,
      });
    }

    // If documentIds are provided, delete by IDs
    if (documentIds && documentIds.length > 0) {
      console.log("🔵 [RAG] Deleting documents by IDs:", documentIds);

      // Delete from Pinecone
      await courseMaterialNamespace.deleteMany(documentIds);

      // Delete from database
      await db.delete(ragFile).where(inArray(ragFile.vectorId, documentIds));

      return NextResponse.json({
        success: true,
        message: `Deleted ${documentIds.length} vectors if they existed`,
      });
    }

    return NextResponse.json(
      { error: "No document IDs or title provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting vectors:", error);
    return NextResponse.json(
      { error: "Failed to delete vectors" },
      { status: 500 }
    );
  }
}
