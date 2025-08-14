import { describe, it, expect } from 'vitest';
import { formatLocalDateTime, localDateTimeToISO, isoToLocalDateTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatLocalDateTime', () => {
    it('should format date string correctly', () => {
      expect(formatLocalDateTime('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024 10:30');
      expect(formatLocalDateTime('2024-12-25T00:00:00Z')).toBe('Dec 25, 2024 00:00');
    });

    it('should handle empty string', () => {
      expect(formatLocalDateTime('')).toBe('');
    });

    it('should handle invalid date string', () => {
      expect(formatLocalDateTime('invalid-date')).toBe('Invalid date');
    });

    it('should handle different timezones', () => {
      const utcDate = '2024-01-15T10:30:00Z';
      const localDate = '2024-01-15T10:30:00';
      
      expect(formatLocalDateTime(utcDate)).toBe('Jan 15, 2024 10:30');
      expect(formatLocalDateTime(localDate)).toBe('Jan 15, 2024 10:30');
    });
  });

  describe('localDateTimeToISO', () => {
    it('should convert local date and time to ISO string', () => {
      expect(localDateTimeToISO('2024-01-15', '10:30')).toBe('2024-01-15T10:30:00.000Z');
      expect(localDateTimeToISO('2024-12-25', '00:00')).toBe('2024-12-25T00:00:00.000Z');
    });

    it('should handle empty inputs', () => {
      expect(localDateTimeToISO('', '10:30')).toBe('');
      expect(localDateTimeToISO('2024-01-15', '')).toBe('');
    });

    it('should handle invalid inputs', () => {
      expect(localDateTimeToISO('invalid', '10:30')).toBe('');
      expect(localDateTimeToISO('2024-01-15', 'invalid')).toBe('');
    });
  });

  describe('isoToLocalDateTime', () => {
    it('should convert ISO string to local date and time', () => {
      const result = isoToLocalDateTime('2024-01-15T10:30:00Z');
      expect(result.date).toBe('2024-01-15');
      expect(result.time).toBe('10:30');
    });

    it('should handle empty input', () => {
      const result = isoToLocalDateTime('');
      expect(result.date).toBe('');
      expect(result.time).toBe('');
    });

    it('should handle invalid input', () => {
      const result = isoToLocalDateTime('invalid-date');
      expect(result.date).toBe('');
      expect(result.time).toBe('');
    });

    it('should handle different timezones', () => {
      const utcResult = isoToLocalDateTime('2024-01-15T10:30:00Z');
      const localResult = isoToLocalDateTime('2024-01-15T10:30:00');
      
      expect(utcResult.date).toBe('2024-01-15');
      expect(utcResult.time).toBe('10:30');
      expect(localResult.date).toBe('2024-01-15');
      expect(localResult.time).toBe('10:30');
    });
  });

  describe('integration tests', () => {
    it('should handle round-trip conversion', () => {
      const originalDate = '2024-01-15';
      const originalTime = '10:30';
      
      const isoString = localDateTimeToISO(originalDate, originalTime);
      const converted = isoToLocalDateTime(isoString);
      
      expect(converted.date).toBe(originalDate);
      expect(converted.time).toBe(originalTime);
    });

    it('should handle real-world task scenarios', () => {
      // Test with a realistic task creation scenario
      const taskCreated = '2024-01-15T14:30:00Z';
      const taskUpdated = '2024-01-16T09:15:00Z';
      
      expect(formatLocalDateTime(taskCreated)).toBe('Jan 15, 2024 14:30');
      expect(formatLocalDateTime(taskUpdated)).toBe('Jan 16, 2024 09:15');
    });

    it('should handle edge cases for task management', () => {
      // Test edge cases that might occur in task management
      expect(formatLocalDateTime('')).toBe('');
      expect(formatLocalDateTime('invalid-date')).toBe('Invalid date');
      
      const result = isoToLocalDateTime('');
      expect(result.date).toBe('');
      expect(result.time).toBe('');
    });
  });
});
