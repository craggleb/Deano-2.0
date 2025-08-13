'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Circle, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Task, TaskStatus, Priority } from '@/types';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';

interface SubtaskManagerProps {
  parentTask: Task;
  onTaskUpdate: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function SubtaskManager({ parentTask, onTaskUpdate, isExpanded = false, onToggle }: SubtaskManagerProps) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Task | null>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchSubtasks();
    }
  }, [isExpanded, parentTask.id]);

  const fetchSubtasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?parentId=${parentTask.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subtasks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSubtasks(data.data || []);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtask = async (taskData: any) => {
    try {
      const response = await fetch(`/api/tasks/${parentTask.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to create subtask: ${response.status} ${response.statusText}`);
      }

      setShowCreateModal(false);
      fetchSubtasks();
      onTaskUpdate();
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  };

  const handleEditSubtask = async (taskData: any) => {
    if (!editingSubtask) return;
    
    try {
      const response = await fetch(`/api/tasks/${editingSubtask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to update subtask: ${response.status} ${response.statusText}`);
      }

      setEditingSubtask(null);
      fetchSubtasks();
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to delete subtask: ${response.status} ${response.statusText}`);
      }

      fetchSubtasks();
      onTaskUpdate();
    } catch (error) {
      console.error('Error deleting subtask:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete subtask');
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

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm font-medium text-gray-700">
          Subtasks ({subtasks.length})
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-sm btn-primary"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Subtask
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading subtasks...</span>
          </div>
        ) : subtasks.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No subtasks yet. Create one to get started!
          </div>
        ) : (
          subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(subtask.status)}
                  <span className={`badge badge-sm ${getStatusColor(subtask.status)}`}>
                    {subtask.status}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {subtask.title}
                    </h4>
                    <span className={`badge badge-sm ${getPriorityColor(subtask.priority)}`}>
                      {subtask.priority}
                    </span>
                  </div>
                  
                  {subtask.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {subtask.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    {subtask.dueAt && (
                      <span>Due: {new Date(subtask.dueAt).toLocaleDateString()}</span>
                    )}
                    <span>{subtask.estimatedDurationMinutes}m</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setEditingSubtask(subtask)}
                  className="btn btn-sm btn-secondary"
                  title="Edit subtask"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="btn btn-sm btn-danger"
                  title="Delete subtask"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Subtask Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubtask}
        />
      )}

      {/* Edit Subtask Modal */}
      {editingSubtask && (
        <EditTaskModal
          task={editingSubtask}
          onClose={() => setEditingSubtask(null)}
          onSubmit={handleEditSubtask}
        />
      )}
    </div>
  );
}
