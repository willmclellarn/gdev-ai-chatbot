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
import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";

interface RagSidebarProps {
  children?: React.ReactNode;
}

export function RagSidebar({ children }: RagSidebarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [activeTab, setActiveTab] = useState<"files" | "index">("files");
  const [structure, setStructure] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch folders and files when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch folders
        const foldersResponse = await fetch("/api/rag/folders");
        if (!foldersResponse.ok) {
          throw new Error("Failed to fetch folders");
        }
        const foldersData = await foldersResponse.json();

        // Fetch files
        const filesResponse = await fetch("/api/rag/files");
        if (!filesResponse.ok) {
          throw new Error("Failed to fetch files");
        }
        const filesData = await filesResponse.json();

        // Transform folders and files into TreeNode structure
        const transformedStructure: TreeNode[] = [];

        // Add personal folders
        if (foldersData.personalFolders) {
          foldersData.personalFolders.forEach((folder: any) => {
            const folderNode: FolderNode = {
              type: "folder",
              name: folder.name,
              children: [],
              isOpen: false,
            };
            transformedStructure.push(folderNode);
          });
        }

        // Add organization folders
        if (foldersData.organizationFolders) {
          foldersData.organizationFolders.forEach((folder: any) => {
            const folderNode: FolderNode = {
              type: "folder",
              name: folder.name,
              children: [],
              isOpen: false,
            };
            transformedStructure.push(folderNode);
          });
        }

        // Add personal files
        if (filesData.personalFiles) {
          filesData.personalFiles.forEach((file: any) => {
            const fileNode: FileNode = {
              type: "file",
              name: file.name,
              path: file.path,
              size: file.size,
            };
            transformedStructure.push(fileNode);
          });
        }

        // Add organization files
        if (filesData.organizationFiles) {
          filesData.organizationFiles.forEach((file: any) => {
            const fileNode: FileNode = {
              type: "file",
              name: file.name,
              path: file.path,
              size: file.size,
            };
            transformedStructure.push(fileNode);
          });
        }

        setStructure(transformedStructure);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeTab === "files" ? (
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
