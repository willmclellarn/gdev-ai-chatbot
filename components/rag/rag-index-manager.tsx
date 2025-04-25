"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";

interface IndexedDocument {
  id: string;
  title: string;
  lastUpdated: string;
  chunkCount: number;
}

interface RagIndexManagerProps {
  onRefresh?: () => Promise<void>;
}

export function RagIndexManager({ onRefresh }: RagIndexManagerProps) {
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVectors, setTotalVectors] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDocuments = async () => {
    console.log("🟡 [RAG] Fetching documents...");
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      const response = await fetch("/api/rag/vectors");
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      console.log(
        "🟡 [RAG] Documents fetched successfully:",
        data.documents.length
      );
      setDocuments(data.documents);
      setTotalVectors(data.totalVectors);
    } catch (error) {
      console.error("🟡 [RAG] Error fetching documents:", error);
      toast.error("Failed to load indexed documents");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Please select documents to delete");
      return;
    }

    console.log("🟡 [RAG] Deleting documents:", selectedDocuments);
    try {
      setIsDeleting(true);

      // Delete vectors and associated files in a single request
      const deleteResponse = await fetch("/api/rag/vectors", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentIds: selectedDocuments }),
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || "Failed to delete documents");
      }

      console.log("🟡 [RAG] Documents deleted successfully");
      toast.success("Documents deleted successfully");
      setSelectedDocuments([]);

      // Refresh the structure after successful deletion
      await onRefresh?.();
      fetchDocuments();
    } catch (error) {
      console.error("🟡 [RAG] Error deleting documents:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete documents"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map((doc) => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const toggleSelectDocument = (documentId: string, checked: boolean) => {
    setSelectedDocuments((prev) =>
      checked ? [...prev, documentId] : prev.filter((id) => id !== documentId)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total vectors: {totalVectors}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={selectedDocuments.length === 0 || isDeleting}
          >
            <Trash2
              className={`h-4 w-4 mr-2 ${isDeleting ? "animate-pulse" : ""}`}
            />
            {isDeleting ? "Deleting..." : "Delete Selected"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedDocuments.length === documents.length &&
                    documents.length > 0
                  }
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    toggleSelectAll(event.target.checked)
                  }
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Chunks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        toggleSelectDocument(doc.id, event.target.checked)
                      }
                      aria-label={`Select ${doc.title}`}
                    />
                  </TableCell>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell>
                    {new Date(doc.lastUpdated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{doc.chunkCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
