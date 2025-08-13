'use client';

import React from 'react';
import { TaskLabel } from '../types';

interface TaskLabelsProps {
  taskLabels?: TaskLabel[];
  className?: string;
}

export default function TaskLabels({ taskLabels = [], className = '' }: TaskLabelsProps) {
  if (!taskLabels || taskLabels.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {taskLabels.map((taskLabel) => (
        <span
          key={taskLabel.id}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${taskLabel.label.colour}20`,
            color: taskLabel.label.colour,
            border: `1px solid ${taskLabel.label.colour}40`
          }}
        >
          <div
            className="w-2 h-2 rounded-full mr-1"
            style={{ backgroundColor: taskLabel.label.colour }}
          />
          {taskLabel.label.name}
        </span>
      ))}
    </div>
  );
}
