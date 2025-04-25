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
  try {
    const { documentIds, documentTitle } = await request.json();

    // Validate input - must have either documentIds or documentTitle
    if ((!documentIds || !Array.isArray(documentIds)) && !documentTitle) {
      return NextResponse.json(
        { error: "Must provide either documentIds array or documentTitle" },
        { status: 400 }
      );
    }

    const courseMaterialNamespace = pinecone.namespace("course-material");

    // If documentTitle is provided, find the corresponding document
    if (documentTitle) {
      const documentDetails = await db
        .select({
          vectorId: ragFile.vectorId,
          chunkCount: ragFile.chunkCount,
        })
        .from(ragFile)
        .where(eq(ragFile.name, documentTitle));

      if (documentDetails.length === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      const { vectorId, chunkCount } = documentDetails[0];

      // Ensure vectorId is a string
      if (!vectorId) {
        return NextResponse.json(
          { error: "Invalid document data" },
          { status: 400 }
        );
      }

      // Construct vector IDs for all chunks of this document
      const vectorIds = Array.from(
        { length: chunkCount },
        (_, i) => `${documentTitle}-chunk-${i}`
      );

      // Delete vectors from Pinecone
      await courseMaterialNamespace.deleteMany(vectorIds);

      // Delete the file record from the database
      await db.delete(ragFile).where(eq(ragFile.vectorId, vectorId));

      return NextResponse.json({
        success: true,
        message: `Deleted document "${documentTitle}" and all associated vectors`,
      });
    }

    // If documentIds are provided, handle vector deletion
    if (documentIds && documentIds.length > 0) {
      // Get document details for the first ID to verify it exists
      const documentDetails = await db
        .select({
          name: ragFile.name,
          chunkCount: ragFile.chunkCount,
        })
        .from(ragFile)
        .where(inArray(ragFile.vectorId, documentIds));

      if (documentDetails.length === 0) {
        return NextResponse.json(
          { error: "No matching documents found" },
          { status: 404 }
        );
      }

      // Delete vectors from Pinecone
      await courseMaterialNamespace.deleteMany(documentIds);

      // Delete the file records from the database
      await db.delete(ragFile).where(inArray(ragFile.vectorId, documentIds));

      return NextResponse.json({
        success: true,
        message: `Deleted ${documentIds.length} vectors and associated documents`,
      });
    }

    return NextResponse.json(
      { error: "Invalid request parameters" },
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
