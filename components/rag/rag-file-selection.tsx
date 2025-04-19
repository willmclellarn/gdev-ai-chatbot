'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssetFile {
  name: string;
  path: string;
}

interface RagFileSelectionProps {
  onFileSelect: (file: File, text: string, format: 'plain' | 'html' | 'markdown') => void;
  onLocalFileSelect: (path: string) => void;
  isLoadingFiles: boolean;
  localFiles: AssetFile[];
  selectedLocalFile: string;
  isUploading: boolean;
}

export function RagFileSelection({
  onFileSelect,
  onLocalFileSelect,
  isLoadingFiles,
  localFiles,
  selectedLocalFile,
  isUploading
}: RagFileSelectionProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const processedDoc = await fetch("/api/rag/process-doc", {
          method: 'POST',
          body: formData,
        }).then(res => res.json());

        onFileSelect(selectedFile, processedDoc.text, processedDoc.format);
      } catch (error) {
        console.error('🟡 Error processing uploaded file:', error);
        toast.error('Failed to process uploaded file');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Local Test File</Label>
        {isLoadingFiles ? (
          <div className="flex items-center justify-center p-4 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading files...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {localFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => onLocalFileSelect(file.path)}
                className={`flex items-center space-x-3 p-3 border rounded-md w-full text-left transition-colors ${
                  selectedLocalFile === file.path
                    ? 'bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 text-yellow-900 dark:text-yellow-200'
                    : 'hover:bg-accent/50'
                }`}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Or upload your own file below
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Document File</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground">
          Supported formats: PDF, Word (.doc, .docx), Text (.txt), Markdown (.md)
        </p>
      </div>
    </div>
  );
}
