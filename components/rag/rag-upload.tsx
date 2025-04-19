'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChunkingStrategy } from '@/lib/utils/chunking';

interface RagUploadProps {
  file: File | null;
  isUploading: boolean;
  onUploadComplete: () => void;
  chunkingStrategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  keywords: string;
}

export function RagUpload({
  file,
  isUploading,
  onUploadComplete,
  chunkingStrategy,
  chunkSize,
  chunkOverlap,
  keywords,
}: RagUploadProps) {
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chunkSize', chunkSize.toString());
      formData.append('chunkOverlap', chunkOverlap.toString());
      formData.append('chunkingStrategy', chunkingStrategy);

      if (chunkingStrategy === ('keyword' as ChunkingStrategy)) {
        formData.append('keywords', keywords);
      }

      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast.success('File uploaded and processed successfully');
      onUploadComplete();
    } catch (error) {
      toast.error('Failed to upload and process file');
      console.error(error);
    }
  };

  return (
    <Button
      onClick={handleUpload}
      disabled={!file || isUploading}
      className="w-full"
    >
      {isUploading ? 'Processing...' : 'Upload and Process'}
    </Button>
  );
}
