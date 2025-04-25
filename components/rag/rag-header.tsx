"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { useState } from "react";

import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, DownloadIcon, ChevronDownIcon } from "../icons";
import { useSidebar } from "../ui/sidebar";
import { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { embeddingModels } from "@/lib/ai/models";
import { CheckCircleFillIcon, UserIcon, UsersIcon, GlobeIcon } from "../icons";
import { useAdmin } from "@/hooks/use-admin";
import { useGlobalState } from "@/hooks/use-global-state";
import { useOrganizations } from "@/app/hooks/useOrganizations";

interface RAGHeaderProps {
  hasChanges?: boolean;
  onSaveDefault?: () => void;
}

function PureRAGHeader({ hasChanges = false, onSaveDefault }: RAGHeaderProps) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const {
    state: { embeddingModel },
    setState: setEmbeddingModel,
  } = useGlobalState();
  const [resourceScope, setResourceScope] = useState<"user" | "org" | "admin">(
    "user"
  );
  const { isAdmin } = useAdmin();
  const { organizations, isLoading } = useOrganizations();
  const {
    state: { selectedOrgId },
    setState: setSelectedOrgId,
  } = useGlobalState();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-50">
      <SidebarToggle className="shrink-0" />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 shrink-0 md:px-2 px-2 md:h-[34px] ml-auto md:ml-0"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="order-1 md:order-2 shrink-0 md:px-2 md:h-[34px] whitespace-nowrap"
            >
              {embeddingModel.name}
              <span className="ml-1">
                <ChevronDownIcon />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[300px]">
            {embeddingModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => setEmbeddingModel({ embeddingModel: model })}
                className="gap-4 group/item flex flex-row justify-between items-center"
                data-active={model.id === embeddingModel.id}
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{model.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {model.description}
                  </div>
                </div>
                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="order-1 md:order-3 shrink-0 md:px-2 md:h-[34px] whitespace-nowrap"
            >
              {resourceScope === "user" ? (
                <UserIcon />
              ) : resourceScope === "org" ? (
                <UsersIcon />
              ) : (
                <GlobeIcon />
              )}
              <span className="ml-2">
                {resourceScope === "user"
                  ? "Personal"
                  : resourceScope === "org"
                    ? "Organization"
                    : "System-wide"}
              </span>
              <span className="ml-1">
                <ChevronDownIcon />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuItem
              onSelect={() => setResourceScope("user")}
              className="gap-4 group/item flex flex-row justify-between items-center"
              data-active={resourceScope === "user"}
            >
              <div className="flex flex-col gap-1 items-start">
                <div>Personal</div>
                <div className="text-xs text-muted-foreground">
                  Only you can access these documents
                </div>
              </div>
              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setResourceScope("org")}
              className="gap-4 group/item flex flex-row justify-between items-center"
              data-active={resourceScope === "org"}
            >
              <div className="flex flex-col gap-1 items-start">
                <div>Organization</div>
                <div className="text-xs text-muted-foreground">
                  All organization members can access these documents
                </div>
              </div>
              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setResourceScope("admin")}
              className="gap-4 group/item flex flex-row justify-between items-center"
              data-active={resourceScope === "admin"}
            >
              <div className="flex flex-col gap-1 items-start">
                <div>System-wide</div>
                <div className="text-xs text-muted-foreground">
                  Available to all users in the system
                </div>
              </div>
              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="order-1 md:order-4 shrink-0 md:px-2 md:h-[34px] whitespace-nowrap"
              >
                {isLoading
                  ? "Loading..."
                  : selectedOrgId
                    ? organizations.find((org) => org.id === selectedOrgId)
                        ?.name || "Select Org"
                    : "Select Org"}
                <span className="ml-1">
                  <ChevronDownIcon />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onSelect={() => setSelectedOrgId({ selectedOrgId: org.id })}
                  className="gap-4 group/item flex flex-row justify-between items-center"
                  data-active={org.id === selectedOrgId}
                >
                  <div className="flex flex-col gap-1 items-start">
                    <div>{org.name}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {hasChanges && onSaveDefault && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                className="order-1 md:order-5 shrink-0 md:px-2 md:h-[34px] whitespace-nowrap"
                onClick={onSaveDefault}
              >
                <DownloadIcon />
                <span className="ml-2">Save Default</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Save current chunking settings as default
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}

export const RAGHeader = memo(PureRAGHeader);
