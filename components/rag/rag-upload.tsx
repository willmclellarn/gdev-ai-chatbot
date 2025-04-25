"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChunkingStrategy } from "@/lib/utils/chunking";
import { EmbeddingModel } from "@/lib/ai/models";
import { createRagFormData } from "@/lib/utils/form-data";
import { extractPlainTextFromFile } from "@/lib/utils/file-processing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

interface RagUploadProps {
  file: File | null;
  isUploading: boolean;
  onUploadComplete: () => void;
  chunkingStrategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keywords: string;
  embeddingModel: EmbeddingModel;
  selectedLocalFile: string;
}

export function RagUpload({
  file,
  isUploading,
  onUploadComplete,
  chunkingStrategy,
  chunkSize,
  chunkOverlap,
  keywords,
  embeddingModel,
  selectedLocalFile,
}: RagUploadProps) {
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");

  const handleUpload = async () => {
    try {
      if (!file) {
        toast.error("No file provided");
        return;
      }

      setIsProcessing(true);
      const processedFile = await extractPlainTextFromFile(file);

      // Generate chunks first
      const generateChunksResult = await fetch("/api/rag/generate-chunks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: processedFile,
          chunkingStrategy,
          chunkSize,
          chunkOverlap,
          keywords,
        }),
      });

      if (!generateChunksResult.ok) {
        const errorText = await generateChunksResult.text();
        console.error("🔴 RAG Chunking error:", errorText);
        toast.error("Failed to generate chunks");
        return;
      }
      const chunks = await generateChunksResult.json();
      toast.success("Chunks generated successfully");

      // Upload file and chunks to Pinecone
      const uploadBody = new FormData();
      uploadBody.append("chunks", JSON.stringify(chunks.chunks));
      uploadBody.append("embeddingModel", embeddingModel.id);
      uploadBody.append("documentTitle", documentTitle);
      uploadBody.append("originalFileName", file.name);

      const result = await fetch("/api/rag/upload", {
        method: "POST",
        body: uploadBody,
      }).then((res) => res.json());

      if (!result.vectors || !result.documentTitle) {
        console.error("🔴 RAG Upload error:", {
          vectors: result.vectors,
          pineconeDocumentTitle: result.documentTitle,
        });
        toast.error("Failed to upload chunks to Pinecone");
        return;
      }

      toast.success("Chunks uploaded to Pinecone successfully");

      setShowTitleDialog(false);
      setDocumentTitle("");
      onUploadComplete();
    } catch (error) {
      console.error("🔴 Rag Upload handleUpload error:", error);
      toast.error("Failed to upload and process file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    setShowTitleDialog(true);
  };

  return (
    <>
      <Button
        onClick={handleUploadClick}
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload and Process
          </>
        )}
      </Button>

      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Document Title</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter a title for your document"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTitleDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!documentTitle || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
