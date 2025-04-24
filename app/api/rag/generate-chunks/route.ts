import { NextRequest, NextResponse } from "next/server";
import { splitTextIntoChunks, ChunkingStrategy } from "@/lib/utils/chunking";

export async function POST(req: NextRequest) {
  try {
    const { text, chunkingStrategy, chunkSize, chunkOverlap, keywords } =
      await req.json();

    // log the chunking details
    console.log("🔵 Chunking details:", {
      text,
      chunkingStrategy,
      chunkSize,
      chunkOverlap,
      keywords,
    });

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const result = await splitTextIntoChunks(text, {
      strategy: chunkingStrategy,
      chunkSize: chunkSize || 1000,
      chunkOverlap: chunkOverlap || 200,
      keywords: keywords
        ? keywords
            .split(",")
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0)
        : [],
      metadata: [],
    });

    const previewText = result.chunks.slice(0, 5).join("\n\n");

    return NextResponse.json({
      chunks: result.chunks,
      previewText,
      strategy: result.strategy,
      validation: result.validation,
    });
  } catch (error) {
    console.error("🔵 Error splitting text:", error);
    return NextResponse.json(
      { error: "Error splitting text" },
      { status: 500 }
    );
  }
}
