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

export function RagIndexManager() {
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVectors, setTotalVectors] = useState(0);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rag/vectors");
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      setDocuments(data.documents);
      setTotalVectors(data.totalVectors);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load indexed documents");
    } finally {
      setIsLoading(false);
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

    try {
      // First, get the vector IDs for the selected documents
      const response = await fetch("/api/rag/vectors");
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      const selectedVectors = data.documents.filter((doc: any) =>
        selectedDocuments.includes(doc.id)
      );
      const vectorIds = selectedVectors.map((doc: any) => doc.vectorId);

      // Delete vectors and associated files
      const deleteResponse = await fetch("/api/rag/vectors", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentIds: vectorIds }),
      });

      if (!deleteResponse.ok) throw new Error("Failed to delete documents");

      toast.success("Documents deleted successfully");
      setSelectedDocuments([]);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting documents:", error);
      toast.error("Failed to delete documents");
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
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={selectedDocuments.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
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
