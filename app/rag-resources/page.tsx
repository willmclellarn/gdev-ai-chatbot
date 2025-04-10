'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { RAGHeader } from '@/components/rag-header';

export default function RAGResourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chunkSize', chunkSize.toString());
      formData.append('chunkOverlap', chunkOverlap.toString());

      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('File uploaded and processed successfully');
      setFile(null);
    } catch (error) {
      toast.error('Failed to upload and process file');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <RAGHeader />
      <div className="container mx-auto py-8 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>RAG Resources</CardTitle>
            <CardDescription>
              Upload PDFs to be processed and stored in the vector database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chunk Size (tokens)</Label>
                <Slider
                  value={[chunkSize]}
                  onValueChange={([value]: number[]) => setChunkSize(value)}
                  min={100}
                  max={2000}
                  step={100}
                />
                <p className="text-sm text-muted-foreground">
                  {chunkSize} tokens per chunk
                </p>
              </div>

              <div className="space-y-2">
                <Label>Chunk Overlap (tokens)</Label>
                <Slider
                  value={[chunkOverlap]}
                  onValueChange={([value]: number[]) => setChunkOverlap(value)}
                  min={0}
                  max={500}
                  step={50}
                />
                <p className="text-sm text-muted-foreground">
                  {chunkOverlap} tokens overlap between chunks
                </p>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? 'Processing...' : 'Upload and Process'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
