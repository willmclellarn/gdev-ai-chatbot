"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChunkingStrategy } from "@/lib/utils/chunking";
import { CHUNKING_STRATEGIES } from "@/lib/constants";

interface RagChunkingConfigProps {
  chunkingStrategy: ChunkingStrategy;
  onStrategyChange: (strategy: ChunkingStrategy) => void;
  chunkSize: number;
  onChunkSizeChange: (size: number) => void;
  chunkOverlap: number;
  onChunkOverlapChange: (overlap: number) => void;
  keywords: string;
  onKeywordsChange: (keywords: string) => void;
}

export function RagChunkingConfig({
  chunkingStrategy,
  onStrategyChange,
  chunkSize,
  onChunkSizeChange,
  chunkOverlap,
  onChunkOverlapChange,
  keywords,
  onKeywordsChange,
}: RagChunkingConfigProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <div className="flex-1 space-y-2">
          <Label>Chunking Strategy</Label>
          <Select
            value={chunkingStrategy}
            onValueChange={(value: ChunkingStrategy) => onStrategyChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select chunking strategy" />
            </SelectTrigger>
            <SelectContent>
              {CHUNKING_STRATEGIES.map((strategy) => (
                <SelectItem key={strategy} value={strategy}>
                  {strategy}
                </SelectItem>
              ))}
              {/* <SelectItem value="auto">Auto (Recommended)</SelectItem>
              <SelectItem value="token">Token-based</SelectItem>
              <SelectItem value="headers">Header-based</SelectItem>
              <SelectItem value="centered">Centered Content</SelectItem>
              <SelectItem value="html">HTML Structure</SelectItem>
              <SelectItem value="keyword">Keyword-based</SelectItem>
              <SelectItem value="gemini-genius">Gemini Genius</SelectItem> */}
            </SelectContent>
          </Select>
          {/* <p className="text-sm text-muted-foreground">
            {chunkingStrategy === "auto" &&
              "Automatically detect the best chunking strategy based on document type and content"}
            {chunkingStrategy === "token" &&
              "Split text into chunks based on token count"}
            {chunkingStrategy === "headers" &&
              "Split text into chunks based on markdown headers"}
            {chunkingStrategy === "centered" &&
              "Split text into chunks based on centered content"}
            {chunkingStrategy === 'html' && 'Split text into chunks based on HTML structural elements'}
            {chunkingStrategy === 'keyword' && 'Split text into chunks based on specified keywords'}
          </p> */}
        </div>
      </div>

      {/* {chunkingStrategy === 'token' && (
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1 space-y-2">
            <Label>Chunk Size (tokens)</Label>
            <Slider
              value={[chunkSize]}
              onValueChange={([value]: number[]) => onChunkSizeChange(value)}
              min={100}
              max={2000}
              step={100}
            />
            <p className="text-sm text-muted-foreground">
              {chunkSize} tokens per chunk
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Chunk Overlap (tokens)</Label>
            <Slider
              value={[chunkOverlap]}
              onValueChange={([value]: number[]) => onChunkOverlapChange(value)}
              min={0}
              max={500}
              step={50}
            />
            <p className="text-sm text-muted-foreground">
              {chunkOverlap} tokens overlap between chunks
            </p>
          </div>
        </div>
      )} */}

      {/* {chunkingStrategy === ('keyword' as ChunkingStrategy) && (
        <div className="space-y-2">
          <Label>Keywords (comma-separated)</Label>
          <Input
            placeholder="Enter keywords separated by commas"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter keywords that should be used to split the text into chunks
          </p>
        </div>
      )} */}
    </div>
  );
}
