"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChunkingStrategy } from "@/lib/utils/chunking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RagChunkPreviewProps {
  previewChunks: string[];
  chunkingStrategy: ChunkingStrategy;
  actualStrategy?: ChunkingStrategy | null;
  validationIssues?: string[];
  chunkPositions?: { start: number; end: number }[];
  isPreviewLoading?: boolean;
}

export function RagChunkPreview({
  previewChunks,
  chunkingStrategy,
  actualStrategy,
  validationIssues = [],
  chunkPositions = [],
  isPreviewLoading = false,
}: RagChunkPreviewProps) {
  console.log("🔵 RagChunkPreview props:", {
    validationIssues,
    chunkPositions,
    isPreviewLoading,
    previewChunksLength: previewChunks.length,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Preview Results (First 5 Chunks)</Label>
            <span className="text-sm text-muted-foreground">
              ({previewChunks.length} total chunks)
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {chunkingStrategy === "auto" && actualStrategy && (
              <span>
                Auto-selected strategy:{" "}
                <span className="font-medium">{actualStrategy}</span>
              </span>
            )}
          </span>
        </div>
        <div className="space-y-4">
          {(Array.isArray(previewChunks) ? previewChunks.slice(0, 5) : []).map(
            (chunk, index) => (
              <Card key={index} className="p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-sm">Chunk {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                  <p className="text-sm whitespace-pre-wrap">{chunk}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      {!isPreviewLoading && validationIssues.length > 0 ? (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-medium">Chunking Validation Issues:</p>
              <div className="space-y-4">
                {validationIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: issue }}
                  />
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : !isPreviewLoading && previewChunks.length > 0 ? (
        <Alert
          variant="default"
          className="mt-4 border-green-500 bg-green-50 text-green-900 [&>svg]:text-green-500"
        >
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm">All chunks validated successfully!</p>
          </AlertDescription>
        </Alert>
      ) : null}

      <style jsx global>{`
        .validation-issue {
          padding: 0.5rem;
          border-radius: 0.375rem;
          background-color: rgba(239, 68, 68, 0.1);
          margin-bottom: 0.5rem;
        }
        .validation-issue:last-child {
          margin-bottom: 0;
        }
        .issue-header {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: rgb(239, 68, 68);
        }
        .issue-details {
          padding-left: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .issue-details strong {
          color: rgb(239, 68, 68);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
