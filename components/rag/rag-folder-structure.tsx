"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  GripVerticalIcon,
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
  folderId?: string | null;
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

  // Sync structure with initialStructure when it changes
  useEffect(() => {
    // Filter out files that should be in folders from the root level
    const organizeStructure = (nodes: TreeNode[]): TreeNode[] => {
      // First, separate folders and files
      const folders = nodes.filter(
        (node): node is FolderNode => node.type === "folder"
      );
      const files = nodes.filter(
        (node): node is FileNode => node.type === "file"
      );

      console.log("🟡 Organizing structure:", {
        totalNodes: nodes.length,
        folders: folders.map((f) => ({
          id: f.id,
          name: f.name,
          childrenCount: f.children.length,
        })),
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          folderId: f.folderId,
        })),
      });

      // For each file, check if it belongs in a folder
      const rootFiles = files.filter((file) => {
        // If the file has a folderId, it should be in that folder
        const isInFolder = folders.some((folder) => {
          const belongsToFolder = file.folderId === folder.id;
          console.log("🟡 Checking file in folder:", {
            fileId: file.id,
            fileName: file.name,
            fileFolderId: file.folderId,
            folderId: folder.id,
            folderName: folder.name,
            isMatch: belongsToFolder,
          });

          // If it belongs to this folder, add it to the folder's children
          if (
            belongsToFolder &&
            !folder.children.some((child) => child.id === file.id)
          ) {
            folder.children.push(file);
          }
          return belongsToFolder;
        });

        console.log("🟡 File location check:", {
          fileId: file.id,
          fileName: file.name,
          folderId: file.folderId,
          isInFolder,
          shouldShowAtRoot: !isInFolder,
        });

        return !isInFolder;
      });

      console.log("🟡 After organization:", {
        rootFiles: rootFiles.map((f) => ({
          id: f.id,
          name: f.name,
          folderId: f.folderId,
        })),
        folders: folders.map((f) => ({
          id: f.id,
          name: f.name,
          children: f.children.map((c) => ({
            id: c.id,
            name: c.name,
            folderId: (c as FileNode).folderId,
          })),
        })),
      });

      // Return folders first, then root-level files
      return [
        ...folders.map((folder) => ({
          ...folder,
          children: organizeStructure(folder.children),
        })),
        ...rootFiles,
      ];
    };

    setStructure(organizeStructure(initialStructure));
  }, [initialStructure]);

  const moveNode = useCallback(
    async (sourcePath: string[], targetPath: string[]) => {
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

      try {
        // Create a deep copy of the structure to avoid mutating the original
        const newStructure = JSON.parse(JSON.stringify(structure));

        // Find the source node and its parent
        const source = findNode(newStructure, sourcePath);
        if (!source) return;

        // Find the target node and its parent
        const target = findNode(newStructure, targetPath);
        if (!target) return;

        // If moving a file into a folder, update the database and open the folder
        if (source.node.type === "file" && target.node.type === "folder") {
          console.log("🔵 Moving file to folder:", {
            fileId: source.node.id,
            folderId: target.node.id,
          });

          const response = await fetch("/api/rag/files/move", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileId: source.node.id,
              folderId: target.node.id,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update file location");
          }

          // Update the file's folderId in our local state
          source.node.folderId = target.node.id;

          // Open the target folder
          const targetFolder = target.node as FolderNode;
          targetFolder.isOpen = true;

          // Remove the source node from its current location
          const sourceIndex = source.parent.findIndex(
            (n) => n.id === source.node.id
          );
          if (sourceIndex === -1) return;
          const [movedNode] = source.parent.splice(sourceIndex, 1);

          // Add the node to the target folder's children
          targetFolder.children.push(movedNode);
        } else {
          // Handle other move cases (folder to folder, etc.)
          const sourceIndex = source.parent.findIndex(
            (n) => n.id === source.node.id
          );
          if (sourceIndex === -1) return;
          const [movedNode] = source.parent.splice(sourceIndex, 1);

          if (target.node.type === "folder") {
            const targetFolder = target.node as FolderNode;
            targetFolder.children.push(movedNode);
          } else {
            const targetParent = findNode(
              newStructure,
              targetPath.slice(0, -1)
            );
            if (targetParent) {
              targetParent.parent.push(movedNode);
            }
          }
        }

        setStructure(newStructure);
        onStructureChange?.(newStructure);
        toast.success("File moved successfully");

        // Refresh the structure to ensure we have the latest data
        await onRefresh?.();
      } catch (error) {
        console.error("Error moving file:", error);
        toast.error("Failed to move file");
        // Refresh to ensure UI is in sync with backend
        await onRefresh?.();
      }
    },
    [structure, onStructureChange, onRefresh]
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

  // Create a stable drag source hook
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null);

  const DraggableNode = useCallback(
    ({
      node,
      depth,
      parentPath,
    }: {
      node: TreeNode;
      depth: number;
      parentPath: string[];
    }) => {
      const isFolder = node.type === "folder";
      const Icon = isFolder ? FolderIcon : FileIcon;
      const Chevron =
        isFolder && (node as FolderNode).isOpen
          ? ChevronDownIcon
          : ChevronRightIcon;
      const currentPath = [...parentPath, node.name];

      const [{ isDragging }, drag] = useDrag(
        () => ({
          type: "node",
          item: { type: node.type, node, parentPath: currentPath },
          collect: (monitor) => ({
            isDragging: monitor.isDragging(),
          }),
        }),
        [node, currentPath]
      );

      const [{ isOver }, drop] = useDrop(
        () => ({
          accept: "node",
          drop: (item: DraggableItem) => {
            if (item.parentPath.join("/") !== currentPath.join("/")) {
              moveNode(item.parentPath, currentPath);
            }
          },
          collect: (monitor) => ({
            isOver: monitor.isOver(),
          }),
        }),
        [currentPath, moveNode]
      );

      const ref = (element: HTMLDivElement | null) => {
        drag(element);
        drop(element);
      };

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
            ref={ref}
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
          >
            <GripVerticalIcon
              className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => e.stopPropagation()} // Prevent click event when dragging
            />
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
              {(node as FolderNode).children.map((child) => (
                <DraggableNode
                  key={child.name}
                  node={child}
                  depth={depth + 1}
                  parentPath={currentPath}
                />
              ))}
            </div>
          )}
        </div>
      );
    },
    [moveNode, onFileSelect, onFolderSelect, toggleFolder, deleteNode]
  );

  const renderNode = useCallback(
    (node: TreeNode, depth: number = 0, parentPath: string[] = []) => (
      <DraggableNode
        key={node.name}
        node={node}
        depth={depth}
        parentPath={parentPath}
      />
    ),
    []
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col">
        {structure.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
