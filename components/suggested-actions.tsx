"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { memo } from "react";
import { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { useUserOrg } from "@/app/hooks/useAuth";
import { useOrganizationPreferences } from "@/app/hooks/useOrganizationPreferences";

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers["append"];
}

// Single color for all suggested actions
const buttonStyle =
  "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300";

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const orgIds = useUserOrg();
  const { preferences, isLoading } = useOrganizationPreferences(
    orgIds[0] || null
  );

  const suggestedActions =
    preferences?.chatSuggestedTopics?.map((topic) => ({
      title: topic.split(":")[0] || "Topic",
      label: topic.split(":")[1] || "",
      action: topic,
    })) || [];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-3 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
                content: suggestedAction.action,
              });
            }}
            className={cn(
              "text-left border-2 rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start transition-all duration-200",
              buttonStyle
            )}
          >
            <span className="font-bold text-base">{suggestedAction.title}</span>
            <span className="text-sm font-medium">{suggestedAction.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
