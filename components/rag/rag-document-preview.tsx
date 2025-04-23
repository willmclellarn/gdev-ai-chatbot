"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChunkingStrategy } from "@/lib/utils/chunking";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProcessedDocument } from "@/lib/utils/file-processing";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";

interface RagDocumentPreviewProps {
  previewText: string;
  onPreviewTextChange: (text: string) => void;
  selectedLocalFile: string;
  format?: "plain" | "html" | "markdown";
}

export function RagDocumentPreview({
  previewText,
  onPreviewTextChange,
  selectedLocalFile,
  format = "plain",
}: RagDocumentPreviewProps) {
  const [preview, setPreview] = useState(previewText);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (previewText) {
      setPreview(previewText);
    }
  }, [previewText]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div
      className={cn(
        "space-y-2",
        isFullScreen
          ? "fixed top-0 right-0 bottom-0 w-[calc(100%-16rem)] z-50 bg-background p-4 border-l"
          : ""
      )}
    >
      <div className="space-y-2">
        <Label>Document Preview</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullScreen}
          className="flex items-center gap-2"
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="h-4 w-4" />
              <span>Exit Preview</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              <span>Expand Preview</span>
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        {selectedLocalFile ? (
          <ScrollArea
            className={cn(
              "border rounded-md",
              isFullScreen ? "h-[calc(100vh-8rem)]" : "h-[400px]"
            )}
          >
            <div
              className={cn(
                "p-4 prose dark:prose-invert max-w-none",
                "bg-background",
                {
                  "whitespace-pre-wrap": format === "plain",
                  "prose-pre:whitespace-pre-wrap": format === "plain",
                }
              )}
            >
              {format === "markdown" ? (
                <Markdown>{previewText}</Markdown>
              ) : format === "html" ? (
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
            className={cn(
              "font-mono text-sm",
              isFullScreen ? "h-[calc(100vh-8rem)]" : "h-[400px]"
            )}
          />
        )}
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {previewText.length.toLocaleString()} characters
        </div>
      </div>
    </div>
  );
}
