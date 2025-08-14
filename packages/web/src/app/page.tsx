'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Calendar, Clock, AlertTriangle, CheckCircle, Circle, Eye, EyeOff, SortAsc, SortDesc } from 'lucide-react';
import TaskList from '@/components/TaskList';
import CreateTaskModal from '@/components/CreateTaskModal';
import LabelMultiSelect from '@/components/LabelMultiSelect';
import { Task, TaskStatus, Priority } from '@/types';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [sortBy, setSortBy] = useState('dueAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    q: '',
    labelIds: [] as string[],
  });
  
  // Add refs for scroll position preservation
  const scrollPositionRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.q) params.append('q', filters.q);
      if (filters.labelIds.length > 0) params.append('labelIds', filters.labelIds.join(','));

      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.data) {
        setTasks(data.data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Effect to restore scroll position after state updates
  useEffect(() => {
    if (isUpdatingRef.current && scrollPositionRef.current > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
        isUpdatingRef.current = false;
      }, 100); // Small delay to ensure DOM has updated
      
      return () => clearTimeout(timer);
    }
  }, [tasks, loading]); // Trigger when tasks or loading state changes

  const handleCreateTask = async (taskData: any) => {
    try {
      // First create the task
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to create task: ${response.status} ${response.statusText}`);
      }

      const createdTask = await response.json();

      // Then add dependencies if any
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        const dependencyResponse = await fetch(`/api/tasks/${createdTask.data.id}/dependencies`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dependsOnTaskIds: taskData.dependencies }),
        });

        if (!dependencyResponse.ok) {
          console.warn('Failed to add dependencies, but task was created successfully');
        }
      }

      setShowCreateModal(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleTaskUpdate = useCallback(() => {
    // Save current scroll position before updating
    scrollPositionRef.current = window.scrollY;
    isUpdatingRef.current = true;
    fetchTasks();
  }, [fetchTasks]);

  const _getStatusIcon = (status: TaskStatus) => {
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

  const _getPriorityColor = (priority: Priority) => {
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

  const _getStatusColor = (status: TaskStatus) => {
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

  // Filter tasks based on showCompletedTasks setting
  const filteredTasks = tasks.filter(task => {
    if (!showCompletedTasks && task.status === 'Completed') {
      return false;
    }
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'dueAt':
        aValue = a.dueAt ? new Date(a.dueAt).getTime() : 0;
        bValue = b.dueAt ? new Date(b.dueAt).getTime() : 0;
        break;
      case 'priority':
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      case 'status':
        const statusOrder = { Todo: 1, InProgress: 2, Blocked: 3, Completed: 4, Canceled: 5 };
        aValue = statusOrder[a.status as keyof typeof statusOrder];
        bValue = statusOrder[b.status as keyof typeof statusOrder];
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        aValue = a.dueAt ? new Date(a.dueAt).getTime() : 0;
        bValue = b.dueAt ? new Date(b.dueAt).getTime() : 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'Todo').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deano Task Manager</h1>
              <p className="text-gray-600">Manage your tasks with dependency logic and smart scheduling</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/labels"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Labels
              </a>
              <a
                href="/utilities"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Utilities
              </a>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Circle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">To Do</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-danger-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-danger-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="space-y-6">
              {/* Search Bar - Full Width */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Tasks
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="search"
                    type="text"
                    placeholder="Search tasks by title or description..."
                    className="input pl-10 w-full"
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    id="status-filter"
                    className="select w-full"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="Todo">Todo</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Filter
                  </label>
                  <select
                    id="priority-filter"
                    className="select w-full"
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  >
                    <option value="">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label Filter
                  </label>
                  <LabelMultiSelect
                    selectedLabelIds={filters.labelIds}
                    onSelectionChange={(labelIds) => setFilters({ ...filters, labelIds })}
                    placeholder="Select labels..."
                  />
                </div>
              </div>

              {/* Sort and View Controls Row */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                    <select
                      className="select text-sm min-w-[140px]"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="dueAt">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="status">Status</option>
                      <option value="title">Title</option>
                      <option value="createdAt">Created Date</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="btn btn-sm btn-secondary"
                      title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                    className={`btn btn-sm ${showCompletedTasks ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {showCompletedTasks ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                    {showCompletedTasks ? 'Show All' : 'Hide Completed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card mb-6">
            <div className="card-content">
              <div className="flex items-center p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-danger-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-danger-800">Connection Error</h3>
                  <p className="text-sm text-danger-700 mt-1">{error}</p>
                  <button
                    onClick={fetchTasks}
                    className="mt-2 text-sm text-danger-600 hover:text-danger-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <TaskList
          tasks={sortedTasks}
          loading={loading}
          onTaskUpdate={handleTaskUpdate}
        />
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </div>
  );
}
