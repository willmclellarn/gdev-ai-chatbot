import { google } from "@ai-sdk/google";
import { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import fs from "fs";

function createChunkingPrompt(documentText: string) {
  return `
  - You are a helpful assistant that splits a document into logically grouped sections.
  - Implement the sections by logic, or concept.
  - Moderate size (500 words) is good, but REALLY want them grouped by concept.
  - Focus on the logical wrapping.

  ## Start content for each section
  - Mark each section with the start content (the first couple of sentences' exact content) and only return that.
  - Don't exclude any content from the start content.
  - DO NOT REMOVE ANY CONTENT FROM THE START CONTENT.

  Here is the document content
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

export function validateChunkBeginningsExist(
  documentText: string,
  chunkBeginnings: string[]
): ValidationResult {
  const issues: string[] = [];
  const chunkPositions: { start: number; end: number }[] = [];

  for (let i = 0; i < chunkBeginnings.length; i++) {
    const chunkBeginning = chunkBeginnings[i];
    const startIndex = documentText.indexOf(chunkBeginning);

    if (startIndex === -1) {
      issues.push(
        `Chunk ${i + 1} not found in original document, startIndex: ${startIndex}, chunkBeginning: ${chunkBeginning}
        )}`
      );
      continue;
    }

    const endIndex = startIndex + chunkBeginning.length;
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
    model: google("gemini-2.5-pro-exp-03-25"),
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
