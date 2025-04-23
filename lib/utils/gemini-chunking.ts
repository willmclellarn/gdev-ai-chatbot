import { google } from "@ai-sdk/google";
import { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import fs from "fs";

function createChunkingPrompt(documentText: string) {
  return `You are a helpful assistant that splits a document into sections. Implement the sections by logic, by section or concept. We don't need necessarily small, but small is good, but really want them grouped by concept. For most, sections should be wrappers around a single concept. Length being moderate to small is better but not necessary. Focus on the logical wrapping.

## Start content for each section
Mark each section with the start content (a couple of sentences) and only return that. Don't exclude any content from the start content. DO NOT  REMOVE ANY CONTENT FROM THE START CONTENT.

Here is the document content:
<document>
${documentText}
</document>
`;
}

export async function splitByGeminiGenius(
  documentText: string
): Promise<string[]> {
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

  // try to find them in the text after normalizing and then split by the start content

  return ["chunk 1", "chunk 2", "chunk 3"];
}
