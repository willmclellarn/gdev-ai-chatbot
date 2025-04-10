'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { useState } from 'react';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { embeddingModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  UserIcon,
  UsersIcon,
} from './icons';

function PureRAGHeader() {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const [embeddingModel, setEmbeddingModel] = useState(embeddingModels[0]);
  const [isOrganization, setIsOrganization] = useState(false);

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="order-1 md:order-2 md:px-2 md:h-[34px]"
          >
            {embeddingModel.name}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[300px]">
          {embeddingModels.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => setEmbeddingModel(model)}
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
            className="order-1 md:order-3 md:px-2 md:h-[34px]"
          >
            {isOrganization ? <UsersIcon /> : <UserIcon />}
            <span className="ml-2">
              {isOrganization ? 'Organization' : 'Personal'}
            </span>
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem
            onSelect={() => setIsOrganization(false)}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={!isOrganization}
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
            onSelect={() => setIsOrganization(true)}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={isOrganization}
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
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export const RAGHeader = memo(PureRAGHeader);
