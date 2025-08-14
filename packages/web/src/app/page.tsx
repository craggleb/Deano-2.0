'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Calendar, Clock, AlertTriangle, CheckCircle, Circle, Eye, EyeOff, SortAsc, SortDesc } from 'lucide-react';
import TaskList from '@/components/TaskList';
import CreateTaskModal from '@/components/CreateTaskModal';
import LabelMultiSelect from '@/components/LabelMultiSelect';
import { Task } from '@/types';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [hideSubtasks, setHideSubtasks] = useState(false);
  const [sortBy, setSortBy] = useState('dueAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    q: '',
    labelIds: [] as string[],
    dateRange: '' as '' | 'today' | 'overdue' | 'thisWeek' | 'thisMonth' | 'custom',
    startDate: '',
    endDate: '',
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Add refs for scroll position preservation
  const scrollPositionRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);
  const currentPageRef = useRef<number>(1);

  const fetchTasks = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '200'); // Increased page size
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.q) params.append('q', filters.q);
      if (filters.labelIds.length > 0) params.append('labelIds', filters.labelIds.join(','));
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.data) {
        if (append) {
          setTasks(prev => [...prev, ...data.data]);
        } else {
          setTasks(data.data);
        }
        
        // Update pagination info
        setTotalTasks(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setHasMore(data.pagination.page < data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
        currentPageRef.current = data.pagination.page;
      } else {
        if (!append) {
          setTasks([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tasks');
      if (!append) {
        setTasks([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]); // Include filters dependency to ensure function uses current filter state

  // Initial load effect - only run once on mount
  useEffect(() => {
    fetchTasks(1, false);
  }, []); // Empty dependency array - only run on mount

  // Effect to refetch when filters change - use filters directly instead of fetchTasks
  useEffect(() => {
    // Reset to page 1 when filters change
    fetchTasks(1, false);
  }, [filters]); // Depend on filters directly, not fetchTasks

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchTasks(currentPageRef.current + 1, true);
    }
  }, [hasMore, loadingMore]); // Remove currentPage dependency since we use ref

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
      // Reset to page 1 when creating new tasks
      fetchTasks(1, false);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleTaskUpdate = useCallback(() => {
    // Save current scroll position before updating
    scrollPositionRef.current = window.scrollY;
    isUpdatingRef.current = true;
    
    // Always refresh the current page to see updated tasks
    // This ensures we see the current state of tasks on this page
    fetchTasks(currentPageRef.current, false);
  }, []); // No dependencies needed since we use refs



  // Filter tasks based on showCompletedTasks and hideSubtasks settings
  const filteredTasks = tasks.filter(task => {
    if (!showCompletedTasks && task.status === 'Completed') {
      return false;
    }
    if (hideSubtasks && task.parentId) {
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
                href="/ordered"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Smart Queue
              </a>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label htmlFor="date-range-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    id="date-range-filter"
                    className="select w-full"
                    value={filters.dateRange}
                    onChange={(e) => {
                      const dateRange = e.target.value as '' | 'today' | 'overdue' | 'thisWeek' | 'thisMonth' | 'custom';
                      setFilters({ 
                        ...filters, 
                        dateRange,
                        // Clear custom dates when selecting predefined ranges
                        startDate: dateRange === 'custom' ? filters.startDate : '',
                        endDate: dateRange === 'custom' ? filters.endDate : '',
                      });
                    }}
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="custom">Custom Range</option>
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

              {/* Custom Date Range Row */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      className="input w-full"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      className="input w-full"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

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
                    {showCompletedTasks ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showCompletedTasks ? 'Hide Completed' : 'Show All'}
                  </button>
                  <button
                    onClick={() => setHideSubtasks(!hideSubtasks)}
                    className={`btn btn-sm ${hideSubtasks ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {hideSubtasks ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                    {hideSubtasks ? 'Show Subtasks' : 'Hide Subtasks'}
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
                    onClick={() => fetchTasks(1, false)}
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

        {/* Load More Button */}
        {hasMore && (
          <div className="card mt-4">
            <div className="card-content">
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn btn-secondary"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More Tasks'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Info */}
        {totalTasks > 0 && (
          <div className="text-center text-sm text-gray-600 mt-4">
            Showing {tasks.length} of {totalTasks} tasks
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>
        )}
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
