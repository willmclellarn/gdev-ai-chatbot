'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ChunkingStrategy } from '@/lib/utils/chunking';
import { useState, useEffect } from 'react';
import { RagDocumentPreview } from './rag-document-preview';
import { extractTextFromFile, ProcessedDocument } from '@/lib/utils/file-processing';
import { createRagFormData } from '@/lib/utils/form-data';
import { useSession } from 'next-auth/react';

interface RagPreviewProps {
  previewText: string;
  onPreviewTextChange: (text: string) => void;
  previewChunks: string[];
  onPreviewChunksChange: (chunks: string[]) => void;
  selectedLocalFile: string;
  chunkingStrategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keywords: string;
  format?: 'plain' | 'html' | 'markdown';
  metadata?: ProcessedDocument['metadata'];
  file: File | null;
}

export function RagPreview({
  previewText,
  onPreviewTextChange,
  previewChunks,
  onPreviewChunksChange,
  selectedLocalFile,
  chunkingStrategy,
  chunkSize,
  chunkOverlap,
  keywords,
  format = 'plain',
  metadata = [],
  file,
}: RagPreviewProps) {
  const [actualStrategy, setActualStrategy] = useState<ChunkingStrategy | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const loadPreferences = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/rag/preferences');
        if (response.ok) {
          const preferences = await response.json();
          if (preferences) {
            onPreviewTextChange(preferences.chunkSize);
            onPreviewChunksChange(preferences.chunkOverlap);
            setActualStrategy(preferences.chunkingStrategy as ChunkingStrategy);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [session]);

  const savePreferences = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to save preferences');
      return;
    }

    try {
      const response = await fetch('/api/rag/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunkSize,
          chunkOverlap,
          chunkingStrategy,
        }),
      });

      if (response.ok) {
        toast.success('Preferences saved successfully');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const generatePreview = async () => {
    try {
      if (!file) {
        toast.error('No file provided');
        onPreviewChunksChange([]);
        return;
      }

      const processedFile = await extractTextFromFile(file);

      const formData = await createRagFormData({
        file: processedFile,
        selectedLocalFile,
        chunkingStrategy,
        chunkSize,
        chunkOverlap,
        keywords,
      });

      const result = await fetch('/api/rag/generate-chunks', {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('🔵 Rag Preview API error:', errorText);
        onPreviewChunksChange([]);
        return;
      }

      const data = await result.json();
      onPreviewTextChange(data.previewText);
      onPreviewChunksChange(data.chunks || []);
      if (chunkingStrategy === 'auto') {
        setActualStrategy(data.strategy);
      }
    } catch (error) {
      console.error("🔴 Rag Preview generatePreview error:", error);
      onPreviewChunksChange([]);
    }
  };

  const handlePreview = () => {
    generatePreview();
  };

  return (
    <div className="space-y-4">
      <RagDocumentPreview
        previewText={previewText}
        onPreviewTextChange={onPreviewTextChange}
        selectedLocalFile={selectedLocalFile}
        chunkingStrategy={chunkingStrategy}
        format={format}
        metadata={metadata}
      />

      <div className="flex gap-2">
        <Button
          onClick={handlePreview}
          variant="outline"
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Chunks
        </Button>
        <Button
          onClick={savePreferences}
          variant="outline"
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Default
        </Button>
      </div>

      {previewChunks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Preview Results (First 5 Chunks)</Label>
            <span className="text-sm text-muted-foreground">
              {chunkingStrategy === 'auto' && actualStrategy && (
                <span>Auto-selected strategy: <span className="font-medium">{actualStrategy}</span></span>
              )}
            </span>
          </div>
          <div className="space-y-4">
            {(Array.isArray(previewChunks) ? previewChunks.slice(0, 5) : []).map((chunk, index) => (
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
