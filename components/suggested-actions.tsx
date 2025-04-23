'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';
import { cn } from '@/lib/utils';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

// Category colors for consistent styling
const categoryColors = {
  Sales: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300',
  Marketing: 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300',
  Mindset: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300',
  Negotiation: 'bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300',
  Communication: 'bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-300',
  Leadership: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300',
  'Business-building': 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300',
};

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Sales',
      label: 'strategies and techniques',
      action: 'Give me a detailed breakdown of the most effective sales strategies and techniques. Include specific examples and step-by-step implementation guides.',
      category: 'Sales',
    },
    {
      title: 'Marketing',
      label: 'campaigns and growth',
      action: 'Provide a comprehensive marketing strategy framework. Include specific tactics for different channels and metrics to track success.',
      category: 'Marketing',
    },
    {
      title: 'Mindset',
      label: 'and personal development',
      action: 'Outline the critical mindset shifts needed for success. Include daily practices and exercises to develop an entrepreneurial mindset.',
      category: 'Mindset',
    },
    {
      title: 'Negotiation',
      label: 'skills and tactics',
      action: 'Teach me advanced negotiation techniques with real-world examples. Include scripts and responses for common scenarios.',
      category: 'Negotiation',
    },
    {
      title: 'Communication',
      label: 'and influence',
      action: 'Break down the most effective communication frameworks. Include specific phrases and techniques for different business situations.',
      category: 'Communication',
    },
    {
      title: 'Leadership',
      label: 'and team management',
      action: 'Provide a detailed leadership development plan. Include specific actions to build and manage high-performing teams.',
      category: 'Leadership',
    },
    {
      title: 'Business-building',
      label: 'strategy and execution',
      action: 'Give me a step-by-step business growth framework. Include specific milestones and KPIs to track progress.',
      category: 'Business-building',
    },
    {
      title: 'Email',
      label: 'templates and sequences',
      action: 'Create high-converting email templates and sequences. Include subject lines, body copy, and follow-up strategies.',
      category: 'Communication',
    },
    {
      title: 'Calls',
      label: 'scripts and frameworks',
      action: 'Provide proven call scripts and frameworks. Include objection handling and closing techniques.',
      category: 'Communication',
    },
    {
      title: 'Scripts',
      label: 'and conversation guides',
      action: 'Give me detailed conversation scripts for different scenarios. Include word-for-word examples and variations.',
      category: 'Communication',
    },
  ];

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
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className={cn(
              "text-left border-2 rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start transition-all duration-200",
              categoryColors[suggestedAction.category as keyof typeof categoryColors]
            )}
          >
            <span className="font-bold text-base">{suggestedAction.title}</span>
            <span className="text-sm font-medium">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
