'use client';

import { Repeat, Calendar } from 'lucide-react';
import { Task, RecurrencePattern } from '@/types';

interface RecurringTaskBadgeProps {
  task: Task;
}

export default function RecurringTaskBadge({ task }: RecurringTaskBadgeProps) {
  if (!task.isRecurring || !task.recurrencePattern) {
    return null;
  }

  let pattern: RecurrencePattern;
  try {
    pattern = JSON.parse(task.recurrencePattern);
  } catch {
    return null;
  }

  const getRecurrenceDescription = (pattern: RecurrencePattern) => {
    const { type, interval } = pattern;
    switch (type) {
      case 'Daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'Weekly':
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'Monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case 'Yearly':
        return interval === 1 ? 'Yearly' : `Every ${interval} years`;
      case 'Custom':
        return 'Custom';
      default:
        return 'Recurring';
    }
  };

  const getNextRecurrenceText = () => {
    if (!task.nextRecurrenceDate) return null;
    
    const nextDate = new Date(task.nextRecurrenceDate);
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return nextDate.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
        <Repeat className="w-3 h-3" />
        <span className="font-medium">{getRecurrenceDescription(pattern)}</span>
      </div>
      
      {task.nextRecurrenceDate && (
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full">
          <Calendar className="w-3 h-3" />
          <span>Next: {getNextRecurrenceText()}</span>
        </div>
      )}
    </div>
  );
}
