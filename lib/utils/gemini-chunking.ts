import { google } from "@ai-sdk/google";
import { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import fs from "fs";

/**
 * Normalize text for tolerant comparison **without changing string length**,
 * so character indices still map 1‑to‑1 to the original document.
 * - non‑breaking space → regular space
 * - curly single quotes → straight single quote
 * - curly double quotes → straight double quote
 * - en/em dashes → hyphen‑minus
 * - force lower‑case
 */
function normalizeForComparison(str: string): string {
  return str
    .replace(/\u00A0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .toLowerCase();
}

function createChunkingPrompt(documentText: string): string {
  return `# Role: Document Analysis Expert

  You are an expert system specialized in analyzing document structure and identifying distinct conceptual or thematic units within text.

  # Primary Goal:

  Your task is to segment the provided document into logically coherent sections based on the topics or concepts being discussed. After segmenting, you must identify and return the *exact* starting sentence of each identified section.

  # Instructions for Chunking (Semantic Segmentation):

  1.  **Focus on Meaning:** Segment the document based on shifts in topic, sub-topic, or core idea. A new section should begin when the text introduces a new concept, starts discussing a different aspect of the main topic, or makes a significant transition in its argument or narrative.
  2.  **Coherence over Length:** The size of the sections is irrelevant. A section could be a single paragraph or span multiple paragraphs if they all discuss the same core concept. Prioritize semantic coherence.
  3.  **Analyze Transitions:** Pay close attention to transition words/phrases, paragraph breaks, and structural elements (like implied headings or topic sentences) that might signal a shift in focus.
  4.  **Granularity:** Aim for meaningful chunks. Avoid segmenting too finely (e.g., making every sentence its own chunk) unless a single sentence genuinely introduces a completely distinct new idea. Conversely, avoid making chunks so large that they cover multiple disparate topics. Find the natural conceptual boundaries.

  # Instructions for Output (Starting Sentences):

  1.  **Identify Start Sentence:** For *each* logically identified section, determine its very first sentence.
  2.  **Exact Verbatim Copy:** You MUST return the starting sentence *exactly* as it appears in the original document. This includes:
      *   All original wording.
      *   All original punctuation (commas, periods, question marks, etc.).
      *   All original capitalization.
      *   Any leading/trailing whitespace *that is part of the sentence itself* (though typically sentences start directly after a preceding period/space or at the beginning of the document/paragraph).
  3.  **Completeness:** Ensure you capture the *entire* first sentence, up to its concluding punctuation mark (e.g., '.', '?', '!').
  4.  **No Modifications:** Do NOT summarize, paraphrase, shorten, or alter the starting sentence in any way. Do NOT add any introductory text like "Section starts with:".
  5.  **No Omissions:** Do NOT skip any content from the original document when deciding where sections start. Every part of the document should belong to a section. The first section will start with the very first sentence of the document.

  # Output Format:

  Return the identified starting sentences as a JSON list of strings. Each string in the list should be one exact starting sentence.

  Example Output Format:
  [
    "The first sentence of the first logical section.",
    "The exact first sentence of the second logical section.",
    "The precise starting sentence of the third logical section, verbatim.",
    "..."
  ]

  Here is the document content:
  <document>
  ${documentText}
  </document>
  `;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  chunkPositions: { start: number; end: number }[];
}

function extractFirstSentenceAtPosition(
  text: string,
  position: number
): string {
  // Find the next sentence boundary after the position
  const sentenceBoundary = /[.!?]\s+/g;
  let match;
  let lastBoundary = position;

  while ((match = sentenceBoundary.exec(text)) !== null) {
    if (match.index > position) {
      return text.slice(position, match.index + 1).trim();
    }
    lastBoundary = match.index + 1;
  }

  // If no sentence boundary found, return the rest of the text
  return text.slice(position).trim();
}

export function validateChunkBeginningsExist(
  documentText: string,
  chunkBeginnings: string[]
): ValidationResult {
  const issues: string[] = [];
  // Pre‑compute a normalized version of the document for tolerant searches
  const normalizedDocument = normalizeForComparison(documentText);
  let normalizedCurrentPosition = 0;
  const chunkPositions: { start: number; end: number }[] = [];
  let currentPosition = 0;

  for (let i = 0; i < chunkBeginnings.length; i++) {
    const chunkBeginning = chunkBeginnings[i];
    const normalizedChunkBeginning = normalizeForComparison(chunkBeginning);

    // First attempt an exact, case‑sensitive match on the raw text
    let startIndex = documentText.indexOf(chunkBeginning, currentPosition);

    // If not found, attempt a tolerant match on the normalized text
    if (startIndex === -1) {
      startIndex = normalizedDocument.indexOf(
        normalizedChunkBeginning,
        normalizedCurrentPosition
      );
    }

    // If full chunk not found, try reducing it word by word
    if (startIndex === -1) {
      const words = chunkBeginning.split(/\s+/);
      let reducedChunk = chunkBeginning;
      let foundMatch = false;

      // Try removing words from the end until we find a match
      for (let j = words.length - 1; j > 0; j--) {
        reducedChunk = words.slice(0, j).join(" ");
        startIndex = documentText.indexOf(reducedChunk, currentPosition);
        if (startIndex !== -1) {
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // If still no match, try removing words from the beginning
        for (let j = 1; j < words.length; j++) {
          reducedChunk = words.slice(j).join(" ");
          startIndex = documentText.indexOf(reducedChunk, currentPosition);
          if (startIndex !== -1) {
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        const firstSentence = extractFirstSentenceAtPosition(
          documentText,
          currentPosition
        );
        issues.push(
          `<div class="validation-issue">
            <div class="issue-header">Chunk ${i + 1} not found in original document after position ${currentPosition}</div>
            <div class="issue-details">
              <div><strong>Original chunk:</strong> "${chunkBeginning}"</div>
              <div><strong>Next sentence in document:</strong> "${firstSentence}"</div>
              <div><strong>Position:</strong> ${startIndex}</div>
            </div>
          </div>`
        );
        continue;
      }

      // If we found a partial match, get the full sentence at that position
      const fullSentence = extractFirstSentenceAtPosition(
        documentText,
        startIndex
      );
      issues.push(
        `<div class="validation-issue">
          <div class="issue-header">Chunk ${i + 1} partial match found after position ${currentPosition}</div>
          <div class="issue-details">
            <div><strong>Found match:</strong>
              <div class="chunk-content px-2 py-1 rounded-md bg-gray-100">"${reducedChunk}"</div>
            </div>
            <div><strong>Original chunk:</strong>
              <div class="chunk-content px-2 py-1 rounded-md bg-gray-100">"${chunkBeginning}"</div>
            </div>
            <div><strong>Full sentence at match:</strong>
              <div class="chunk-content px-2 py-1 rounded-md bg-gray-100">"${fullSentence}"</div>
            </div>
            <div><strong>Position:</strong> ${startIndex}</div>
          </div>
        </div>`
      );
      continue;
    }

    // Update the current position to after this chunk
    currentPosition = startIndex + chunkBeginning.length;
    normalizedCurrentPosition = startIndex + normalizedChunkBeginning.length;
    const endIndex = currentPosition;

    chunkPositions.push({ start: startIndex, end: endIndex });
  }

  return {
    isValid: issues.length === 0,
    issues,
    chunkPositions,
  };
}

function extractFullChunks(
  documentText: string,
  chunkPositions: { start: number; end: number }[]
): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < chunkPositions.length; i++) {
    const currentChunk = chunkPositions[i];
    const nextChunk = chunkPositions[i + 1];

    // Extract from current chunk's start to either next chunk's start or end of document
    const chunkEnd = nextChunk ? nextChunk.start : documentText.length;
    const chunkContent = documentText.slice(currentChunk.start, chunkEnd);

    chunks.push(chunkContent);
  }

  return chunks;
}

export async function splitByGeminiGenius(
  documentText: string
): Promise<{ chunks: string[]; validation: ValidationResult; status: string }> {
  console.log("💎💎💎 [Chunking] Using Gemini Genius chunking");

  fs.writeFileSync("document.txt", documentText);
  console.log("created document.txt");
  const { object } = await generateObject({
    model: google("gemini-2.5-pro-preview-03-25"),
    prompt: createChunkingPrompt(documentText),
    schema: z.object({
      sections: z.array(
        z.object({
          startContent: z
            .string()
            .describe(
              "The start content should be two sentences maximum of the start of the section word for word, no more than 100 words. This should be exact content from the start of the section, don't exclude anything."
            ),
        })
      ),
    }),
  });

  console.log("created gemini genius object");

  fs.writeFileSync(
    "gemini-genius-object.json",
    JSON.stringify(object, null, 2)
  );

  const chunkBeginnings = object.sections.map(
    (section) => section.startContent
  );
  const validation = validateChunkBeginningsExist(
    documentText,
    chunkBeginnings
  );

  // Extract full chunks using the validated positions
  const fullChunks = validation.isValid
    ? extractFullChunks(documentText, validation.chunkPositions)
    : ["No chunks could be extracted due to validation issues"];

  if (!validation.isValid) {
    console.warn(
      "🔵Gemini Genius Chunking Validation Issues:",
      validation.issues
    );
  }

  return {
    chunks: fullChunks,
    validation,
    status: validation.isValid
      ? "✅ Chunking validation successful"
      : "❌ Chunking validation failed",
  };
}
