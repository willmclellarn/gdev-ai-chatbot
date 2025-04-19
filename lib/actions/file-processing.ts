'use server';

import { promises as fs } from 'fs';
import { extractTextFromFile } from '../../../lib/utils/file-processing';

export async function processFile(file: File): Promise<{
  text: string;
  format: 'plain' | 'html' | 'markdown';
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file to process
    const tempPath = `/tmp/${Date.now()}-${file.name}`;
    await fs.writeFile(tempPath, buffer);

    const processedDoc = await extractTextFromFile(tempPath);

    // Clean up temp file
    await fs.unlink(tempPath);

    return processedDoc;
  } catch (error) {
    console.error('🔵 Error processing file:', error);
    throw error;
  }
}
