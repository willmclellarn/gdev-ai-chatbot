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
  const [documentTitle, setDocumentTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async () => {
    try {
      if (!file) {
        toast.error("No file provided");
        return;
      }

      setIsProcessing(true);
      const processedFile = await extractPlainTextFromFile(file);

      console.log("🔵 Rag Upload processedFile:", processedFile);

      const formData = await createRagFormData({
        file: processedFile,
        selectedLocalFile,
        chunkingStrategy,
        chunkSize,
        chunkOverlap,
        keywords,
      });

      formData.append("embeddingModel", embeddingModel.id);
      formData.append("documentTitle", documentTitle);

      const generateChunksResult = await fetch("/api/rag/generate-chunks", {
        method: "POST",
        body: formData,
      });

      if (!generateChunksResult.ok) {
        const errorText = await generateChunksResult.text();
        console.error("🔵 Rag Upload API error:", errorText);
        toast.error("Failed to generate chunks");
        return;
      }

      const chunks = await generateChunksResult.json();
      toast.success("Chunks generated successfully");

      const uploadBody = new FormData();
      uploadBody.append("chunks", JSON.stringify(chunks.chunks));
      uploadBody.append("embeddingModel", embeddingModel.id);
      uploadBody.append("documentTitle", documentTitle);

      const uploadResult = await fetch("/api/rag/upload", {
        method: "POST",
        body: uploadBody,
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text();
        console.error("🔵 Rag Upload API error:", errorText);
        toast.error("Failed to upload chunks");
        return;
      }

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
        {isUploading ? "Processing..." : "Upload and Process"}
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
              {isProcessing ? "Processing..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
