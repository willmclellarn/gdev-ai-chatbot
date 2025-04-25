"use client";

import { useState, useCallback, useRef } from "react";
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

// Define types for our folder structure
export interface FileNode {
  type: "file";
  name: string;
  path: string;
  size?: number;
}

export interface FolderNode {
  type: "folder";
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
}: RagFolderStructureProps) {
  const [structure, setStructure] = useState<TreeNode[]>(initialStructure);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<DraggableItem | null>(null);

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
      moveNode(item.parentPath, draggedNode?.parentPath || []);
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

      // Remove from source
      const sourceIndex = source.parent.findIndex((n) => n === source.node);
      source.parent.splice(sourceIndex, 1);

      // Add to target
      if (target.node.type === "folder") {
        const targetFolder = target.node as FolderNode;
        targetFolder.children.push(source.node);
      } else {
        // If target is a file, add to its parent
        const targetParent = findNode(structure, dropPath.slice(0, -1));
        if (targetParent) {
          targetParent.parent.push(source.node);
        }
      }

      setStructure([...structure]);
      onStructureChange?.(structure);
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
        ref={dropRef}
        key={node.name}
        className={cn(
          "flex flex-col",
          isOver && "bg-accent/50",
          isDragging && "opacity-50"
        )}
      >
        <div
          ref={dragRef}
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
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
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
