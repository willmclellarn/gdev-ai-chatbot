"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Bell, Eye } from "lucide-react";
import { RAGHeader } from "@/components/rag/rag-header";
import { useAdmin } from "@/hooks/use-admin";
import { RagFileSelection } from "@/components/rag/rag-file-selection";
import { RagChunkingConfig } from "@/components/rag/rag-chunking-config";
import { RagDocumentPreview } from "@/components/rag/rag-document-preview";
import { RagChunkPreview } from "@/components/rag/rag-chunk-preview";
import { Button } from "@/components/ui/button";
import { RagUpload } from "@/components/rag/rag-upload";
import { ChunkingStrategy } from "@/lib/utils/chunking";
import {
  extractPlainTextFromFile,
  ProcessedDocument,
} from "@/lib/utils/file-processing";
import { useGlobalState } from "@/hooks/use-global-state";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createRagFormData } from "@/lib/utils/form-data";

interface AssetFile {
  name: string;
  path: string;
}

export default function RAGResourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedLocalFile, setSelectedLocalFile] = useState<string>("");
  const [localFiles, setLocalFiles] = useState<AssetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isUploading, setIsUploading] = useState(false);
  const [chunkingStrategy, setChunkingStrategy] =
    useState<ChunkingStrategy>("token");
  const [previewText, setPreviewText] = useState("");
  const [previewFormat, setPreviewFormat] = useState<
    "plain" | "html" | "markdown"
  >("plain");
  const [previewMetadata, setPreviewMetadata] = useState<
    ProcessedDocument["metadata"]
  >([]);
  const [previewChunks, setPreviewChunks] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>("");
  const [hasChunkingChanges, setHasChunkingChanges] = useState(false);
  const { isAdmin, isLoading } = useAdmin();
  const {
    state: { embeddingModel },
  } = useGlobalState();
  const [actualStrategy, setActualStrategy] = useState<ChunkingStrategy | null>(
    null
  );
  const { data: session } = useSession();

  useEffect(() => {
    const fetchLocalFiles = async () => {
      try {
        const response = await fetch("/api/rag/list-assets");
        if (!response.ok) throw new Error("Failed to fetch files");
        const files = await response.json();
        setLocalFiles(files);
      } catch (error) {
        console.error("Error fetching local files:", error);
      } finally {
        setIsLoadingFiles(false);
        setIsPageLoading(false);
      }
    };

    fetchLocalFiles();
  }, []);

  useEffect(() => {
    const defaultSettings = {
      chunkSize: 1000,
      chunkOverlap: 200,
      chunkingStrategy: "token" as ChunkingStrategy,
      keywords: "",
    };

    const currentSettings = {
      chunkSize,
      chunkOverlap,
      chunkingStrategy,
      keywords,
    };

    setHasChunkingChanges(
      JSON.stringify(currentSettings) !== JSON.stringify(defaultSettings)
    );
  }, [chunkSize, chunkOverlap, chunkingStrategy, keywords]);

  const handleSaveDefault = async () => {
    const response = await fetch("/api/rag/preferences", {
      method: "POST",
      body: JSON.stringify({
        chunkingStrategy,
        chunkSize,
        chunkOverlap,
      }),
    });

    if (!response.ok) {
      console.error("Failed to save default settings");
    }

    setHasChunkingChanges(false);
  };

  const handleLocalFileSelect = async (path: string) => {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const file = new File([blob], path.split("/").pop() || "document", {
        type: path.toLowerCase().endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : blob.type,
      });

      const formData = new FormData();
      formData.append("file", file);

      let processedDoc: ProcessedDocument;

      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        processedDoc = await fetch("/api/process-file/word", {
          method: "POST",
          body: formData,
        }).then((res) => res.json());
      } else if (file.type === "application/pdf") {
        processedDoc = await fetch("/api/process-file/pdf", {
          method: "POST",
          body: formData,
        }).then((res) => res.json());
      } else if (file.name.toLowerCase().endsWith(".md")) {
        processedDoc = await fetch("/api/process-file/markdown", {
          method: "POST",
          body: formData,
        }).then((res) => res.json());
      } else {
        processedDoc = await fetch("/api/process-file/generic", {
          method: "POST",
          body: formData,
        }).then((res) => res.json());
      }

      setFile(file);
      setSelectedLocalFile(path);
      setPreviewText(processedDoc.text);
      setPreviewFormat(processedDoc.format);
      setPreviewMetadata(processedDoc.metadata || []);
    } catch (error) {
      console.error("🟡 Error processing file:", error);
    }
  };

  const handleFileSelect = (
    selectedFile: File,
    text: string,
    format: "plain" | "html" | "markdown",
    metadata?: ProcessedDocument["metadata"]
  ) => {
    setFile(selectedFile);
    setSelectedLocalFile("");
    setPreviewText(text);
    setPreviewFormat(format);
    setPreviewMetadata(metadata || []);
  };

  const handleUploadComplete = () => {
    setFile(null);
    setIsUploading(false);
  };

  const handlePreviewChunks = async () => {
    try {
      if (!file) {
        toast.error("No file provided");
        setPreviewChunks([]);
        return;
      }

      const textFromFile = await extractPlainTextFromFile(file);

      // const formData = await createRagFormData({
      //   file: textFromFile,
      //   selectedLocalFile,
      //   chunkingStrategy,
      //   chunkSize,
      //   chunkOverlap,
      //   keywords,
      // });

      const result = await fetch("/api/rag/generate-chunks", {
        method: "POST",
        body: JSON.stringify({
          text: textFromFile,
          chunkingStrategy,
          chunkSize,
          chunkOverlap,
          keywords,
        }),
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("🔵 Rag Preview API error:", errorText);
        setPreviewChunks([]);
        return;
      }

      const data = await result.json();
      // setPreviewText(data.previewText);
      setPreviewChunks(data.chunks || []);
      if (chunkingStrategy === "auto") {
        setActualStrategy(data.strategy);
      }
    } catch (error) {
      console.error("🔴 Rag Preview generatePreview error:", error);
      setPreviewChunks([]);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex flex-col h-full">
        <RAGHeader />
        <div className="container mx-auto py-8 flex-1">
          <Card>
            <CardHeader>
              <CardTitle>RAG Resources</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <RAGHeader
          hasChanges={hasChunkingChanges}
          onSaveDefault={handleSaveDefault}
        />
        <div className="container mx-auto py-8 flex-1">
          <Card>
            <CardHeader>
              <CardTitle>RAG Resources</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <RAGHeader
        hasChanges={hasChunkingChanges}
        onSaveDefault={handleSaveDefault}
      />

      <div className="container mx-auto px-4 py-8 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>RAG Resources</CardTitle>
            <CardDescription>
              Upload PDFs to be processed and stored in the vector database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RagFileSelection
              onFileSelect={handleFileSelect}
              onLocalFileSelect={handleLocalFileSelect}
              isLoadingFiles={isLoadingFiles}
              localFiles={localFiles}
              selectedLocalFile={selectedLocalFile}
              isUploading={isUploading}
            />

            <RagChunkingConfig
              chunkingStrategy={chunkingStrategy}
              onStrategyChange={setChunkingStrategy}
              chunkSize={chunkSize}
              onChunkSizeChange={setChunkSize}
              chunkOverlap={chunkOverlap}
              onChunkOverlapChange={setChunkOverlap}
              keywords={keywords}
              onKeywordsChange={setKeywords}
            />

            <RagDocumentPreview
              previewText={previewText}
              onPreviewTextChange={setPreviewText}
              selectedLocalFile={selectedLocalFile}
              format={previewFormat}
            />

            <div className="flex gap-2">
              <Button
                onClick={handlePreviewChunks}
                variant="outline"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Chunks
              </Button>
            </div>

            {previewChunks.length > 0 && (
              <RagChunkPreview
                previewChunks={previewChunks}
                chunkingStrategy={chunkingStrategy}
                actualStrategy={actualStrategy}
              />
            )}

            <RagUpload
              file={file}
              isUploading={isUploading}
              onUploadComplete={handleUploadComplete}
              chunkingStrategy={chunkingStrategy}
              chunkSize={chunkSize}
              chunkOverlap={chunkOverlap}
              keywords={keywords}
              embeddingModel={embeddingModel}
              selectedLocalFile={selectedLocalFile}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
