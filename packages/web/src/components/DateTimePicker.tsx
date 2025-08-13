'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { isoToLocalDateTime, localDateTimeToISO } from '@/lib/dateUtils';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
}

export default function DateTimePicker({ 
  value, 
  onChange, 
  id, 
  className = '', 
  placeholder = 'Select date and time' 
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // Convert ISO string to local date and time values
  const isoToLocalValues = (isoString: string) => {
    return isoToLocalDateTime(isoString);
  };

  // Convert local date and time values to ISO string
  const localValuesToIso = (date: string, time: string) => {
    return localDateTimeToISO(date, time);
  };

  // Initialize values when component mounts or value changes
  useEffect(() => {
    const { date, time } = isoToLocalValues(value);
    setDateValue(date);
    setTimeValue(time);
  }, [value]);

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate);
    const isoString = localValuesToIso(newDate, timeValue);
    onChange(isoString);
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    const isoString = localValuesToIso(dateValue, newTime);
    onChange(isoString);
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="relative flex-1">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="date"
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          className="input pl-10 w-full"
          placeholder="Date"
        />
      </div>
      <div className="relative flex-1">
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="input pl-10 w-full"
          placeholder="Time"
          step="300"
        />
      </div>
    </div>
  );
}
