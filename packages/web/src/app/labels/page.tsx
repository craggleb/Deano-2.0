'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/types';
import LabelManager from '@/components/LabelManager';
import { ArrowLeft } from 'lucide-react';

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/labels');
      const result = await response.json();
      if (result.data) {
        setLabels(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <span className="ml-2 text-gray-600">Loading labels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <a
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Label Management</h1>
          <p className="text-gray-600">
            Create and manage labels to categorise your tasks. Labels help you organise and filter tasks more effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Label Manager */}
          <div className="card">
            <div className="card-content">
              <LabelManager />
            </div>
          </div>

          {/* Label Statistics */}
          <div className="card">
            <div className="card-content">
              <h3 className="text-lg font-semibold mb-4">Label Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Labels:</span>
                  <span className="font-semibold">{labels.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Labels in Use:</span>
                  <span className="font-semibold">
                    {labels.filter(label => (label._count?.taskLabels || 0) > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unused Labels:</span>
                  <span className="font-semibold">
                    {labels.filter(label => (label._count?.taskLabels || 0) === 0).length}
                  </span>
                </div>
              </div>

              {labels.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Most Used Labels</h4>
                  <div className="space-y-2">
                    {labels
                      .filter(label => (label._count?.taskLabels || 0) > 0)
                      .sort((a, b) => (b._count?.taskLabels || 0) - (a._count?.taskLabels || 0))
                      .slice(0, 5)
                      .map(label => (
                        <div key={label.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: label.colour }}
                            />
                            <span className="text-sm font-medium">{label.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {label._count?.taskLabels || 0} tasks
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 card">
          <div className="card-content">
            <h3 className="text-lg font-semibold mb-4">How to Use Labels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Creating Labels</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click &quot;Create Label&quot; to add a new label</li>
                  <li>• Choose a descriptive name and colour</li>
                  <li>• Add an optional description for context</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Applying Labels</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Select labels when creating or editing tasks</li>
                  <li>• Labels appear as coloured badges on tasks</li>
                  <li>• Use labels to filter and organise your workflow</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
