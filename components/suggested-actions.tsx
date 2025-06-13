'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Project Summary',
      label: 'Summarize the current status of all my projects',
      action: 'Summarize the current status of all my projects',
    },
    {
      title: 'Project Milestones',
      label: 'Show all milestones for a selected project',
      action: 'Show all milestones for a selected project, including their due dates.',
    },
    {
      title: 'Shift Assignments',
      label: 'List shifts and assigned employees for a week',
      action: 'List all shifts and the employees assigned to each shift for the upcoming week.',
    },
    {
      title: 'Upcoming Operations',
      label: 'Show operations starting in the next 7 days',
      action: 'Show all operations scheduled to start in the next 7 days.',
    },
    {
      title: 'Resource Utilization',
      label: 'Show utilization of a specific resource',
      action: 'Show the utilization of a specific resource across all operations in the next 7 days.',
    },
    {
      title: 'Operation Assignment Details',
      label: 'List all assignments for a specific operation',
      action: 'List all employee assignments for a specific operation, including dates and assigned capacity.',
    },
    {
      title: 'Gantt Chart',
      label: 'View the Gantt chart for selected projects',
      action: 'Show a Gantt chart for the selected projects, including networks, milestones, and operations.',
    },
    {
      title: 'Employee Qualifications',
      label: 'Show all employees qualified for a specific resource',
      action: 'Show all employees who are qualified to operate a specific resource.',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
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
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
