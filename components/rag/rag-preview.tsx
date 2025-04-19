'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ChunkingStrategy } from '@/lib/utils/chunking';

interface RagPreviewProps {
  previewText: string;
  onPreviewTextChange: (text: string) => void;
  previewFormat: 'plain' | 'html' | 'markdown';
  onPreviewFormatChange: (format: 'plain' | 'html' | 'markdown') => void;
  previewChunks: string[];
  onPreviewChunksChange: (chunks: string[]) => void;
  selectedLocalFile: string;
  chunkingStrategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keywords: string;
}

export function RagPreview({
  previewText,
  onPreviewTextChange,
  previewFormat,
  onPreviewFormatChange,
  previewChunks,
  onPreviewChunksChange,
  selectedLocalFile,
  chunkingStrategy,
  chunkSize,
  chunkOverlap,
  keywords,
}: RagPreviewProps) {
  const handlePreview = async () => {
    if (!previewText) {
      toast.error('Please enter some text to preview');
      return;
    }

    try {
      const options = {
        text: previewText,
        strategy: chunkingStrategy,
        chunkSize,
        chunkOverlap,
        format: previewFormat,
        ...(chunkingStrategy === ('keyword' as ChunkingStrategy) && { keywords: keywords.split(',').map(k => k.trim()) })
      };

      const chunks = await fetch('/api/rag/split-text', {
        method: 'POST',
        body: JSON.stringify(options),
      }).then(res => res.json());

      onPreviewChunksChange(chunks.slice(0, 5)); // Show first 5 chunks
    } catch (error) {
      toast.error('Failed to generate preview');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Preview Format</Label>
        <Select
          value={previewFormat}
          onValueChange={(value: 'plain' | 'html' | 'markdown') => onPreviewFormatChange(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select preview format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plain">Plain Text</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Document Preview</Label>
        <Textarea
          placeholder={selectedLocalFile ? "Using selected file content for preview..." : "Enter some text to preview how it will be chunked..."}
          value={previewText}
          onChange={(e) => onPreviewTextChange(e.target.value)}
          className="min-h-[100px]"
          disabled={!!selectedLocalFile}
        />
        <Button
          onClick={handlePreview}
          variant="outline"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Chunks
        </Button>
      </div>

      {previewChunks.length > 0 && (
        <div className="space-y-2">
          <Label>Preview Results (First 5 Chunks)</Label>
          <div className="space-y-4">
            {previewChunks.map((chunk, index) => (
              <Card key={index} className="p-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-sm">Chunk {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                  <p className="text-sm whitespace-pre-wrap">{chunk}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
