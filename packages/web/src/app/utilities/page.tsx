'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/types';

interface TaskAnalytics {
  date: string;
  summary: {
    added: Task[];
    completed: Task[];
    overdue: Task[];
    statusChanged: Array<{
      task: Task;
      oldStatus: string;
      newStatus: string;
    }>;
  };
  stats: {
    totalAdded: number;
    totalCompleted: number;
    totalOverdue: number;
    totalStatusChanges: number;
  };
}

export default function UtilitiesPage() {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysToLookBack, setDaysToLookBack] = useState(1);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        date: selectedDate,
        days: daysToLookBack.toString(),
      });

      const response = await fetch(`/api/tasks/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, daysToLookBack]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'InProgress':
        return <Clock className="w-4 h-4 text-primary-600" />;
      case 'Blocked':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Utilities</h1>
              <p className="text-gray-600">Analytics and insights for your task management</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Tasks
              </a>
              <a
                href="/labels"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Labels
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Analyse Date
                </label>
                <input
                  id="date"
                  type="date"
                  className="input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
                  Look Back (Days)
                </label>
                <select
                  id="days"
                  className="select"
                  value={daysToLookBack}
                  onChange={(e) => setDaysToLookBack(parseInt(e.target.value))}
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Loading...' : 'Refresh Analytics'}
              </button>
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
                  <h3 className="text-sm font-medium text-danger-800">Error</h3>
                  <p className="text-sm text-danger-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Summary */}
        {analytics && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Plus className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Added</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.stats.totalAdded}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{analytics.stats.totalCompleted}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="p-2 bg-warning-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-warning-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Status Changes</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.stats.totalStatusChanges}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{analytics.stats.totalOverdue}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Added Tasks */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-primary-600" />
                    New Tasks ({analytics.summary.added.length})
                  </h3>
                </div>
                <div className="card-content">
                  {analytics.summary.added.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No new tasks on {formatDate(analytics.date)}</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.summary.added.map((task) => (
                        <div key={task.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              {getStatusIcon(task.status)}
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                Created at {formatTime(task.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-success-600" />
                    Completed Tasks ({analytics.summary.completed.length})
                  </h3>
                </div>
                <div className="card-content">
                  {analytics.summary.completed.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No completed tasks on {formatDate(analytics.date)}</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.summary.completed.map((task) => (
                        <div key={task.id} className="flex items-start justify-between p-3 bg-success-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              {getStatusIcon(task.status)}
                              <span className="text-xs text-gray-500">
                                Completed at {formatTime(task.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Changes */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-warning-600" />
                    Status Changes ({analytics.summary.statusChanged.length})
                  </h3>
                </div>
                <div className="card-content">
                  {analytics.summary.statusChanged.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No status changes on {formatDate(analytics.date)}</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.summary.statusChanged.map((change) => (
                        <div key={change.task.id} className="flex items-start justify-between p-3 bg-warning-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{change.task.title}</h4>
                            <p className="text-sm text-gray-600">{change.task.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              {getStatusIcon(change.task.status)}
                              <span className="text-xs text-gray-500">
                                {change.oldStatus} → {change.newStatus}
                              </span>
                              <span className="text-xs text-gray-500">
                                Updated at {formatTime(change.task.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-danger-600" />
                    Overdue Tasks ({analytics.summary.overdue.length})
                  </h3>
                </div>
                <div className="card-content">
                  {analytics.summary.overdue.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No overdue tasks as of {formatDate(analytics.date)}</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.summary.overdue.map((task) => (
                        <div key={task.id} className="flex items-start justify-between p-3 bg-danger-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              {getStatusIcon(task.status)}
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              <span className="text-xs text-danger-600 font-medium">
                                Due: {task.dueAt ? formatDate(task.dueAt) : 'No due date'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
