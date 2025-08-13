import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate, formatDateTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDuration', () => {
    it('should format duration in minutes correctly', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(60)).toBe('60 min');
      expect(formatDuration(90)).toBe('90 min');
    });

    it('should format duration in hours and minutes', () => {
      expect(formatDuration(120)).toBe('2h 0min');
      expect(formatDuration(150)).toBe('2h 30min');
      expect(formatDuration(180)).toBe('3h 0min');
      expect(formatDuration(195)).toBe('3h 15min');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0 min');
    });

    it('should handle negative duration', () => {
      expect(formatDuration(-30)).toBe('-30 min');
      expect(formatDuration(-120)).toBe('-2h 0min');
    });

    it('should handle large durations', () => {
      expect(formatDuration(1440)).toBe('24h 0min'); // 24 hours
      expect(formatDuration(1500)).toBe('25h 0min'); // 25 hours
    });

    it('should handle decimal durations', () => {
      expect(formatDuration(30.5)).toBe('30 min');
      expect(formatDuration(90.7)).toBe('90 min');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('15 Jan 2024');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2024-12-25T00:00:00Z');
      expect(formatDate(date1)).toBe('25 Dec 2024');

      const date2 = new Date('2024-03-01T12:00:00Z');
      expect(formatDate(date2)).toBe('1 Mar 2024');
    });

    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T10:30:00Z');
      expect(formatDate(leapYearDate)).toBe('29 Feb 2024');
    });

    it('should handle edge cases', () => {
      const startOfYear = new Date('2024-01-01T00:00:00Z');
      expect(formatDate(startOfYear)).toBe('1 Jan 2024');

      const endOfYear = new Date('2024-12-31T23:59:59Z');
      expect(formatDate(endOfYear)).toBe('31 Dec 2024');
    });

    it('should handle different timezones', () => {
      // Test with different timezone offsets
      const utcDate = new Date('2024-01-15T10:30:00Z');
      const localDate = new Date('2024-01-15T10:30:00');
      
      // Both should format the same way regardless of timezone
      expect(formatDate(utcDate)).toBe('15 Jan 2024');
      expect(formatDate(localDate)).toBe('15 Jan 2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDateTime(date)).toBe('15 Jan 2024, 10:30');
    });

    it('should handle different time formats', () => {
      const morning = new Date('2024-01-15T09:05:00Z');
      expect(formatDateTime(morning)).toBe('15 Jan 2024, 09:05');

      const evening = new Date('2024-01-15T23:45:00Z');
      expect(formatDateTime(evening)).toBe('15 Jan 2024, 23:45');
    });

    it('should handle midnight and noon', () => {
      const midnight = new Date('2024-01-15T00:00:00Z');
      expect(formatDateTime(midnight)).toBe('15 Jan 2024, 00:00');

      const noon = new Date('2024-01-15T12:00:00Z');
      expect(formatDateTime(noon)).toBe('15 Jan 2024, 12:00');
    });

    it('should handle single digit minutes', () => {
      const singleMinute = new Date('2024-01-15T10:05:00Z');
      expect(formatDateTime(singleMinute)).toBe('15 Jan 2024, 10:05');
    });

    it('should handle different months', () => {
      const january = new Date('2024-01-15T10:30:00Z');
      expect(formatDateTime(january)).toBe('15 Jan 2024, 10:30');

      const december = new Date('2024-12-15T10:30:00Z');
      expect(formatDateTime(december)).toBe('15 Dec 2024, 10:30');
    });

    it('should handle edge cases', () => {
      const startOfYear = new Date('2024-01-01T00:00:00Z');
      expect(formatDateTime(startOfYear)).toBe('1 Jan 2024, 00:00');

      const endOfYear = new Date('2024-12-31T23:59:59Z');
      expect(formatDateTime(endOfYear)).toBe('31 Dec 2024, 23:59');
    });

    it('should handle different timezones consistently', () => {
      const utcDate = new Date('2024-01-15T10:30:00Z');
      const localDate = new Date('2024-01-15T10:30:00');
      
      // Both should format the same way regardless of timezone
      expect(formatDateTime(utcDate)).toBe('15 Jan 2024, 10:30');
      expect(formatDateTime(localDate)).toBe('15 Jan 2024, 10:30');
    });
  });

  describe('integration tests', () => {
    it('should handle real-world date scenarios', () => {
      // Test with a realistic task creation scenario
      const taskCreated = new Date('2024-01-15T14:30:00Z');
      const taskUpdated = new Date('2024-01-16T09:15:00Z');
      
      expect(formatDate(taskCreated)).toBe('15 Jan 2024');
      expect(formatDateTime(taskCreated)).toBe('15 Jan 2024, 14:30');
      expect(formatDate(taskUpdated)).toBe('16 Jan 2024');
      expect(formatDateTime(taskUpdated)).toBe('16 Jan 2024, 09:15');
    });

    it('should handle duration formatting for task planning', () => {
      // Test realistic task durations
      const shortTask = 15; // 15 minutes
      const mediumTask = 120; // 2 hours
      const longTask = 480; // 8 hours (full day)
      const multiDayTask = 1440; // 24 hours
      
      expect(formatDuration(shortTask)).toBe('15 min');
      expect(formatDuration(mediumTask)).toBe('2h 0min');
      expect(formatDuration(longTask)).toBe('8h 0min');
      expect(formatDuration(multiDayTask)).toBe('24h 0min');
    });

    it('should handle edge cases for task management', () => {
      // Test edge cases that might occur in task management
      const zeroDuration = 0;
      const negativeDuration = -30;
      const veryLongDuration = 10080; // 1 week in minutes
      
      expect(formatDuration(zeroDuration)).toBe('0 min');
      expect(formatDuration(negativeDuration)).toBe('-30 min');
      expect(formatDuration(veryLongDuration)).toBe('168h 0min');
    });
  });
});
