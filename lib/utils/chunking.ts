'use server';

import { JSDOM } from 'jsdom';

export type ChunkingStrategy = 'token' | 'headers' | 'centered' | 'html' | 'keyword' | 'auto';

export interface ChunkingOptions {
  strategy: ChunkingStrategy;
  chunkSize: number;        // For token-based chunking fallback
  chunkOverlap: number;     // For token-based chunking fallback
  format: 'plain' | 'html' | 'markdown';
  keywords?: string[];      // Optional keywords for keyword-based chunking
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
  chunkSize: number = 300,
  chunkOverlap: number = 0,
  applyTokenFallback: boolean = false
): string[] {
  // Use JSDOM (or Cheerio, etc.) to parse the HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // We will gather chunks by looking at top-level structural and header elements.
  // That includes <section>, <article>, <div>, <main>, <nav>, <aside>, <header>, <footer>
  // and <h1> through <h6> in the top-level or nested inside.
  //
  // The simplest approach:
  // 1. Grab each of these elements as a "block" (outerHTML).
  // 2. If a block is still large (by text content), optionally subdivide.

  // A NodeList of all relevant elements
  const elements = Array.from(
    document.querySelectorAll('section, article, div, main, nav, aside, header, footer, h1, h2, h3, h4, h5, h6')
  );

  const chunks: string[] = [];

  // We'll track the previous node's end offset in the DOM
  // (Although you can also do a simpler approach:
  //  gather text between these major elements as separate chunks if needed.)
  //
  // For each element, we collect its outerHTML as a chunk boundary.
  // The advantage of using outerHTML is that you keep the structure.
  // If you want just text, use textContent.

  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const outer = htmlElement.outerHTML.trim();

    // Optional: if you want the text of each chunk, you could do:
    // const textContent = element.textContent ?? '';

    if (outer.length) {
      // Optionally, do a length check before deciding if it's a final chunk
      if (applyTokenFallback && outer.split(/\s+/).length > chunkSize) {
        // If the chunk is too large, subdivide with token approach
        const subdivided = splitByTokens(outer, chunkSize, chunkOverlap);
        chunks.push(...subdivided);
      } else {
        chunks.push(outer);
      }
    }
  });

  // If there is content in the HTML that's *outside* these structural elements
  // (like raw text or inline tags at the body root), you can optionally capture it:
  //
  // 1. Remove these known elements from the DOM.
  // 2. Grab any leftover text from the body.
  //
  // This is optional but can be useful if you want to ensure everything is chunked.

  return chunks;
}

export function determineBestStrategy(fileType: string, content: string): ChunkingStrategy {
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

export function splitTextIntoChunks(text: string, options: ChunkingOptions): string[] {
  const { strategy, chunkSize, chunkOverlap, format, keywords } = options;

  // If strategy is 'auto', determine the best strategy based on format
  const effectiveStrategy = strategy === 'auto'
    ? determineBestStrategy(format === 'html' ? 'html' : 'txt', text)
    : strategy;

  switch (effectiveStrategy) {
    case 'headers':
      return format === 'html'
        ? splitByHtmlHeaders(text)
        : splitByHeaders(text);

    case 'centered':
      // For now, treat centered content the same as token-based
      return splitByTokens(text, chunkSize, chunkOverlap);

    case 'html':
      // NEW: use improved DOM-based chunking for HTML
      return improvedSplitByHtmlStructure(
        text,
        chunkSize,
        chunkOverlap,
        /* applyTokenFallback = */ true  // or false if you prefer not to subdivide large HTML elements
      );

    case 'keyword':
      return splitByKeywords(text, keywords || []);

    case 'token':
    default:
      return splitByTokens(text, chunkSize, chunkOverlap);
  }
}
