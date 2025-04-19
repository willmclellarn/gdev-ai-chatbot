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

    const processedDoc = await extractTextFromFile(file);

    return NextResponse.json(processedDoc);
  } catch (error) {
    console.error('🔵 Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
