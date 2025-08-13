'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { isoToLocalDateTime, localDateTimeToISO } from '@/lib/dateUtils';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  error?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export default function DateTimePicker({ 
  value, 
  onChange, 
  id, 
  className = '', 
  placeholder = 'Select date and time',
  error,
  onValidationChange
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Convert ISO string to local date and time values
  const isoToLocalValues = (isoString: string) => {
    return isoToLocalDateTime(isoString);
  };

  // Convert local date and time values to ISO string
  const localValuesToIso = (date: string, time: string) => {
    return localDateTimeToISO(date, time);
  };

  // Validate date and time values
  const validateDateTime = (date: string, time: string): boolean => {
    if (!date || !time) {
      setLocalError('Both date and time are required');
      onValidationChange?.(false);
      return false;
    }

    try {
      const isoString = localValuesToIso(date, time);
      if (!isoString) {
        setLocalError('Invalid date or time format');
        onValidationChange?.(false);
        return false;
      }

      const dateObj = new Date(isoString);
      if (isNaN(dateObj.getTime())) {
        setLocalError('Invalid date or time');
        onValidationChange?.(false);
        return false;
      }

      setLocalError(null);
      onValidationChange?.(true);
      return true;
    } catch (error) {
      setLocalError('Invalid date or time format');
      onValidationChange?.(false);
      return false;
    }
  };

  // Initialize values when component mounts or value changes
  useEffect(() => {
    const { date, time } = isoToLocalValues(value);
    setDateValue(date);
    setTimeValue(time);
    validateDateTime(date, time);
  }, [value]);

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate);
    const isValid = validateDateTime(newDate, timeValue);
    if (isValid) {
      const isoString = localValuesToIso(newDate, timeValue);
      onChange(isoString);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    const isValid = validateDateTime(dateValue, newTime);
    if (isValid) {
      const isoString = localValuesToIso(dateValue, newTime);
      onChange(isoString);
    }
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <div className={`flex space-x-2 ${className}`}>
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`input pl-10 w-full ${displayError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="Date"
          />
        </div>
        <div className="relative flex-1">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            className={`input pl-10 w-full ${displayError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="Time"
            step="300"
          />
        </div>
      </div>
      {displayError && (
        <div className="flex items-center text-sm text-danger-600">
          <AlertTriangle className="w-4 h-4 mr-1" />
          {displayError}
        </div>
      )}
    </div>
  );
}
