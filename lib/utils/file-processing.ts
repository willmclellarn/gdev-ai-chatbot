'use server';

import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

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
  let text = '';
  let format: 'plain' | 'html' | 'markdown' = 'plain';
  let metadata: ProcessedDocument['metadata'] = [];

  // Read file as ArrayBuffer for both pdfParse and Mammoth
  const arrayBuffer = await file.arrayBuffer();
  // Also store file as base64 so you have the "full file" in the return
  const base64File = arrayBufferToBase64(arrayBuffer);

  try {
    // Handle PDF files
    if (fileType === 'application/pdf') {
      const pdfData = await pdfParse(Buffer.from(arrayBuffer));
      text = pdfData.text;

      // Improved PDF formatting detection
      const lines = text.split('\n');
      text = lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) return line;

        // Detect centered text using multiple heuristics
        const lineLength = line.length;
        const trimmedLength = trimmedLine.length;
        const leadingSpaces = line.length - line.trimStart().length;
        const trailingSpaces = line.length - line.trimEnd().length;

        // Heuristic 1: Text is significantly shorter than line width
        const isShortLine = trimmedLength < lineLength * 0.8;

        // Heuristic 2: Text has roughly equal leading and trailing spaces
        const isBalancedSpacing = Math.abs(leadingSpaces - trailingSpaces) < 3;

        // Heuristic 3: Text is surrounded by significant whitespace
        const hasSignificantWhitespace = leadingSpaces > 2 && trailingSpaces > 2;

        // Heuristic 4: Text appears to be centered based on visual layout
        const isCentered = (isShortLine && isBalancedSpacing) ||
                          (hasSignificantWhitespace && isBalancedSpacing);

        // Detect potential headers (all caps, shorter lines)
        const isHeader = trimmedLength > 0 &&
          trimmedLength < 100 &&
          trimmedLine === trimmedLine.toUpperCase();

        // Detect potential bold text
        const isBold = line.includes('**') ||
          (trimmedLength > 0 && trimmedLine === trimmedLine.toUpperCase());

        metadata.push({
          styles: {
            bold: isBold,
            alignment: isCentered ? 'center' : 'left',
            fontSize: isHeader ? 16 : 12, // Approximate font sizes
          }
        });

        if (isHeader) {
          return `<h2>${trimmedLine}</h2>`;
        } else if (isCentered) {
          return `<p style="text-align: center">${trimmedLine}</p>`;
        } else if (isBold) {
          return `<strong>${trimmedLine}</strong>`;
        }
        return line;
      }).join('\n');

      format = 'html';
    }

    // Handle Microsoft Word documents
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      // First embed the style map
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
        "r[style-name='subscript'] => sub:fresh"
      ].join('\n');

      const embeddedDoc = await mammoth.embedStyleMap(
        { buffer: Buffer.from(arrayBuffer) },
        styleMap
      );

      // Then convert to HTML
      const result = await mammoth.convertToHtml(
        { buffer: embeddedDoc.toBuffer() },
        {
          transformDocument: (document) => {
            document.children.forEach((child: {
              type: string;
              styleName?: string;
              alignment?: string;
              children?: Array<{
                type: string;
                value?: string;
                styleName?: string;
                children?: Array<{
                  type: string;
                  value?: string;
                }>;
              }>;
            }) => {
              if (child.type === 'paragraph') {
                // Handle alignment through the document transformation
                if (child.alignment) {
                  const alignmentStyle = `text-align: ${child.alignment}`;
                  if (child.styleName?.toLowerCase().includes('heading')) {
                    const headingLevel = child.styleName.split(' ')[1];
                    child.styleName = `h${headingLevel}[style='${alignmentStyle}']`;
                  } else if (child.styleName === 'quote') {
                    child.styleName = `blockquote[style='${alignmentStyle}']`;
                  } else {
                    child.styleName = `p[style='${alignmentStyle}']`;
                  }
                }
              }
            });
            return document;
          }
        }
      );

      text = result.value;
      format = 'html';

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
