'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus, Priority, UpdateTaskInput } from '@/types';
import DateTimePicker from './DateTimePicker';

const updateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  status: z.enum(['Todo', 'InProgress', 'Blocked', 'Completed', 'Canceled']),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueAt: z.string().optional(),
  estimatedDurationMinutes: z.number().min(0),
  allowParentAutoComplete: z.boolean(),
});

type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSubmit: (data: UpdateTaskInput) => void;
}

export default function EditTaskModal({ task, onClose, onSubmit }: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      allowParentAutoComplete: task.allowParentAutoComplete,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
    },
  });

  // Set form values when task changes
  useEffect(() => {
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('status', task.status);
    setValue('priority', task.priority);
    setValue('estimatedDurationMinutes', task.estimatedDurationMinutes);
    setValue('allowParentAutoComplete', task.allowParentAutoComplete);
    setValue('dueAt', task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '');
  }, [task, setValue]);

  const onSubmitHandler = async (data: UpdateTaskFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="input"
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="textarea"
              placeholder="Enter task description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select {...register('status')} id="status" className="select">
                <option value="Todo">Todo</option>
                <option value="InProgress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-danger-600">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select {...register('priority')} id="priority" className="select">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-danger-600">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Due Date and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date & Time
              </label>
              <DateTimePicker
                value={watch('dueAt') || ''}
                onChange={(value) => setValue('dueAt', value)}
                id="dueAt"
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">Select both date and time</p>
              {errors.dueAt && (
                <p className="mt-1 text-sm text-danger-600">{errors.dueAt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="estimatedDurationMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('estimatedDurationMinutes', { valueAsNumber: true })}
                  type="number"
                  id="estimatedDurationMinutes"
                  min="0"
                  className="input pl-10 w-full"
                  placeholder="30"
                />
              </div>
              {errors.estimatedDurationMinutes && (
                <p className="mt-1 text-sm text-danger-600">{errors.estimatedDurationMinutes.message}</p>
              )}
            </div>
          </div>

          {/* Allow Parent Auto Complete */}
          <div className="flex items-center space-x-2">
            <input
              {...register('allowParentAutoComplete')}
              type="checkbox"
              id="allowParentAutoComplete"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="allowParentAutoComplete" className="text-sm text-gray-700">
              Allow parent auto-complete (completing parent will auto-complete children)
            </label>
          </div>
          {errors.allowParentAutoComplete && (
            <p className="mt-1 text-sm text-danger-600">{errors.allowParentAutoComplete.message}</p>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-danger-600 mr-2" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
