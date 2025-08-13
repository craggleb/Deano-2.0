import { format } from 'date-fns';

/**
 * Formats a date string to display in local timezone
 * Handles timezone conversion properly for BST/GMT
 */
export function formatLocalDateTime(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Converts a local date and time to ISO string
 * Ensures proper timezone handling
 */
export function localDateTimeToISO(date: string, time: string): string {
  if (!date || !time) return '';
  
  try {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create date in local timezone
    const localDate = new Date(year, month - 1, day, hours, minutes);
    
    // Convert to ISO string (this will be in UTC)
    return localDate.toISOString();
  } catch (error) {
    console.error('Error converting to ISO:', error);
    return '';
  }
}

/**
 * Converts ISO string to local date and time values
 * Handles timezone conversion properly
 */
export function isoToLocalDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: '', time: '' };
  
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  } catch (error) {
    console.error('Error converting from ISO:', error);
    return { date: '', time: '' };
  }
}
