"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDrag,
  useDrop,
  DragSourceMonitor,
  DropTargetMonitor,
} from "react-dnd";
import { toast } from "sonner";

// Define types for our folder structure
export interface FileNode {
  type: "file";
  id: string;
  name: string;
  path: string;
  size?: number;
}

export interface FolderNode {
  type: "folder";
  id: string;
  name: string;
  children: (FileNode | FolderNode)[];
  isOpen?: boolean;
}

export type TreeNode = FileNode | FolderNode;

interface RagFolderStructureProps {
  onFileSelect?: (file: FileNode) => void;
  onFolderSelect?: (folder: FolderNode) => void;
  initialStructure?: TreeNode[];
  onStructureChange?: (newStructure: TreeNode[]) => void;
  onRefresh?: () => Promise<void>;
}

interface DraggableItem {
  type: "file" | "folder";
  node: TreeNode;
  parentPath: string[];
}

export function RagFolderStructure({
  onFileSelect,
  onFolderSelect,
  initialStructure = [],
  onStructureChange,
  onRefresh,
}: RagFolderStructureProps) {
  const [structure, setStructure] = useState<TreeNode[]>(initialStructure);
  const [draggedNode, setDraggedNode] = useState<DraggableItem | null>(null);

  // Sync structure with initialStructure when it changes
  useEffect(() => {
    setStructure(initialStructure);
  }, [initialStructure]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "node",
    item: draggedNode,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "node",
    drop: (item: DraggableItem) => {
      if (draggedNode) {
        moveNode(item.parentPath, draggedNode.parentPath);
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const moveNode = useCallback(
    (dragPath: string[], dropPath: string[]) => {
      const findNode = (
        nodes: TreeNode[],
        path: string[]
      ): { node: TreeNode; parent: TreeNode[] } | null => {
        if (path.length === 0) return null;
        const [current, ...rest] = path;

        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].name === current) {
            if (rest.length === 0) {
              return { node: nodes[i], parent: nodes };
            }
            if (nodes[i].type === "folder") {
              const folderNode = nodes[i] as FolderNode;
              return findNode(folderNode.children, rest);
            }
          }
        }
        return null;
      };

      const source = findNode(structure, dragPath);
      const target = findNode(structure, dropPath);

      if (!source || !target) return;

      // Create a deep copy of the structure to avoid mutating the original
      const newStructure = JSON.parse(JSON.stringify(structure));

      // Find the nodes in the new structure
      const newSource = findNode(newStructure, dragPath);
      const newTarget = findNode(newStructure, dropPath);

      if (!newSource || !newTarget) return;

      // Remove from source
      const sourceIndex = newSource.parent.findIndex(
        (n) => n === newSource.node
      );
      newSource.parent.splice(sourceIndex, 1);

      // Add to target
      if (newTarget.node.type === "folder") {
        const targetFolder = newTarget.node as FolderNode;
        targetFolder.children.push(newSource.node);
      } else {
        // If target is a file, add to its parent
        const targetParent = findNode(newStructure, dropPath.slice(0, -1));
        if (targetParent) {
          targetParent.parent.push(newSource.node);
        }
      }

      setStructure(newStructure);
      onStructureChange?.(newStructure);
    },
    [structure, onStructureChange]
  );

  const toggleFolder = (folder: FolderNode) => {
    setStructure((prev) => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
          if (node.type === "folder" && node.name === folder.name) {
            return { ...node, isOpen: !node.isOpen };
          }
          if (node.type === "folder") {
            const folderNode = node as FolderNode;
            return { ...node, children: updateNode(folderNode.children) };
          }
          return node;
        });
      };
      return updateNode(prev);
    });
  };

  const deleteNode = async (node: TreeNode, parentPath: string[]) => {
    try {
      // Check if node has an ID first
      if (!node.id) {
        throw new Error(`${node.type} ID is missing`);
      }

      if (node.type === "file") {
        console.log("🔵 Deleting file:", node.id);

        // Delete file from database
        const response = await fetch("/api/rag/files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileId: node.id }),
        });

        console.log("🔵 File deleted:", response);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete file");
        }
      } else {
        // Delete folder from database
        const response = await fetch("/api/rag/folders", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderId: node.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete folder");
        }
      }

      // Update local structure
      const updateStructure = (
        nodes: TreeNode[],
        path: string[]
      ): TreeNode[] => {
        if (path.length === 0) {
          return nodes.filter((n) => n !== node);
        }

        return nodes.map((n) => {
          if (n.type === "folder") {
            return {
              ...n,
              children: updateStructure(n.children, path.slice(1)),
            };
          }
          return n;
        });
      };

      const newStructure = updateStructure(structure, parentPath);
      setStructure(newStructure);
      onStructureChange?.(newStructure);

      // Refresh the structure after successful deletion
      await onRefresh?.();

      toast.success(
        `${node.type === "file" ? "File" : "Folder"} deleted successfully`
      );
    } catch (error) {
      console.error(`Error deleting ${node.type}:`, error);
      toast.error(`Failed to delete ${node.type}`);
    }
  };

  const renderNode = (
    node: TreeNode,
    depth: number = 0,
    parentPath: string[] = []
  ) => {
    const isFolder = node.type === "folder";
    const Icon = isFolder ? FolderIcon : FileIcon;
    const Chevron =
      isFolder && (node as FolderNode).isOpen
        ? ChevronDownIcon
        : ChevronRightIcon;
    const currentPath = [...parentPath, node.name];

    return (
      <div
        key={node.name}
        className={cn(
          "flex flex-col",
          isOver && "bg-accent/50",
          isDragging && "opacity-50"
        )}
      >
        <div
          ref={(node) => {
            drag(node);
            drop(node);
          }}
          className={cn(
            "flex items-center gap-2 px-2 py-1 hover:bg-accent/50 rounded-md cursor-pointer group",
            "transition-colors duration-200"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node as FolderNode);
              onFolderSelect?.(node as FolderNode);
            } else {
              onFileSelect?.(node as FileNode);
            }
          }}
          onDragStart={() => {
            setDraggedNode({
              type: node.type,
              node,
              parentPath: currentPath,
            });
          }}
        >
          {isFolder && <Chevron className="h-4 w-4 text-muted-foreground" />}
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1">{node.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node, currentPath);
                }}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isFolder && (node as FolderNode).isOpen && (
          <div className="flex flex-col">
            {(node as FolderNode).children.map((child) =>
              renderNode(child, depth + 1, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col">
        {structure.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
