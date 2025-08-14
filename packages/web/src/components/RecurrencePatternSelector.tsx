'use client';

import { useState } from 'react';
import { RecurrenceType, RecurrencePattern } from '@/types';
import { Repeat, Calendar, Clock } from 'lucide-react';

interface RecurrencePatternSelectorProps {
  value?: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
  startDate?: string;
}

export default function RecurrencePatternSelector({ value, onChange, startDate }: RecurrencePatternSelectorProps) {
  const [isRecurring, setIsRecurring] = useState(!!value);
  const [pattern, setPattern] = useState<RecurrencePattern>(value || {
    type: 'Daily',
    interval: 1,
    startDate: startDate || new Date().toISOString(),
  });

  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurring(checked);
    if (!checked) {
      onChange(null);
    } else {
      onChange(pattern);
    }
  };

  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    const newPattern = { ...pattern, ...updates };
    setPattern(newPattern);
    if (isRecurring) {
      onChange(newPattern);
    }
  };

  const getRecurrenceDescription = (pattern: RecurrencePattern) => {
    const { type, interval } = pattern;
    switch (type) {
      case 'Daily':
        return interval === 1 ? 'Every day' : `Every ${interval} days`;
      case 'Weekly':
        return interval === 1 ? 'Every week' : `Every ${interval} weeks`;
      case 'Monthly':
        return interval === 1 ? 'Every month' : `Every ${interval} months`;
      case 'Yearly':
        return interval === 1 ? 'Every year' : `Every ${interval} years`;
      case 'Custom':
        return 'Custom pattern';
      default:
        return 'Custom pattern';
    }
  };

  return (
    <div className="space-y-4">
      {/* Recurring Toggle */}
      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => handleRecurringToggle(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
        />
        <div>
          <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
            Make this a recurring task
          </label>
          <p className="text-xs text-gray-600 mt-1">
            Automatically create new instances when this task is completed
          </p>
        </div>
      </div>

      {/* Recurrence Pattern Configuration */}
      {isRecurring && (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Repeat className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Recurrence Pattern</h3>
          </div>

          {/* Pattern Type and Interval */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeats
              </label>
              <select
                value={pattern.type}
                onChange={(e) => updatePattern({ type: e.target.value as RecurrenceType })}
                className="select w-full"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interval
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={pattern.interval}
                  onChange={(e) => updatePattern({ interval: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                  placeholder="1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  {pattern.type === 'Daily' && (pattern.interval === 1 ? 'day' : 'days')}
                  {pattern.type === 'Weekly' && (pattern.interval === 1 ? 'week' : 'weeks')}
                  {pattern.type === 'Monthly' && (pattern.interval === 1 ? 'month' : 'months')}
                  {pattern.type === 'Yearly' && (pattern.interval === 1 ? 'year' : 'years')}
                  {pattern.type === 'Custom' && 'units'}
                </span>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="datetime-local"
                value={pattern.startDate ? new Date(pattern.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => updatePattern({ startDate: new Date(e.target.value).toISOString() })}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* End Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="datetime-local"
                value={pattern.endDate ? new Date(pattern.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => updatePattern({ 
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                })}
                className="input pl-10 w-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
          </div>

          {/* Pattern Description */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {getRecurrenceDescription(pattern)}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Starting {new Date(pattern.startDate).toLocaleDateString()}
              {pattern.endDate && ` until ${new Date(pattern.endDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
