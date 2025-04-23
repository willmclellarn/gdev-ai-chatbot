import { NextRequest, NextResponse } from "next/server";
import { extractFormattedTextFromFile } from "@/lib/utils/file-processing";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure the file is a PDF file
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF file" },
        { status: 400 }
      );
    }

    const processedDoc = await extractFormattedTextFromFile(file);

    return NextResponse.json({
      text: processedDoc.text,
      format: processedDoc.format,
      metadata: processedDoc.metadata,
    });
  } catch (error) {
    console.error("🔵 Error processing PDF file:", error);
    return NextResponse.json(
      { error: "Error processing PDF file" },
      { status: 500 }
    );
  }
}
