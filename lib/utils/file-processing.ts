"use server";

import mammoth from "mammoth";
import { ChunkingStrategy, splitTextIntoChunks } from "./chunking";

/**
 * Represents a processed document with its extracted content and metadata.
 */
export interface ProcessedDocument {
  text: string; // The extracted text content
  format: "plain" | "html" | "markdown";
  metadata?: {
    styles?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      alignment?: "left" | "center" | "right" | "justify";
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

interface ChunkingOptions {
  strategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keywords?: string;
}

/**
 * Encodes an ArrayBuffer into a base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
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
export async function extractFormattedTextFromFile(
  file: File,
  options?: { makePlainText?: boolean }
): Promise<ProcessedDocument> {
  const fileType = file.type;
  console.log("🔵 File processing details:", {
    fileName: file.name,
    fileType,
    fileSize: file.size,
  });

  let text = "";
  let format: "plain" | "html" | "markdown" = "plain";
  let metadata: ProcessedDocument["metadata"] = [
    {
      styles: {
        fontFamily: file.name.split(".").pop()?.toLowerCase() || "txt",
      },
    },
  ];

  // Read file as ArrayBuffer for both pdfParse and Mammoth
  const arrayBuffer = await file.arrayBuffer();
  // Also store file as base64 so you have the "full file" in the return
  const base64File = arrayBufferToBase64(arrayBuffer);

  try {
    // Handle Microsoft Word documents
    if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
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
      ].join("\n");

      // Convert to HTML without transforms
      const result = await mammoth.convertToHtml(
        { buffer: Buffer.from(arrayBuffer) },
        { styleMap }
      );

      text = result.value;
      format = "html";

      console.log("🔵 HTML result:", text);

      // Enhanced metadata extraction for Google Docs
      if (result.messages) {
        result.messages.forEach((message: any) => {
          if (message.type === "style") {
            const isTitle =
              message.style?.styleName?.toLowerCase().includes("title") ||
              message.style?.styleName?.toLowerCase().includes("heading");

            metadata.push({
              styles: {
                bold: !!message.style?.bold || isTitle,
                italic: !!message.style?.italic,
                underline: !!message.style?.underline,
                alignment:
                  message.style?.alignment || (isTitle ? "center" : undefined),
                fontSize: message.style?.fontSize || (isTitle ? 24 : undefined),
                fontFamily: message.style?.fontFamily,
              },
            });
          }
        });
      }
    }

    // Handle plain text files
    else if (fileType === "text/plain") {
      text = await file.text();
      format = "plain";
    }

    // Handle markdown files
    else if (fileType === "text/markdown") {
      text = await file.text();
      format = "markdown";
    } else {
      throw new Error("Unsupported file type");
    }

    return {
      text,
      format,
      metadata,
      base64File,
    };
  } catch (error) {
    console.error("🔵 Error extracting text from file:", error);
    throw error;
  }
}

export async function extractPlainTextFromFile(file: File): Promise<string> {
  console.log("🔵 Extracting plain text from file:", file.name, file.type);

  try {
    // Handle Microsoft Word documents
    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(arrayBuffer),
      });
      return result.value;
    }

    // Handle plain text files
    if (file.type === "text/plain" || file.type === "text/markdown") {
      return await file.text();
    }

    // For unsupported types, try to get text content if possible
    try {
      const text = await file.text();
      // Basic check if the content looks like binary/gibberish
      const sampleLength = Math.min(100, text.length);
      const sample = text.slice(0, sampleLength);
      const nonPrintableCount = (sample.match(/[^\x20-\x7E]/g) || []).length;

      if (nonPrintableCount / sampleLength > 0.1) {
        throw new Error("Content appears to be binary or non-text");
      }

      return text;
    } catch (e) {
      throw new Error(
        `Unable to extract plain text from file type: ${file.type}`
      );
    }
  } catch (error) {
    console.error("🔵 Error extracting plain text:", error);
    throw error;
  }
}
