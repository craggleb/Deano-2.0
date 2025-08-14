'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, Eye, EyeOff, RefreshCw, TrendingUp } from 'lucide-react';
import OrderedTaskList from '@/components/OrderedTaskList';
import CreateTaskModal from '@/components/CreateTaskModal';
import { Task } from '@/types';

interface AlgorithmConfig {
  weights: {
    U: number; // Urgency
    P: number; // Priority
    B: number; // Blocking impact
    Q: number; // Quick wins
  };
  horizonHours: number;
  overdueBoost: number;
  quickWinCapMins: number;
}

export default function OrderedTaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<AlgorithmConfig>({
    weights: { U: 0.45, P: 0.35, B: 0.15, Q: 0.05 },
    horizonHours: 7 * 24,
    overdueBoost: 0.20,
    quickWinCapMins: 30,
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/tasks?limit=200');
      
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
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (taskData: any) => {
    try {
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
      throw error;
    }
  };

  const handleTaskUpdate = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleConfigChange = (field: keyof AlgorithmConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeightChange = (weight: keyof AlgorithmConfig['weights'], value: number) => {
    setConfig(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [weight]: value,
      },
    }));
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'Todo').length,
    inProgress: tasks.filter(t => t.status === 'InProgress').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    blocked: tasks.filter(t => t.status === 'Blocked').length,
    overdue: tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Task Queue</h1>
              <p className="text-gray-600">AI-powered task ordering based on urgency, priority, and dependencies</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Standard View
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
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
                  <div className="w-6 h-6 border-2 border-gray-600 rounded-full"></div>
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="w-6 h-6 border-2 border-blue-600 rounded-full"></div>
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-6 h-6 border-2 border-green-600 rounded-full bg-green-600"></div>
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
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="w-6 h-6 border-2 border-red-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Blocked</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <div className="w-6 h-6 border-2 border-orange-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => setShowScores(!showScores)}
                  className={`btn btn-sm ${showScores ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {showScores ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {showScores ? 'Hide Scores' : 'Show Scores'}
                </button>

                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className={`btn btn-sm ${showDebugInfo ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {showDebugInfo ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
                </button>

                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`btn btn-sm ${showConfig ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  {showConfig ? 'Hide Config' : 'Algorithm Config'}
                </button>

                <button
                  onClick={fetchTasks}
                  className="btn btn-sm btn-secondary"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p>Tasks are automatically reordered based on urgency, priority, and dependencies</p>
              </div>
            </div>

            {/* Algorithm Configuration */}
            {showConfig && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Algorithm Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Weight (U)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.U}
                      onChange={(e) => handleWeightChange('U', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{config.weights.U.toFixed(2)}</span>
                      <span>1</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Weight (P)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.P}
                      onChange={(e) => handleWeightChange('P', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{config.weights.P.toFixed(2)}</span>
                      <span>1</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blocking Impact Weight (B)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.B}
                      onChange={(e) => handleWeightChange('B', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{config.weights.B.toFixed(2)}</span>
                      <span>1</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Win Weight (Q)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.Q}
                      onChange={(e) => handleWeightChange('Q', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{config.weights.Q.toFixed(2)}</span>
                      <span>1</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horizon Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={config.horizonHours}
                      onChange={(e) => handleConfigChange('horizonHours', parseInt(e.target.value))}
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Urgency look-ahead window</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overdue Boost
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.overdueBoost}
                      onChange={(e) => handleConfigChange('overdueBoost', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{config.overdueBoost.toFixed(2)}</span>
                      <span>1</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Win Cap (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={config.quickWinCapMins}
                      onChange={(e) => handleConfigChange('quickWinCapMins', parseInt(e.target.value))}
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Duration cap for quick wins</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">How the algorithm works:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Urgency (U):</strong> Based on due date proximity and overdue status</li>
                    <li>• <strong>Priority (P):</strong> Normalized priority level (Low=0, Medium=0.5, High=1)</li>
                    <li>• <strong>Blocking Impact (B):</strong> How many tasks depend on this one</li>
                    <li>• <strong>Quick Wins (Q):</strong> Shorter tasks get a small boost</li>
                    <li>• <strong>Dependencies:</strong> Tasks with unmet dependencies are blocked</li>
                    <li>• <strong>Hierarchy:</strong> Subtasks must be completed before parents</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card mb-6">
            <div className="card-content">
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-5 h-5 border-2 border-red-600 rounded-full mr-3"></div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={fetchTasks}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ordered Task List */}
        <OrderedTaskList
          tasks={tasks}
          loading={loading}
          onTaskUpdate={handleTaskUpdate}
          showScores={showScores}
          showDebugInfo={showDebugInfo}
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
