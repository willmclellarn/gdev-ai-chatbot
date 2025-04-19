'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { ChunkingStrategy } from '@/lib/utils/chunking';
import { Markdown } from '@/components/markdown';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProcessedDocument } from '@/lib/utils/file-processing';
import { useEffect, useState } from 'react';

interface RagDocumentPreviewProps {
  previewText: string;
  onPreviewTextChange: (text: string) => void;
  selectedLocalFile: string;
  chunkingStrategy: ChunkingStrategy;
  format?: 'plain' | 'html' | 'markdown';
  metadata?: ProcessedDocument['metadata'];
}

export function RagDocumentPreview({
  previewText,
  onPreviewTextChange,
  selectedLocalFile,
  chunkingStrategy,
  format = 'plain',
  metadata = [],
}: RagDocumentPreviewProps) {

  const [preview, setPreview] = useState(previewText);

  useEffect(() => {
    if (previewText) {
      setPreview(previewText);
    }
  }, [previewText]);

  return (
    <div className="space-y-2">
      <Label>Document Preview</Label>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {chunkingStrategy === 'auto'
            ? 'Strategy will be auto-selected based on content'
            : `Using strategy: ${chunkingStrategy}`}
        </span>
      </div>
      <div className="relative">
        {selectedLocalFile ? (
          <ScrollArea className="h-[400px] border rounded-md">
            <div className={cn(
              "p-4 prose dark:prose-invert max-w-none",
              "bg-background",
              {
                'whitespace-pre-wrap': format === 'plain',
                'prose-pre:whitespace-pre-wrap': format === 'plain',
              }
            )}>
              {format === 'markdown' ? (
                <Markdown>{previewText}</Markdown>
              ) : format === 'html' ? (
                <div
                  className="prose dark:prose-invert max-w-none [&_p]:my-2 [&_p[style*='text-align:center']]:text-center [&_p[style*='text-align:right']]:text-right [&_p[style*='text-align:justify']]:text-justify"
                  dangerouslySetInnerHTML={{ __html: previewText }}
                />
              ) : (
                <div className="font-mono text-sm whitespace-pre-wrap">
                  {previewText}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <Textarea
            placeholder="Enter some text to preview how it will be chunked..."
            value={previewText}
            onChange={(e) => onPreviewTextChange(e.target.value)}
            className="h-[400px] font-mono text-sm"
          />
        )}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {previewText.length.toLocaleString()} characters
        </div>
      </div>
    </div>
  );
}
