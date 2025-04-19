import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/utils/file-processing';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Ensure the file is a markdown file
    if (!file.name.toLowerCase().endsWith('.md')) {
      return NextResponse.json(
        { error: 'File must be a markdown (.md) file' },
        { status: 400 }
      );
    }

    const processedDoc = await extractTextFromFile(file);

    return NextResponse.json({
      text: processedDoc.text,
      format: processedDoc.format,
      metadata: processedDoc.metadata
    });
  } catch (error) {
    console.error('🔵 Error processing markdown file:', error);
    return NextResponse.json(
      { error: 'Error processing markdown file' },
      { status: 500 }
    );
  }
}
