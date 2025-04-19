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
import { AlertCircle, Bell, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChunkingStrategy, splitTextIntoChunks } from '@/lib/utils/chunking';

export default function RAGResourcesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [isUploading, setIsUploading] = useState(false);
  const [chunkingStrategy, setChunkingStrategy] = useState<ChunkingStrategy>('token');
  const [previewText, setPreviewText] = useState('');
  const [previewChunks, setPreviewChunks] = useState<string[]>([]);
  const { isAdmin, isLoading } = useAdmin();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handlePreview = () => {
    if (!previewText) {
      toast.error('Please enter some text to preview');
      return;
    }

    try {
      const chunks = splitTextIntoChunks(previewText, {
        strategy: chunkingStrategy,
        chunkSize,
        chunkOverlap,
      });
      setPreviewChunks(chunks.slice(0, 5)); // Show first 5 chunks
    } catch (error) {
      toast.error('Failed to generate preview');
      console.error(error);
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
      formData.append('chunkingStrategy', chunkingStrategy);

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Chunking Strategy</Label>
                      <Select
                        value={chunkingStrategy}
                        onValueChange={(value: ChunkingStrategy) => setChunkingStrategy(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chunking strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="token">Token-based</SelectItem>
                          <SelectItem value="headers">Header-based</SelectItem>
                          <SelectItem value="centered">Centered Content</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {chunkingStrategy === 'token' && 'Split text into chunks based on token count'}
                        {chunkingStrategy === 'headers' && 'Split text into chunks based on markdown headers'}
                        {chunkingStrategy === 'centered' && 'Split text into chunks based on centered content'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {chunkingStrategy === 'token' && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preview Chunking</Label>
                    <div className="flex gap-4">
                      <Textarea
                        placeholder="Enter some text to preview how it will be chunked..."
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        className="min-h-[100px] flex-1"
                      />
                      <Button
                        onClick={handlePreview}
                        variant="outline"
                        className="h-[100px]"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  {previewChunks.length > 0 && (
                    <div className="space-y-2">
                      <Label>Preview Results (First 5 Chunks)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
