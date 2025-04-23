'use client';

import { useState } from 'react';
import { FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define types for our folder structure
export interface FileNode {
  type: 'file';
  name: string;
  path: string;
}

export interface FolderNode {
  type: 'folder';
  name: string;
  children: (FileNode | FolderNode)[];
  isOpen?: boolean;
}

export type TreeNode = FileNode | FolderNode;

interface RagFolderStructureProps {
  onFileSelect?: (file: FileNode) => void;
  onFolderSelect?: (folder: FolderNode) => void;
  initialStructure?: TreeNode[];
}

export function RagFolderStructure({
  onFileSelect,
  onFolderSelect,
  initialStructure = [],
}: RagFolderStructureProps) {
  const [structure, setStructure] = useState<TreeNode[]>(initialStructure);

  const toggleFolder = (folder: FolderNode) => {
    setStructure(prev => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.type === 'folder' && node.name === folder.name) {
            return { ...node, isOpen: !node.isOpen };
          }
          if (node.type === 'folder') {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return updateNode(prev);
    });
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isFolder = node.type === 'folder';
    const Icon = isFolder ? FolderIcon : FileIcon;
    const Chevron = isFolder && node.isOpen ? ChevronDownIcon : ChevronRightIcon;

    return (
      <div key={node.name} className="flex flex-col">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 hover:bg-accent/50 rounded-md cursor-pointer",
            "transition-colors duration-200"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node);
              onFolderSelect?.(node);
            } else {
              onFileSelect?.(node);
            }
          }}
        >
          {isFolder && <Chevron className="h-4 w-4 text-muted-foreground" />}
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{node.name}</span>
        </div>
        {isFolder && node.isOpen && (
          <div className="flex flex-col">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-medium">Files</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            // TODO: Implement add file/folder functionality
          }}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col">
        {structure.map(node => renderNode(node))}
      </div>
    </div>
  );
}
