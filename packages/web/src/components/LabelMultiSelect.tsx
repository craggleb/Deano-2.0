'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { Label } from '@/types';

interface LabelMultiSelectProps {
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function LabelMultiSelect({ 
  selectedLabelIds, 
  onSelectionChange, 
  placeholder = "Select labels...",
  className = ""
}: LabelMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLabels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/labels');
      if (response.ok) {
        const data = await response.json();
        setLabels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    const newSelection = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter(id => id !== labelId)
      : [...selectedLabelIds, labelId];
    onSelectionChange(newSelection);
  };

  const removeLabel = (labelId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = selectedLabelIds.filter(id => id !== labelId);
    onSelectionChange(newSelection);
  };

  const clearAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectionChange([]);
  };

  const selectedLabels = labels.filter(label => selectedLabelIds.includes(label.id));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="input cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedLabels.length > 0 ? (
            selectedLabels.map(label => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: label.colour }}
              >
                {label.name}
                <button
                  onClick={(e) => removeLabel(label.id, e)}
                  className="hover:bg-black/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">Loading labels...</div>
          ) : labels.length === 0 ? (
            <div className="p-3 text-center text-gray-500">No labels available</div>
          ) : (
            <>
              {selectedLabels.length > 0 && (
                <div className="p-2 border-b border-gray-100">
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
              {labels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleLabel(label.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center"
                      style={{ backgroundColor: label.colour }}
                    >
                      {selectedLabelIds.includes(label.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{label.name}</span>
                  </div>
                  {label.description && (
                    <span className="text-xs text-gray-500 truncate max-w-32">
                      {label.description}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
