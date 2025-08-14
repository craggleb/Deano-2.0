'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CheckSquare,
  Lock,
  Unlock,
  TrendingUp,
  Calendar,
  Timer
} from 'lucide-react';
import { Task, TaskStatus, Priority } from '@/types';
import { isAfter, isBefore } from 'date-fns';
import { formatLocalDateTime } from '@/lib/dateUtils';
import EditTaskModal from './EditTaskModal';
import TaskLabels from './TaskLabels';

interface TaskScore {
  score: number;
  urgency: number;
  priority: number;
  blocking: number;
  quickWin: number;
}

interface OrderedTaskListProps {
  tasks: Task[];
  loading: boolean;
  onTaskUpdate: () => void;
  showScores?: boolean;
  showDebugInfo?: boolean;
}

interface OrderedTask {
  task: Task;
  score: TaskScore;
  indentLevel: number;
  breadcrumb: string;
  isBlocked: boolean;
  blockingTasks: string[];
}

export default function OrderedTaskList({ 
  tasks, 
  loading, 
  onTaskUpdate, 
  showScores = false,
  showDebugInfo = false 
}: OrderedTaskListProps) {
  const [orderedTasks, setOrderedTasks] = useState<OrderedTask[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ordered tasks from API
  const fetchOrderedTasks = useCallback(async () => {
    setLoadingOrder(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weights: { U: 0.45, P: 0.35, B: 0.15, Q: 0.05 },
          horizonHours: 7 * 24,
          overdueBoost: 0.20,
          quickWinCapMins: 30,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to order tasks: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.data.cycles && result.data.cycles.length > 0) {
        setError(`Dependency cycle detected: ${result.data.cycles.join(' → ')}`);
        return;
      }

      // Build ordered task list with hierarchy information
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const orderedTaskList: OrderedTask[] = [];
      
      for (const taskId of result.data.orderedTaskIds) {
        const task = taskMap.get(taskId);
        if (!task) continue;

        const score = result.data.taskScores[taskId];
        const { indentLevel, breadcrumb } = calculateHierarchy(task, taskMap);
        const { isBlocked, blockingTasks } = calculateBlockingStatus(task, taskMap);

        orderedTaskList.push({
          task,
          score,
          indentLevel,
          breadcrumb,
          isBlocked,
          blockingTasks,
        });
      }

      setOrderedTasks(orderedTaskList);
    } catch (error) {
      console.error('Error fetching ordered tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ordered tasks');
    } finally {
      setLoadingOrder(false);
    }
  }, [tasks]);

  // Calculate hierarchy information for a task
  const calculateHierarchy = (task: Task, taskMap: Map<string, Task>): { indentLevel: number; breadcrumb: string } => {
    let indentLevel = 0;
    const breadcrumbParts: string[] = [task.title];
    let currentTask = task;

    while (currentTask.parentId) {
      indentLevel++;
      const parent = taskMap.get(currentTask.parentId);
      if (parent) {
        breadcrumbParts.unshift(parent.title);
        currentTask = parent;
      } else {
        break;
      }
    }

    return {
      indentLevel,
      breadcrumb: breadcrumbParts.join(' ▸ '),
    };
  };

  // Calculate if a task is blocked and by what
  const calculateBlockingStatus = (task: Task, taskMap: Map<string, Task>): { isBlocked: boolean; blockingTasks: string[] } => {
    const blockingTasks: string[] = [];
    
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        const blocker = taskMap.get(dep.dependsOnTaskId);
        if (blocker && blocker.status !== 'Completed' && blocker.status !== 'Canceled') {
          blockingTasks.push(blocker.title);
        }
      }
    }

    return {
      isBlocked: blockingTasks.length > 0,
      blockingTasks,
    };
  };

  // Refresh ordered tasks when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      fetchOrderedTasks();
    }
  }, [tasks, fetchOrderedTasks]);

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
      throw error;
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

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading || loadingOrder) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">
              {loadingOrder ? 'Calculating optimal task order...' : 'Loading tasks...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchOrderedTasks}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderedTasks.length === 0) {
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
        {orderedTasks.map((orderedTask, index) => {
          const { task, score, indentLevel, breadcrumb, isBlocked, blockingTasks } = orderedTask;
          
          return (
            <div 
              key={task.id} 
              className="card"
              style={{ marginLeft: `${indentLevel * 20}px` }}
            >
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(task.status)}
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {formatStatusDisplay(task.status)}
                      </span>
                      {isBlocked && (
                        <span className="badge badge-warning flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>Blocked</span>
                        </span>
                      )}
                      {!isBlocked && (
                        <span className="badge badge-success flex items-center space-x-1">
                          <Unlock className="w-3 h-3" />
                          <span>Ready</span>
                        </span>
                      )}
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
                        {showScores && (
                          <span className={`badge ${getScoreColor(score.score)}`}>
                            Score: {score.score.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Breadcrumb for subtasks */}
                      {indentLevel > 0 && (
                        <p className="text-xs text-gray-500 mb-1">
                          {breadcrumb}
                        </p>
                      )}

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Labels */}
                      <TaskLabels taskLabels={task.taskLabels} className="mb-2" />

                      {/* Debug information */}
                      {showDebugInfo && (
                        <div className="text-xs text-gray-500 mb-2 space-y-1">
                          <div className="flex space-x-4">
                            <span>U: {score.urgency.toFixed(2)}</span>
                            <span>P: {score.priority.toFixed(2)}</span>
                            <span>B: {score.blocking.toFixed(2)}</span>
                            <span>Q: {score.quickWin.toFixed(2)}</span>
                          </div>
                          {isBlocked && (
                            <div className="text-red-500">
                              Blocked by: {blockingTasks.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {task.dueAt && (
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {formatLocalDateTime(task.dueAt)}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Timer className="w-3 h-3" />
                          <span>{task.estimatedDurationMinutes}m</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>#{index + 1} in queue</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Immediate Complete Button for Todo tasks */}
                    {task.status === 'Todo' && !isBlocked && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="btn btn-sm btn-success"
                        title="Mark as complete"
                      >
                        <CheckSquare className="w-3 h-3" />
                      </button>
                    )}

                    {/* Status Change Buttons */}
                    {task.status === 'Todo' && !isBlocked && (
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
          );
        })}
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
