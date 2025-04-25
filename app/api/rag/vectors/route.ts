import { NextResponse } from "next/server";
import { pinecone } from "@/lib/pinecone/pinecone";

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
    await courseMaterialNamespace.deleteMany(documentIds);

    return NextResponse.json({
      success: true,
      message: "Documents deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting documents:", error);
    return NextResponse.json(
      { error: "Failed to delete documents" },
      { status: 500 }
    );
  }
}
