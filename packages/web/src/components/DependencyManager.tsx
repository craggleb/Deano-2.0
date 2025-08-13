'use client';

import { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, ChevronDown, Circle, Clock, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Task, TaskStatus, Priority, DependencyWithTask } from '@/types';

interface DependencyManagerProps {
  task: Task;
  onTaskUpdate: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function DependencyManager({ task, onTaskUpdate, isExpanded = false, onToggle }: DependencyManagerProps) {
  const [dependencies, setDependencies] = useState<DependencyWithTask[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  useEffect(() => {
    if (isExpanded) {
      fetchDependencies();
    }
  }, [isExpanded, task.id]);

  useEffect(() => {
    if (isExpanded && dependencies.length >= 0) {
      fetchAllTasks();
    }
  }, [isExpanded, task.id, dependencies]);

  const fetchDependencies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${task.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDependencies(data.data?.dependencies || []);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      // Filter out the current task and tasks that would create cycles
      const availableTasks = (data.data || []).filter((t: Task) => 
        t.id !== task.id && 
        !dependencies.some(dep => dep.blockerTask.id === t.id)
      );
      setAllTasks(availableTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedTaskId) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}/dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dependsOnTaskId: selectedTaskId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to add dependency: ${response.status} ${response.statusText}`);
      }

      setShowAddModal(false);
      setSelectedTaskId('');
      setSearchQuery('');
      fetchDependencies();
      onTaskUpdate();
    } catch (error) {
      console.error('Error adding dependency:', error);
      alert(error instanceof Error ? error.message : 'Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (dependsOnTaskId: string) => {
    if (!confirm('Are you sure you want to remove this dependency?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}/dependencies/${dependsOnTaskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to remove dependency: ${response.status} ${response.statusText}`);
      }

      fetchDependencies();
      onTaskUpdate();
    } catch (error) {
      console.error('Error removing dependency:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove dependency');
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

  const filteredTasks = allTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm font-medium text-gray-700">
          Dependencies ({dependencies.length})
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-sm btn-primary"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Dependency
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading dependencies...</span>
          </div>
        ) : dependencies.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No dependencies yet. This task can be started immediately.
          </div>
        ) : (
          dependencies.map((dependency) => (
            <div key={dependency.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(dependency.blockerTask.status)}
                  <span className={`badge badge-sm ${getStatusColor(dependency.blockerTask.status)}`}>
                    {dependency.blockerTask.status}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {dependency.blockerTask.title}
                    </h4>
                    <span className={`badge badge-sm ${getPriorityColor(dependency.blockerTask.priority)}`}>
                      {dependency.blockerTask.priority}
                    </span>
                  </div>
                  
                  {dependency.blockerTask.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {dependency.blockerTask.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    {dependency.blockerTask.dueAt && (
                      <span>Due: {new Date(dependency.blockerTask.dueAt).toLocaleDateString()}</span>
                    )}
                    <span>{dependency.blockerTask.estimatedDurationMinutes}m</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveDependency(dependency.blockerTask.id)}
                className="btn btn-sm btn-danger"
                title="Remove dependency"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Dependency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Dependency</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedTaskId('');
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Tasks
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="input pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tasks found
                  </p>
                ) : (
                  filteredTasks.map((availableTask) => (
                    <div
                      key={availableTask.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTaskId === availableTask.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTaskId(availableTask.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(availableTask.status)}
                        <span className={`badge badge-sm ${getStatusColor(availableTask.status)}`}>
                          {availableTask.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mt-1">
                        {availableTask.title}
                      </h4>
                      {availableTask.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {availableTask.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedTaskId('');
                    setSearchQuery('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddDependency}
                  className="btn btn-primary"
                  disabled={!selectedTaskId}
                >
                  Add Dependency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
