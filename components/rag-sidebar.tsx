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

export function RagSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <FileTextIcon className="h-4 w-4" />
              <span>Context Files</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* TODO: Add list of context files here */}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Add any footer content if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}
