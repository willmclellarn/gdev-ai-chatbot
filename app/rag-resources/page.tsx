'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Bell } from 'lucide-react';
import { RAGHeader } from '@/components/rag/rag-header';
import { useAdmin } from '@/hooks/use-admin';
import { RagFileSelection } from '@/components/rag/rag-file-selection';
import { RagChunkingConfig } from '@/components/rag/rag-chunking-config';
import { RagPreview } from '@/components/rag/rag-preview';
import { RagUpload } from '@/components/rag/rag-upload';
import { ChunkingStrategy } from '@/lib/utils/chunking';

interface AssetFile {
  name: string;
  path: string;
}

export default function RAGResourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedLocalFile, setSelectedLocalFile] = useState<string>('');
  const [localFiles, setLocalFiles] = useState<AssetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isUploading, setIsUploading] = useState(false);
  const [chunkingStrategy, setChunkingStrategy] = useState<ChunkingStrategy>('auto');
  const [previewText, setPreviewText] = useState('');
  const [previewFormat, setPreviewFormat] = useState<'plain' | 'html' | 'markdown'>('plain');
  const [previewChunks, setPreviewChunks] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const { isAdmin, isLoading } = useAdmin();

  useEffect(() => {
    const fetchLocalFiles = async () => {
      try {
        const response = await fetch('/api/rag/list-assets');
        if (!response.ok) throw new Error('Failed to fetch files');
        const files = await response.json();
        setLocalFiles(files);
      } catch (error) {
        console.error('Error fetching local files:', error);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchLocalFiles();
  }, []);

  const handleLocalFileSelect = async (path: string) => {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error('Failed to fetch file');

      const blob = await response.blob();
      const file = new File([blob], path.split('/').pop() || 'document', {
        type: blob.type
      });

      const formData = new FormData();
      formData.append('file', file);

      const processedDoc = await fetch("/api/rag/process-doc", {
        method: 'POST',
        body: formData,
      }).then(res => res.json());

      setFile(file);
      setSelectedLocalFile(path);
      setPreviewText(processedDoc.text);
      setPreviewFormat(processedDoc.format);
    } catch (error) {
      console.error('🟡 Error processing file:', error);
    }
  };

  const handleFileSelect = (selectedFile: File, text: string, format: 'plain' | 'html' | 'markdown') => {
    setFile(selectedFile);
    setSelectedLocalFile('');
    setPreviewText(text);
    setPreviewFormat(format);
  };

  const handleUploadComplete = () => {
    setFile(null);
    setIsUploading(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <RAGHeader />
        <div className="container mx-auto py-8 flex-1">
          <Card>
            <CardHeader>
              <CardTitle>RAG Resources</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <RAGHeader />
      {isAdmin && (
        <div className="container mx-auto px-4 py-2">
          <Alert className="bg-yellow-50 border-yellow-200/50 text-yellow-800">
            <Bell className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Admin Announcement</AlertTitle>
            <AlertDescription className="text-yellow-700">
              You have administrative access to manage RAG resources.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="container mx-auto px-4 py-8 flex-1">
        <Card>
          <CardHeader>
            <CardTitle>RAG Resources</CardTitle>
            <CardDescription>
              {isAdmin
                ? 'Upload PDFs to be processed and stored in the vector database'
                : 'View and manage RAG resources'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isAdmin && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                  You do not have permission to upload documents. Please contact an administrator.
                </AlertDescription>
              </Alert>
            )}

            {isAdmin && (
              <>
                <RagFileSelection
                  onFileSelect={handleFileSelect}
                  onLocalFileSelect={handleLocalFileSelect}
                  isLoadingFiles={isLoadingFiles}
                  localFiles={localFiles}
                  selectedLocalFile={selectedLocalFile}
                  isUploading={isUploading}
                />

                <RagChunkingConfig
                  chunkingStrategy={chunkingStrategy}
                  onStrategyChange={setChunkingStrategy}
                  chunkSize={chunkSize}
                  onChunkSizeChange={setChunkSize}
                  chunkOverlap={chunkOverlap}
                  onChunkOverlapChange={setChunkOverlap}
                  keywords={keywords}
                  onKeywordsChange={setKeywords}
                />

                <RagPreview
                  previewText={previewText}
                  onPreviewTextChange={setPreviewText}
                  previewFormat={previewFormat}
                  onPreviewFormatChange={setPreviewFormat}
                  previewChunks={previewChunks}
                  onPreviewChunksChange={setPreviewChunks}
                  selectedLocalFile={selectedLocalFile}
                  chunkingStrategy={chunkingStrategy}
                  chunkSize={chunkSize}
                  chunkOverlap={chunkOverlap}
                  keywords={keywords}
                />

                <RagUpload
                  file={file}
                  isUploading={isUploading}
                  onUploadComplete={handleUploadComplete}
                  chunkingStrategy={chunkingStrategy}
                  chunkSize={chunkSize}
                  chunkOverlap={chunkOverlap}
                  keywords={keywords}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
