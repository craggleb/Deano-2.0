'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { TaskStatus, Priority, CreateTaskInput, Task } from '@/types';
import DateTimePicker from './DateTimePicker';
import LabelManager from './LabelManager';

const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  status: z.enum(['Todo', 'InProgress', 'Blocked', 'Completed', 'Canceled']).default('Todo'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueAt: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    try {
      const date = new Date(val);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }, 'Please enter a valid date and time'),
  estimatedDurationMinutes: z.number().min(0).default(30),
  allowParentAutoComplete: z.boolean().default(false),
  parentId: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => void;
  parentTaskId?: string;
}

export default function CreateTaskModal({ onClose, onSubmit, parentTaskId }: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [showDependencySelector, setShowDependencySelector] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Get tomorrow's date in datetime-local format
  const getTomorrowDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0); // Set to 5 PM tomorrow
    return tomorrow.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: 'Todo',
      priority: 'Medium',
      estimatedDurationMinutes: 30,
      allowParentAutoComplete: false,
      dueAt: getTomorrowDateTime(),
      parentId: parentTaskId || '',
      dependencies: [],
    },
  });

  // Set default date when component mounts
  useEffect(() => {
    setValue('dueAt', getTomorrowDateTime());
    if (parentTaskId) {
      setValue('parentId', parentTaskId);
    }
  }, [setValue, parentTaskId]);

  // Fetch all tasks for parent/dependency selection
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const data = await response.json();
          setAllTasks(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  const onSubmitHandler = async (data: CreateTaskFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const taskData = {
        ...data,
        dependencies: selectedDependencies,
        labelIds: selectedLabels,
      };
      await onSubmit(taskData);
      reset();
      setSelectedDependencies([]);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitHandler)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="input w-full"
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              className="textarea w-full"
              placeholder="Enter task description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select {...register('status')} id="status" className="select w-full">
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
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select {...register('priority')} id="priority" className="select w-full">
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
                error={errors.dueAt?.message}
              />
              <p className="mt-1 text-xs text-gray-500">Select both date and time</p>
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

          {/* Parent Task Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Task
            </label>
            <div className="flex space-x-2">
              <select
                {...register('parentId')}
                className="select flex-1"
              >
                <option value="">No parent task</option>
                {allTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowParentSelector(true)}
                className="btn btn-secondary"
              >
                Browse
              </button>
            </div>
            {errors.parentId && (
              <p className="mt-1 text-sm text-danger-600">{errors.parentId.message}</p>
            )}
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dependencies
            </label>
            <div className="space-y-2">
              {selectedDependencies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDependencies.map((taskId) => {
                    const task = allTasks.find(t => t.id === taskId);
                    return task ? (
                      <span key={taskId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                        {task.title}
                        <button
                          type="button"
                          onClick={() => setSelectedDependencies(prev => prev.filter(id => id !== taskId))}
                          className="ml-1 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowDependencySelector(true)}
                className="btn btn-secondary"
              >
                Add Dependencies
              </button>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            <LabelManager
              selectedLabels={selectedLabels}
              onLabelsChange={setSelectedLabels}
              showCreateButton={false}
            />
          </div>

          {/* Allow Parent Auto Complete */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              {...register('allowParentAutoComplete')}
              type="checkbox"
              id="allowParentAutoComplete"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            />
            <div>
              <label htmlFor="allowParentAutoComplete" className="text-sm font-medium text-gray-700">
                Allow parent auto-complete
              </label>
              <p className="text-xs text-gray-600 mt-1">
                When enabled, completing this parent task will automatically complete all its child tasks
              </p>
            </div>
          </div>
          {errors.allowParentAutoComplete && (
            <p className="mt-1 text-sm text-danger-600">{errors.allowParentAutoComplete.message}</p>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-danger-600 mr-3" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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

      {/* Parent Task Selector Modal */}
      {showParentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Select Parent Task</h2>
              <button
                onClick={() => setShowParentSelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    watch('parentId') === '' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setValue('parentId', '');
                    setShowParentSelector(false);
                  }}
                >
                  <h4 className="text-sm font-medium text-gray-900">No parent task</h4>
                  <p className="text-xs text-gray-600 mt-1">This will be a top-level task</p>
                </div>
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      watch('parentId') === task.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setValue('parentId', task.id);
                      setShowParentSelector(false);
                    }}
                  >
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dependency Selector Modal */}
      {showDependencySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Select Dependencies</h2>
              <button
                onClick={() => setShowDependencySelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDependencies.includes(task.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedDependencies(prev => 
                        prev.includes(task.id) 
                          ? prev.filter(id => id !== task.id)
                          : [...prev, task.id]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(task.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDependencySelector(false)}
                  className="btn btn-secondary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
