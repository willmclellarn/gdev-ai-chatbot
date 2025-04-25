"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileTextIcon, ArrowLeftIcon, DatabaseIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  RagFolderStructure,
  type TreeNode,
  type FileNode,
  type FolderNode,
} from "./rag/rag-folder-structure";
import { RagIndexManager } from "./rag/rag-index-manager";
import { RagFileManager } from "./rag/rag-file-manager";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Example folder structure data
const exampleStructure: TreeNode[] = [
  {
    type: "folder" as const,
    name: "Documents",
    isOpen: true,
    children: [
      {
        type: "file" as const,
        name: "example.txt",
        path: "/documents/example.txt",
      },
      {
        type: "folder" as const,
        name: "Reports",
        isOpen: false,
        children: [
          {
            type: "file" as const,
            name: "report1.pdf",
            path: "/documents/reports/report1.pdf",
          },
        ],
      },
    ],
  },
];

interface RagSidebarProps {
  children?: React.ReactNode;
}

export function RagSidebar({ children }: RagSidebarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [activeTab, setActiveTab] = useState<"files" | "index">("files");
  const [structure, setStructure] = useState<TreeNode[]>(exampleStructure);

  const handleFileSelect = (file: FileNode) => {
    console.log("Selected file:", file);
    // TODO: Implement file selection logic
  };

  const handleFolderSelect = (folder: FolderNode) => {
    console.log("Selected folder:", folder);
    // TODO: Implement folder selection logic
  };

  return (
    <div className="flex h-screen">
      <Sidebar className="h-full border-r w-[24rem] shrink-0">
        <SidebarHeader className="border-b">
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center px-4 py-2">
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="text-lg font-semibold hover:bg-muted rounded-md cursor-pointer">
                  Back to Chat
                </span>
              </Link>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col h-full">
            <div className="flex border-b">
              <Button
                variant="ghost"
                className={`flex-1 rounded-none ${activeTab === "files" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("files")}
              >
                <FileTextIcon className="h-4 w-4 mr-2" />
                Files
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 rounded-none ${activeTab === "index" ? "border-b-2 border-primary" : ""}`}
                onClick={() => setActiveTab("index")}
              >
                <DatabaseIcon className="h-4 w-4 mr-2" />
                Index
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {activeTab === "files" ? (
                <DndProvider backend={HTML5Backend}>
                  <div className="flex flex-col gap-4">
                    <RagFileManager
                      structure={structure}
                      onStructureChange={setStructure}
                      onFileSelect={handleFileSelect}
                      onFolderSelect={handleFolderSelect}
                    />
                    <RagFolderStructure
                      initialStructure={structure}
                      onFileSelect={handleFileSelect}
                      onFolderSelect={handleFolderSelect}
                      onStructureChange={setStructure}
                    />
                  </div>
                </DndProvider>
              ) : (
                <RagIndexManager />
              )}
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>{/* Add any footer content if needed */}</SidebarFooter>
      </Sidebar>
      {children}
    </div>
  );
}
