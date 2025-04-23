import { ChunkingStrategy } from "./chunking";
import { ProcessedDocument } from "./file-processing";
interface CreateRagFormDataParams {
  file: ProcessedDocument | string | null;
  selectedLocalFile: string;
  chunkingStrategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keywords: string;
}

export async function createRagFormData({
  file,
  selectedLocalFile,
  chunkingStrategy,
  chunkSize,
  chunkOverlap,
  keywords,
}: CreateRagFormDataParams): Promise<FormData> {
  const formData = new FormData();

  if (file && typeof file === "object") {
    // Get the file extension from the base64 file name or metadata
    const fileExtension = file.metadata?.[0]?.styles?.fontFamily || "txt";
    const mimeType = getMimeTypeFromExtension(fileExtension);

    const blob = new Blob([Buffer.from(file.base64File, "base64")], {
      type: mimeType,
    });
    formData.append("file", blob);
  } else if (selectedLocalFile) {
    const response = await fetch(selectedLocalFile);
    const blob = await response.blob();
    const file = new File(
      [blob],
      selectedLocalFile.split("/").pop() || "document",
      {
        type: selectedLocalFile.toLowerCase().endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : blob.type,
      }
    );
    formData.append("file", file);
  }

  formData.append("chunkingStrategy", chunkingStrategy);
  formData.append("chunkSize", chunkSize.toString());
  formData.append("chunkOverlap", chunkOverlap.toString());
  formData.append("limit", "5");

  if (chunkingStrategy === "keyword") {
    formData.append("keywords", keywords);
  }

  return formData;
}

function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
  };

  return mimeTypes[extension.toLowerCase()] || "text/plain";
}
