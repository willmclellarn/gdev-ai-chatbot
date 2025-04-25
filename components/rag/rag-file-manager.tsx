"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FolderPlus, FilePlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { FileNode, FolderNode, TreeNode } from "./rag-folder-structure";

interface RagFileManagerProps {
  structure: TreeNode[];
  onStructureChange: (newStructure: TreeNode[]) => void;
  onFileSelect?: (file: FileNode) => void;
  onFolderSelect?: (folder: FolderNode) => void;
}

export function RagFileManager({
  structure,
  onStructureChange,
  onFileSelect,
  onFolderSelect,
}: RagFileManagerProps) {
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    node: TreeNode;
    parentPath: string[];
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      try {
        const newFiles: FileNode[] = await Promise.all(
          acceptedFiles.map(async (file) => {
            // Create a FormData object to send the file
            const formData = new FormData();
            formData.append("file", file);

            // Upload the file to the server
            const response = await fetch("/api/rag/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            const data = await response.json();

            return {
              type: "file" as const,
              name: file.name,
              path: data.path || `/uploads/${file.name}`,
            };
          })
        );

        // Add files to the root of the structure
        onStructureChange([...structure, ...newFiles]);
        toast.success(`Added ${acceptedFiles.length} file(s)`);
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Failed to upload some files");
      } finally {
        setIsUploading(false);
      }
    },
    [structure, onStructureChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    disabled: isUploading,
  });

  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    try {
      // Make API call to create folder in database
      const response = await fetch("/api/rag/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      const folderData = await response.json();

      // Create folder node with the data from the server
      const newFolder: FolderNode = {
        type: "folder",
        name: folderData.name,
        children: [],
        isOpen: true,
      };

      onStructureChange([...structure, newFolder]);
      setShowNewFolderDialog(false);
      setNewFolderName("");
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const renameNode = () => {
    if (!renameTarget || !newName.trim()) return;

    const updateNode = (nodes: TreeNode[], path: string[]): TreeNode[] => {
      if (path.length === 0) {
        return nodes.map((node) =>
          node === renameTarget.node ? { ...node, name: newName.trim() } : node
        );
      }

      return nodes.map((node) => {
        if (node.type === "folder") {
          return {
            ...node,
            children: updateNode(node.children, path.slice(1)),
          };
        }
        return node;
      });
    };

    onStructureChange(updateNode(structure, renameTarget.parentPath));
    setShowRenameDialog(false);
    setRenameTarget(null);
    setNewName("");
    toast.success("Renamed successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewFolderDialog(true)}
            disabled={isUploading}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploading}
          >
            <FilePlus className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} id="file-upload" />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isUploading
            ? "Uploading files..."
            : "Drag and drop files here, or click to select files"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supported formats: PDF, Word (.doc, .docx), Text (.txt), Markdown
          (.md)
        </p>
      </div>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createNewFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.node.type}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={`Enter new ${renameTarget?.node.type} name`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameNode();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={renameNode}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
