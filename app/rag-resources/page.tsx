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
import { useAdmin } from '@/hooks/use-admin';
import { AlertCircle, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

export default function RAGResourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isUploading, setIsUploading] = useState(false);
  const [resourceScope, setResourceScope] = useState<'user' | 'org' | 'admin'>('user');
  const { isAdmin, isLoading } = useAdmin();

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
        <div className="w-full bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="container mx-auto py-2">
            <Alert className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">Admin Announcement</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                You have administrative access to manage RAG resources.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      <div className="container mx-auto py-8 flex-1">
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
                    <Label>Resource Scope</Label>
                    <RadioGroup
                      value={resourceScope}
                      onValueChange={(value: 'user' | 'org' | 'admin') => setResourceScope(value)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="user" />
                        <Label htmlFor="user" className="text-sm font-normal">User</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="org" id="org" />
                        <Label htmlFor="org" className="text-sm font-normal">Organization</Label>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="admin" />
                          <Label htmlFor="admin" className="text-sm font-normal">System-wide</Label>
                        </div>
                      )}
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground mt-1">
                      {resourceScope === 'user' && 'This resource will only be available to you'}
                      {resourceScope === 'org' && 'This resource will be available to your entire organization'}
                      {resourceScope === 'admin' && 'This resource will be available system-wide'}
                    </p>
                  </div>

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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
