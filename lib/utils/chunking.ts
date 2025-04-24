"use server";

import { JSDOM } from "jsdom";
import { ProcessedDocument } from "./file-processing";
import { myProvider } from "@/lib/ai/providers";
import { splitByGeminiGenius } from "./gemini-chunking";
import { CHUNKING_STRATEGIES } from "../constants";

/** Literal-union type that matches any item in the array */
export type ChunkingStrategy = (typeof CHUNKING_STRATEGIES)[number];

export interface ChunkingOptions {
  strategy: ChunkingStrategy;
  chunkSize: number; // For token-based chunking fallback
  chunkOverlap: number; // For token-based chunking fallback
  keywords?: string[]; // Optional keywords for keyword-based chunking
  metadata?: ProcessedDocument["metadata"]; // Optional metadata for preserving formatting
}

function splitByTokens(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push(chunk);
  }

  return chunks;
}

// function splitByKeywords(text: string, keywords: string[]): string[] {
//   if (!keywords || keywords.length === 0) {
//     return [text]; // If no keywords, return the whole text as one chunk
//   }

//   const chunks: string[] = [];
//   let lastIndex = 0;
//   let currentChunk = "";

//   // Create a regex pattern that matches any of the keywords
//   const keywordPattern = new RegExp(
//     keywords.map((k) => `\\b${k}\\b`).join("|"),
//     "gi"
//   );
//   let match;

//   while ((match = keywordPattern.exec(text)) !== null) {
//     const keyword = match[0];
//     const matchIndex = match.index;

//     // Add content before the keyword if it exists
//     if (matchIndex > lastIndex) {
//       currentChunk += text.slice(lastIndex, matchIndex);
//     }

//     // Add the keyword and its surrounding context
//     currentChunk += keyword;
//     lastIndex = matchIndex + keyword.length;

//     // If we have a decent chunk, push it and start a new one
//     if (currentChunk.length > 50) {
//       // arbitrary threshold
//       chunks.push(currentChunk.trim());
//       currentChunk = "";
//     }
//   }

//   // Add any remaining content
//   if (lastIndex < text.length) {
//     currentChunk += text.slice(lastIndex);
//   }
//   if (currentChunk.trim()) {
//     chunks.push(currentChunk.trim());
//   }

//   return chunks.filter((chunk) => chunk.length > 0);
// }

// export async function determineBestStrategy(
//   fileType: string,
//   content: string
// ): Promise<ChunkingStrategy> {
//   // Check file type first
//   switch (fileType.toLowerCase()) {
//     case "md":
//       return "headers"; // Markdown files are best chunked by headers
//     case "html":
//       return "html"; // HTML files should use HTML structure-based chunking
//     case "pdf":
//     case "docx":
//     case "doc":
//       // For these formats, analyze the content to determine the best strategy
//       if (content.includes("# ")) {
//         return "headers"; // If it has markdown headers
//       } else if (
//         content.includes("<h1") ||
//         content.includes("<h2") ||
//         content.includes("<h3")
//       ) {
//         return "html"; // If it has HTML headers
//       } else {
//         return "token"; // Default to token-based for unstructured content
//       }
//     default:
//       return "token"; // Default strategy for unknown file types
//   }
// }

export async function splitTextIntoChunks(
  text: string,
  options: ChunkingOptions
): Promise<{
  chunks: string[];
  strategy: ChunkingStrategy;
  exceededChunkSize?: boolean;
  validation?: {
    isValid: boolean;
    issues: string[];
    chunkPositions: { start: number; end: number }[];
  };
}> {
  const { strategy, chunkSize, chunkOverlap, keywords } = options;

  console.log("🔵 [Chunking] Starting text chunking with options:", {
    requestedStrategy: strategy,
    hasKeywords: !!keywords?.length,
    chunkSize,
  });

  // If strategy is 'auto', determine the best strategy based on file extension
  const effectiveStrategy = strategy === "auto" ? "gemini-genius" : strategy;

  console.log("🔵 [Chunking] Selected strategy:", effectiveStrategy);

  let chunks: string[];
  let exceededChunkSize = false;
  let validation:
    | {
        isValid: boolean;
        issues: string[];
        chunkPositions: { start: number; end: number }[];
      }
    | undefined;

  switch (effectiveStrategy) {
    // case "headers":
    //   console.log("🔵 [Chunking] Using header-based chunking");
    //   chunks = splitByHeaders(text);
    //   break;

    // case "centered":
    //   console.log("🔵 [Chunking] Using centered content chunking");
    //   chunks = splitByTokens(text, chunkSize, chunkOverlap);
    //   break;

    // case "html":
    //   console.log("🔵 [Chunking] Using HTML structure-based chunking");
    //   const htmlResult = improvedSplitByHtmlStructure(text, false);
    //   chunks = htmlResult.chunks;
    //   exceededChunkSize = htmlResult.exceededChunkSize;
    //   break;

    // case "keyword":
    //   console.log(
    //     "🔵 [Chunking] Using keyword-based chunking with keywords:",
    //     keywords
    //   );
    //   chunks = splitByKeywords(text, keywords || []);
    //   break;

    case "gemini-genius":
      console.log("🔵 [Chunking] Using Gemini Genius chunking");
      const result = await splitByGeminiGenius(text);
      if (!result.validation.isValid) {
        console.warn("Chunk validation issues:", result.validation.issues);
      }
      chunks = result.chunks;
      validation = result.validation;
      break;

    case "token":
      console.log("🔵 [Chunking] Using token-based chunking");
      chunks = splitByTokens(text, chunkSize, chunkOverlap);
      break;

    default:
      console.log("🔵 [Chunking] Using token-based chunking as fallback");
      chunks = splitByTokens(text, chunkSize, chunkOverlap);
      break;
  }

  console.log(
    "🔵 [Chunking] Generated",
    chunks.length,
    "chunks using strategy:",
    effectiveStrategy
  );
  if (exceededChunkSize) {
    console.warn("🔵 [Chunking] Some chunks exceeded the maximum allowed size");
  }
  return {
    chunks,
    strategy: effectiveStrategy,
    exceededChunkSize,
    validation,
  };
}
