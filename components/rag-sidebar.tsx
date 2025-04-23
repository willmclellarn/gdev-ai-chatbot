'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileTextIcon, ArrowLeftIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { RagFolderStructure, type TreeNode, type FileNode, type FolderNode } from './rag/rag-folder-structure';

// Example folder structure data
const exampleStructure: TreeNode[] = [
  {
    type: 'folder' as const,
    name: 'Documents',
    isOpen: true,
    children: [
      {
        type: 'file' as const,
        name: 'example.txt',
        path: '/documents/example.txt'
      },
      {
        type: 'folder' as const,
        name: 'Reports',
        isOpen: false,
        children: [
          {
            type: 'file' as const,
            name: 'report1.pdf',
            path: '/documents/reports/report1.pdf'
          }
        ]
      }
    ]
  }
];

export function RagSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleFileSelect = (file: FileNode) => {
    console.log('Selected file:', file);
    // TODO: Implement file selection logic
  };

  const handleFolderSelect = (folder: FolderNode) => {
    console.log('Selected folder:', folder);
    // TODO: Implement folder selection logic
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Back to Chat
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <RagFolderStructure
          initialStructure={exampleStructure}
          onFileSelect={handleFileSelect}
          onFolderSelect={handleFolderSelect}
        />
      </SidebarContent>
      <SidebarFooter>
        {/* Add any footer content if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}
