'use server';

import mammoth from 'mammoth';

/**
 * Represents a processed document with its extracted content and metadata.
 */
export interface ProcessedDocument {
  text: string;           // The extracted text content
  format: 'plain' | 'html' | 'markdown';
  metadata?: {
    styles?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      alignment?: 'left' | 'center' | 'right' | 'justify';
      fontSize?: number;
      fontFamily?: string;
    };
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
  /** Base64-encoded contents of the original file */
  base64File: string;
}

/**
 * Encodes an ArrayBuffer into a base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Extracts content from various file types while preserving formatting and structure.
 * This function handles multiple document formats including PDF, Word documents (DOCX/DOC),
 * plain text, and markdown files.
 *
 * Returns the extracted text, format, metadata, and a base64 representation of the original file.
 */
export async function extractTextFromFile(file: File): Promise<ProcessedDocument> {
  const fileType = file.type;
  console.log('🔵 File processing details:', {
    fileName: file.name,
    fileType,
    fileSize: file.size
  });

  let text = '';
  let format: 'plain' | 'html' | 'markdown' = 'plain';
  let metadata: ProcessedDocument['metadata'] = [{
    styles: {
      fontFamily: file.name.split('.').pop()?.toLowerCase() || 'txt'
    }
  }];

  // Read file as ArrayBuffer for both pdfParse and Mammoth
  const arrayBuffer = await file.arrayBuffer();
  // Also store file as base64 so you have the "full file" in the return
  const base64File = arrayBufferToBase64(arrayBuffer);

  try {
    // Handle Microsoft Word documents
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      // First embed the style map (no synthetic alignment rules)
      const styleMap = [
        // Base rules
        "p => p:fresh",
        "p[style-name='normal'] => p:fresh",

        // Heading rules
        "p[style-name='heading 1'] => h1:fresh",
        "p[style-name='heading 2'] => h2:fresh",
        "p[style-name='heading 3'] => h3:fresh",

        // Title and subtitle rules
        "p[style-name='title'] => h1:fresh",
        "p[style-name='subtitle'] => h2:fresh",

        // Body text rules
        "p[style-name='body'] => p:fresh",

        // Quote rules
        "p[style-name='quote'] => blockquote:fresh",

        // Text style rules
        "r[style-name='strong'] => strong:fresh",
        "r[style-name='emphasis'] => em:fresh",
        "r[style-name='underline'] => u:fresh",
        "r[style-name='strikethrough'] => del:fresh",
        "r[style-name='superscript'] => sup:fresh",
        "r[style-name='subscript'] => sub:fresh",
      ].join('\n');

      // Convert to HTML without transforms
      const result = await mammoth.convertToHtml(
        { buffer: Buffer.from(arrayBuffer) },
        { styleMap }
      );

      text = result.value;
      format = 'html';

      console.log('🔵 HTML result:', text);

      // Enhanced metadata extraction for Google Docs
      if (result.messages) {
        result.messages.forEach((message: any) => {
          if (message.type === 'style') {
            const isTitle = message.style?.styleName?.toLowerCase().includes('title') ||
                           message.style?.styleName?.toLowerCase().includes('heading');

            metadata.push({
              styles: {
                bold: !!message.style?.bold || isTitle,
                italic: !!message.style?.italic,
                underline: !!message.style?.underline,
                alignment: message.style?.alignment || (isTitle ? 'center' : undefined),
                fontSize: message.style?.fontSize || (isTitle ? 24 : undefined),
                fontFamily: message.style?.fontFamily,
              }
            });
          }
        });
      }
    }

    // Handle plain text files
    else if (fileType === 'text/plain') {
      text = await file.text();
      format = 'plain';
    }

    // Handle markdown files
    else if (fileType === 'text/markdown') {
      text = await file.text();
      format = 'markdown';
    }

    else {
      throw new Error('Unsupported file type');
    }

    return {
      text,
      format,
      metadata,
      base64File
    };
  } catch (error) {
    console.error('🔵 Error extracting text from file:', error);
    throw error;
  }
}
