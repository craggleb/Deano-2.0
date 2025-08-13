'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock } from 'lucide-react';
import { TaskStatus, Priority, CreateTaskInput } from '@/types';

const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  status: z.enum(['Todo', 'InProgress', 'Blocked', 'Completed', 'Canceled']).default('Todo'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueAt: z.string().optional(),
  estimatedDurationMinutes: z.number().min(0).default(30),
  allowParentAutoComplete: z.boolean().default(false),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
}

export default function CreateTaskModal({ onClose, onSubmit }: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get tomorrow's date in datetime-local format
  const getTomorrowDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM tomorrow
    return tomorrow.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: 'Todo',
      priority: 'Medium',
      estimatedDurationMinutes: 30,
      allowParentAutoComplete: false,
      dueAt: getTomorrowDateTime(),
    },
  });

  // Set default date when component mounts
  useEffect(() => {
    setValue('dueAt', getTomorrowDateTime());
  }, [setValue]);

  const onSubmitHandler = async (data: CreateTaskFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('dueAt')}
                  type="datetime-local"
                  id="dueAt"
                  className="input pl-10"
                />
              </div>
              {errors.dueAt && (
                <p className="mt-1 text-sm text-danger-600">{errors.dueAt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="estimatedDurationMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('estimatedDurationMinutes', { valueAsNumber: true })}
                  type="number"
                  id="estimatedDurationMinutes"
                  min="0"
                  className="input pl-10"
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
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
