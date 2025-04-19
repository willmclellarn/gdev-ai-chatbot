'use server';

import { JSDOM } from 'jsdom';
import { ProcessedDocument } from './file-processing';
import { myProvider } from '@/lib/ai/providers';

export type ChunkingStrategy = 'token' | 'headers' | 'centered' | 'html' | 'keyword' | 'auto';

export interface ChunkingOptions {
  strategy: ChunkingStrategy;
  chunkSize: number;        // For token-based chunking fallback
  chunkOverlap: number;     // For token-based chunking fallback
  format: 'plain' | 'html' | 'markdown';
  fileExtension: string;    // The actual file extension (e.g. 'html', 'md', 'txt')
  keywords?: string[];      // Optional keywords for keyword-based chunking
  metadata?: ProcessedDocument['metadata']; // Optional metadata for preserving formatting
}

// or import cheerio from 'cheerio';

function splitByHeaders(text: string): string[] {
  // Split by markdown headers
  const headerRegex = /^#{1,6}\s+.+$/gm;
  const sections = text.split(headerRegex);
  return sections.filter((section) => section.trim().length > 0);
}

function splitByHtmlHeaders(html: string): string[] {
  // Split by HTML header tags
  const headerRegex = /<h[1-6].*?>.*?<\/h[1-6]>/gi;
  const sections = html.split(headerRegex);
  return sections.filter((section) => section.trim().length > 0);
}

function splitByTokens(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }

  return chunks;
}

function splitByKeywords(text: string, keywords: string[]): string[] {
  if (!keywords || keywords.length === 0) {
    return [text]; // If no keywords, return the whole text as one chunk
  }

  const chunks: string[] = [];
  let lastIndex = 0;
  let currentChunk = '';

  // Create a regex pattern that matches any of the keywords
  const keywordPattern = new RegExp(keywords.map((k) => `\\b${k}\\b`).join('|'), 'gi');
  let match;

  while ((match = keywordPattern.exec(text)) !== null) {
    const keyword = match[0];
    const matchIndex = match.index;

    // Add content before the keyword if it exists
    if (matchIndex > lastIndex) {
      currentChunk += text.slice(lastIndex, matchIndex);
    }

    // Add the keyword and its surrounding context
    currentChunk += keyword;
    lastIndex = matchIndex + keyword.length;

    // If we have a decent chunk, push it and start a new one
    if (currentChunk.length > 50) { // arbitrary threshold
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  }

  // Add any remaining content
  if (lastIndex < text.length) {
    currentChunk += text.slice(lastIndex);
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * -----------------------------------------------
 * Improved HTML-based chunking with DOM parsing
 * -----------------------------------------------
 */
function improvedSplitByHtmlStructure(
  html: string,
  applyTokenFallback: boolean = false
): { chunks: string[], exceededChunkSize: boolean } {
  // Use JSDOM (or Cheerio, etc.) to parse the HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;
  let exceededChunkSize = false;

  // We will gather chunks by looking at top-level structural and header elements.
  // That includes <section>, <article>, <div>, <main>, <nav>, <aside>, <header>, <footer>
  // and <h1> through <h6> in the top-level or nested inside.
  const elements = Array.from(
    document.querySelectorAll('section, article, div, main, nav, aside, header, footer, h1, h2, h3, h4, h5, h6')
  );

  console.log('🔵 [Chunking] Found', elements.length, 'elements to chunk');

  const chunks: string[] = [];

  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const outer = htmlElement.outerHTML.trim();

    if (outer.length) {
      const tokenCount = outer.split(/\s+/).length;
      if (tokenCount > getMaxChunkSize()) {
        exceededChunkSize = true;
        if (applyTokenFallback) {
          // If the chunk is too large, subdivide with token approach
          const subdivided = splitByTokens(outer, getMaxChunkSize(), getMaxChunkOverlap());
          chunks.push(...subdivided);
        } else {
          // If not applying token fallback, just add the large chunk with a warning
          console.warn('🔵 [Chunking] Chunk size exceeded:', {
            tokenCount,
            maxAllowed: getMaxChunkSize(),
            element: element.tagName
          });
          chunks.push(outer);
        }
      } else {
        chunks.push(outer);
      }
    }
  });

  // Handle text content outside of structural elements
  const bodyText = document.body.textContent?.trim();
  if (bodyText && bodyText.length > 0) {
    const textChunks = splitByTokens(bodyText, getMaxChunkSize(), getMaxChunkOverlap());
    chunks.push(...textChunks);
  }

  // If no chunks were created, fall back to token-based chunking of the entire HTML
  if (chunks.length === 0) {
    const fallbackChunks = splitByTokens(html, getMaxChunkSize(), getMaxChunkOverlap());
    return { chunks: fallbackChunks, exceededChunkSize };
  }

  return { chunks, exceededChunkSize };
}

function getMaxChunkSize(): number {
  // Get the current embedding model from the provider
  const currentModel = myProvider.textEmbeddingModel('small-model').modelId;

  // Define token limits for different models
  const modelTokenLimits: Record<string, number> = {
    'text-embedding-3-small': 8192,
    'text-embedding-3-large': 8192,
    'text-embedding-ada-002': 8192,
  };

  // Get the token limit for the current model, defaulting to 8192 if unknown
  const tokenLimit = modelTokenLimits[currentModel] || 8192;

  // Return 50% of the token limit
  return Math.floor(tokenLimit * 0.5);
}

function getMaxChunkOverlap(): number {
  return 200;
}

export async function determineBestStrategy(fileType: string, content: string): Promise<ChunkingStrategy> {
  // Check file type first
  switch (fileType.toLowerCase()) {
    case 'md':
      return 'headers'; // Markdown files are best chunked by headers
    case 'html':
      return 'html'; // HTML files should use HTML structure-based chunking
    case 'pdf':
    case 'docx':
    case 'doc':
      // For these formats, analyze the content to determine the best strategy
      if (content.includes('# ')) {
        return 'headers'; // If it has markdown headers
      } else if (content.includes('<h1') || content.includes('<h2') || content.includes('<h3')) {
        return 'html'; // If it has HTML headers
      } else {
        return 'token'; // Default to token-based for unstructured content
      }
    default:
      return 'token'; // Default strategy for unknown file types
  }
}

export async function splitTextIntoChunks(text: string, options: ChunkingOptions): Promise<{ chunks: string[], strategy: ChunkingStrategy, exceededChunkSize?: boolean }> {
  const { strategy, chunkSize, chunkOverlap, format, fileExtension, keywords } = options;

  console.log('🔵 [Chunking] Starting text chunking with options:', {
    requestedStrategy: strategy,
    fileExtension,
    format,
    hasKeywords: !!keywords?.length,
    chunkSize
  });

  // If strategy is 'auto', determine the best strategy based on file extension
  const effectiveStrategy = strategy === 'auto'
    ? await determineBestStrategy(fileExtension, text)
    : strategy;

  console.log('🔵 [Chunking] Selected strategy:', effectiveStrategy);

  let chunks: string[];
  let exceededChunkSize = false;

  switch (effectiveStrategy) {
    case 'headers':
      console.log('🔵 [Chunking] Using header-based chunking');
      chunks = format === 'html'
        ? splitByHtmlHeaders(text)
        : splitByHeaders(text);
      break;

    case 'centered':
      console.log('🔵 [Chunking] Using centered content chunking');
      chunks = splitByTokens(text, chunkSize, chunkOverlap);
      break;

    case 'html':
      console.log('🔵 [Chunking] Using HTML structure-based chunking');
      const htmlResult = improvedSplitByHtmlStructure(
        text,
        false
      );
      chunks = htmlResult.chunks;
      exceededChunkSize = htmlResult.exceededChunkSize;
      break;

    case 'keyword':
      console.log('🔵 [Chunking] Using keyword-based chunking with keywords:', keywords);
      chunks = splitByKeywords(text, keywords || []);
      break;

    case 'token':
    default:
      console.log('🔵 [Chunking] Using token-based chunking as fallback');
      chunks = splitByTokens(text, chunkSize, chunkOverlap);
      break;
  }

  console.log('🔵 [Chunking] Generated', chunks.length, 'chunks using strategy:', effectiveStrategy);
  if (exceededChunkSize) {
    console.warn('🔵 [Chunking] Some chunks exceeded the maximum allowed size');
  }
  return { chunks, strategy: effectiveStrategy, exceededChunkSize };
}
