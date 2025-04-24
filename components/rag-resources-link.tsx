"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Loading } from "./loading";

export function RagResourcesLink() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push("/rag-resources");
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="order-1 md:order-4 px-2 h-fit"
            onClick={handleClick}
          >
            <Grid className="h-4 w-4" />
            <span className="sr-only md:not-sr-only ml-2">RAG Resources</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>RAG Resources</TooltipContent>
      </Tooltip>
      {isLoading && <Loading />}
    </>
  );
}
