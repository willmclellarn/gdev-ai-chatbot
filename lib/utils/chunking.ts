import { encoding_for_model } from 'tiktoken';

export type ChunkingStrategy = 'token' | 'headers' | 'centered';

interface ChunkingOptions {
  strategy: ChunkingStrategy;
  chunkSize?: number;
  chunkOverlap?: number;
}

export function splitTextIntoChunks(
  text: string,
  options: ChunkingOptions
): string[] {
  switch (options.strategy) {
    case 'token':
      return splitByTokens(text, options.chunkSize || 1000, options.chunkOverlap || 200);
    case 'headers':
      return splitByHeaders(text);
    case 'centered':
      return splitByCenteredContent(text);
    default:
      return splitByTokens(text, options.chunkSize || 1000, options.chunkOverlap || 200);
  }
}

function splitByTokens(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const enc = encoding_for_model('text-embedding-ada-002');
  const tokens = enc.encode(text);
  const chunks: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const chunkTokens = tokens.slice(i, i + chunkSize);
    const chunkText = new TextDecoder().decode(enc.decode(chunkTokens));
    chunks.push(chunkText);
    i += chunkSize - chunkOverlap;
  }

  enc.free();
  return chunks;
}

function splitByHeaders(text: string): string[] {
  // Split by markdown headers (h1, h2, h3)
  const headerRegex = /^(#{1,3})\s+(.+)$/gm;
  const chunks: string[] = [];
  let currentChunk = '';
  let lastIndex = 0;

  let match;
  while ((match = headerRegex.exec(text)) !== null) {
    const [fullMatch, hashes, title] = match;
    const headerLevel = hashes.length;
    const currentIndex = match.index;

    // If we have content before this header, add it to the current chunk
    if (currentIndex > lastIndex) {
      currentChunk += text.slice(lastIndex, currentIndex);
    }

    // If we have a chunk and it's not empty, add it to chunks
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    // Start new chunk with the header
    currentChunk = fullMatch + '\n';
    lastIndex = currentIndex + fullMatch.length;
  }

  // Add any remaining content
  if (lastIndex < text.length) {
    currentChunk += text.slice(lastIndex);
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function splitByCenteredContent(text: string): string[] {
  // Split by centered content (typically marked by indentation or special formatting)
  const centeredRegex = /(?:^|\n)(\s{4,}|\t+)(.+?)(?=\n\S|\n$)/gs;
  const chunks: string[] = [];
  let currentChunk = '';
  let lastIndex = 0;

  let match;
  while ((match = centeredRegex.exec(text)) !== null) {
    const [fullMatch, indentation, content] = match;
    const currentIndex = match.index;

    // If we have content before this centered block, add it to the current chunk
    if (currentIndex > lastIndex) {
      currentChunk += text.slice(lastIndex, currentIndex);
    }

    // If we have a chunk and it's not empty, add it to chunks
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    // Start new chunk with the centered content
    currentChunk = content.trim() + '\n';
    lastIndex = currentIndex + fullMatch.length;
  }

  // Add any remaining content
  if (lastIndex < text.length) {
    currentChunk += text.slice(lastIndex);
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
