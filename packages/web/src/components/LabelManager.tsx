'use client';

import React, { useState, useEffect } from 'react';
import { Label, CreateLabelInput, UpdateLabelInput } from '../types';

interface LabelManagerProps {
  selectedLabels?: string[];
  onLabelsChange?: (labelIds: string[]) => void;
  showCreateButton?: boolean;
}

export default function LabelManager({ 
  selectedLabels = [], 
  onLabelsChange,
  showCreateButton = true 
}: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [formData, setFormData] = useState<CreateLabelInput>({
    name: '',
    colour: '#3B82F6',
    description: ''
  });

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

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', colour: '#3B82F6', description: '' });
        fetchLabels();
      }
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const handleUpdateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabel) return;
    
    try {
      const response = await fetch(`/api/labels/${editingLabel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setEditingLabel(null);
        setFormData({ name: '', colour: '#3B82F6', description: '' });
        fetchLabels();
      }
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label?')) return;
    
    try {
      const response = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchLabels();
      }
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  };

  const handleLabelToggle = (labelId: string) => {
    if (!onLabelsChange) return;
    
    const newSelectedLabels = selectedLabels.includes(labelId)
      ? selectedLabels.filter(id => id !== labelId)
      : [...selectedLabels, labelId];
    
    onLabelsChange(newSelectedLabels);
  };

  const openEditModal = (label: Label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      colour: label.colour,
      description: label.description || ''
    });
    setShowEditModal(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading labels...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Labels</h3>
        {showCreateButton && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Create Label
          </button>
        )}
      </div>

      <div className="space-y-2">
        {labels.map(label => (
          <div key={label.id} className="flex items-center justify-between p-2 border rounded-md">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: label.colour }}
              />
              <span className="text-sm font-medium">{label.name}</span>
              {label.description && (
                <span className="text-xs text-gray-500">({label.description})</span>
              )}
              {onLabelsChange && (
                <input
                  type="checkbox"
                  checked={selectedLabels.includes(label.id)}
                  onChange={() => handleLabelToggle(label.id)}
                  className="ml-2"
                />
              )}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => openEditModal(label)}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteLabel(label.id)}
                className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create Label</h3>
            <form onSubmit={handleCreateLabel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Colour</label>
                <input
                  type="color"
                  value={formData.colour}
                  onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                  className="w-full p-1 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingLabel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Label</h3>
            <form onSubmit={handleUpdateLabel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Colour</label>
                <input
                  type="color"
                  value={formData.colour}
                  onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                  className="w-full p-1 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
