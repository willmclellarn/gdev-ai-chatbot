'use server';

import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { readFile } from 'fs/promises';

export interface ProcessedDocument {
  text: string;
  format: 'plain' | 'html' | 'markdown';
}

export async function extractTextFromFile(file: File): Promise<ProcessedDocument> {
  const fileType = file.type;
  let text = '';
  let format: 'plain' | 'html' | 'markdown' = 'plain';

  try {
    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        text += await page.getText();
      }
      format = 'plain';
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               fileType === 'application/msword') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
      format = 'plain';
    } else if (fileType === 'text/plain') {
      text = await file.text();
      format = 'plain';
    } else if (fileType === 'text/markdown') {
      text = await file.text();
      format = 'markdown';
    } else {
      throw new Error('Unsupported file type');
    }

    return { text, format };
  } catch (error) {
    console.error('🔵 Error extracting text from file:', error);
    throw error;
  }
}
