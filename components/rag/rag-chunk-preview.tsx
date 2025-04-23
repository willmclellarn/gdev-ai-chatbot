"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChunkingStrategy } from "@/lib/utils/chunking";

interface RagChunkPreviewProps {
  previewChunks: string[];
  chunkingStrategy: ChunkingStrategy;
  actualStrategy?: ChunkingStrategy | null;
}

export function RagChunkPreview({
  previewChunks,
  chunkingStrategy,
  actualStrategy,
}: RagChunkPreviewProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Preview Results (First 5 Chunks)</Label>
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
  );
}
