import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/utils/file-processing';

export async function POST(req: NextRequest) {
  console.log('🔵 Processing Word document');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Ensure the file is a Word document
    const isWordDoc = file.name.toLowerCase().endsWith('.docx') ||
                     file.name.toLowerCase().endsWith('.doc');
    if (!isWordDoc) {
      return NextResponse.json(
        { error: 'File must be a Word document (.doc or .docx)' },
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
    console.error('🔵 Error processing Word document:', error);
    return NextResponse.json(
      { error: 'Error processing Word document' },
      { status: 500 }
    );
  }
}
