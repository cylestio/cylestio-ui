/**
 * Date utilities for handling timestamps in the application
 */

/**
 * Formats a Date object to ISO 8601 format with UTC timezone (Z)
 * For use in API query parameters
 * @param date Date object to format
 * @returns ISO 8601 string with UTC timezone (Z)
 */
export function formatDateToUTC(date: Date): string {
  return date.toISOString(); // Already returns ISO 8601 format with 'Z' (UTC)
}

/**
 * Formats Date objects for a time range to ISO 8601 format with UTC timezone
 * @param startDate Start date of range
 * @param endDate End date of range
 * @returns Object with from_time and to_time as ISO 8601 strings in UTC
 */
export function formatTimeRangeToUTC(startDate: Date, endDate: Date): { from_time: string, to_time: string } {
  return {
    from_time: formatDateToUTC(startDate),
    to_time: formatDateToUTC(endDate)
  };
}

/**
 * Parses an ISO 8601 string (UTC) and converts to a Date object
 * @param isoString ISO 8601 string to parse
 * @returns Date object
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Converts an ISO 8601 string (UTC) to local time string for display
 * @param isoString ISO 8601 string to convert
 * @param options Optional Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in local timezone
 */
export function formatISOToLocalDisplay(
  isoString: string, 
  options: Intl.DateTimeFormatOptions = { 
    dateStyle: 'medium', 
    timeStyle: 'short'
  }
): string {
  try {
    const date = parseISODate(isoString);
    return date.toLocaleString(undefined, options);
  } catch (e) {
    return 'Invalid date';
  }
}

/**
 * Formats a date for chart display, with appropriate format based on time range
 * @param isoString ISO 8601 string to format
 * @param timeRange Time range string (e.g., '24h', '7d')
 * @returns Formatted date string for chart display
 */
export function formatChartDate(isoString: string, timeRange: string): string {
  const date = parseISODate(isoString);
  
  switch (timeRange) {
    case '1h':
    case '24h':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '7d':
      return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    case '30d':
    default:
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
} 