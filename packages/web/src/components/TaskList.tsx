'use client';

import { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import { Task, TaskStatus, Priority } from '@/types';
import { isAfter, isBefore } from 'date-fns';
import { formatLocalDateTime } from '@/lib/dateUtils';
import EditTaskModal from './EditTaskModal';
import SubtaskManager from './SubtaskManager';
import DependencyManager from './DependencyManager';
import TaskLabels from './TaskLabels';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onTaskUpdate: () => void;
}

export default function TaskList({ tasks, loading, onTaskUpdate }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [expandedDependencies, setExpandedDependencies] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleSubtasks = (taskId: string) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const toggleDependencies = (taskId: string) => {
    const newExpanded = new Set(expandedDependencies);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedDependencies(newExpanded);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to update task: ${response.status} ${response.statusText}`);
      }

      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update task status');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'normal' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to complete task: ${response.status} ${response.statusText}`);
      }

      onTaskUpdate();
    } catch (error) {
      console.error('Error completing task:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete task');
    }
  };

  const handleReopenTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to reopen task: ${response.status} ${response.statusText}`);
      }

      onTaskUpdate();
    } catch (error) {
      console.error('Error reopening task:', error);
      alert(error instanceof Error ? error.message : 'Failed to reopen task');
    }
  };

  const handleEditTask = async (taskData: any) => {
    if (!editingTask) return;
    
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to update task: ${response.status} ${response.statusText}`);
      }

      setEditingTask(null);
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to delete task: ${response.status} ${response.statusText}`);
      }

      setEditingTask(null);
      onTaskUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete task');
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'InProgress':
        return <Clock className="w-4 h-4 text-primary-600" />;
      case 'Blocked':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'priority-high';
      case 'Medium':
        return 'priority-medium';
      case 'Low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Todo':
        return 'status-todo';
      case 'InProgress':
        return 'status-inprogress';
      case 'Blocked':
        return 'status-blocked';
      case 'Completed':
        return 'status-completed';
      case 'Canceled':
        return 'status-canceled';
      default:
        return 'status-todo';
    }
  };

  const formatStatusDisplay = (status: TaskStatus) => {
    switch (status) {
      case 'InProgress':
        return 'In Progress';
      default:
        return status;
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueAt) return false;
    return isAfter(new Date(), new Date(task.dueAt));
  };

  const isDueSoon = (task: Task) => {
    if (!task.dueAt) return false;
    const dueDate = new Date(task.dueAt);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isBefore(dueDate, tomorrow) && !isOverdue(task);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading tasks...</span>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">Create your first task to get started!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <div className="card-content">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(task.status)}
                    <span className={`badge ${getStatusColor(task.status)}`}>
                      {formatStatusDisplay(task.status)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {isOverdue(task) && (
                        <span className="badge badge-danger">Overdue</span>
                      )}
                      {isDueSoon(task) && (
                        <span className="badge badge-warning">Due Soon</span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Task Labels */}
                    <TaskLabels taskLabels={task.taskLabels} className="mb-2" />

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {task.dueAt && (
                        <span>
                          Due: {formatLocalDateTime(task.dueAt)}
                        </span>
                      )}
                      <span>{task.estimatedDurationMinutes}m</span>
                      <button
                        onClick={() => toggleSubtasks(task.id)}
                        className="hover:text-gray-700 hover:underline cursor-pointer"
                      >
                        {task.children?.length || 0} subtasks
                      </button>
                      <button
                        onClick={() => toggleDependencies(task.id)}
                        className="hover:text-gray-700 hover:underline cursor-pointer"
                      >
                        {task.dependencies?.length || 0} dependencies | {task.blockingTasks?.length || 0} dependent tasks
                      </button>
                    </div>

                    {/* Subtasks and Dependencies - only render when expanded */}
                    {(expandedSubtasks.has(task.id) || expandedDependencies.has(task.id)) && (
                      <div className="mt-3 space-y-3">
                        {expandedSubtasks.has(task.id) && (
                          <SubtaskManager 
                            parentTask={task} 
                            onTaskUpdate={onTaskUpdate}
                            isExpanded={true}
                            onToggle={() => toggleSubtasks(task.id)}
                          />
                        )}
                        {expandedDependencies.has(task.id) && (
                          <DependencyManager 
                            task={task} 
                            onTaskUpdate={onTaskUpdate}
                            isExpanded={true}
                            onToggle={() => toggleDependencies(task.id)}
                            onEditTask={setEditingTask}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Immediate Complete Button for Todo tasks */}
                  {task.status === 'Todo' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="btn btn-sm btn-success"
                      title="Mark as complete"
                    >
                      <CheckSquare className="w-3 h-3" />
                    </button>
                  )}

                  {/* Status Change Buttons */}
                  {task.status === 'Todo' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'InProgress')}
                      className="btn btn-sm btn-primary"
                      title="Start task"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}

                  {task.status === 'InProgress' && (
                    <>
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="btn btn-sm btn-success"
                        title="Complete task"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(task.id, 'Blocked')}
                        className="btn btn-sm btn-warning"
                        title="Mark as blocked"
                      >
                        <Pause className="w-3 h-3" />
                      </button>
                    </>
                  )}

                  {task.status === 'Blocked' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'InProgress')}
                      className="btn btn-sm btn-primary"
                      title="Resume task"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}

                  {task.status === 'Completed' && (
                    <button
                      onClick={() => handleReopenTask(task.id)}
                      className="btn btn-sm btn-secondary"
                      title="Reopen task"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingTask(task)}
                    className="btn btn-sm btn-secondary"
                    title="Edit task"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      )}
    </>
  );
}
