import { format, formatDistance, formatRelative, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

/**
 * Format a date to a readable string (e.g., "Jan 1, 2023")
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a time to a readable string (e.g., "3:30 PM")
 * @param date Date to extract time from
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format a date and time to a readable string (e.g., "Jan 1, 2023 at 3:30 PM")
 * @param date Date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if the date is in the past, false otherwise
 */
export const isDateInPast = (date: Date | string | number): boolean => {
  try {
    // Convert to Date object if not already
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else if (date && typeof (date as any).toDate === 'function') {
      // Handle Firestore Timestamp objects
      dateObj = (date as any).toDate();
    } else {
      console.error('Invalid date format:', date);
      return false;
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date after conversion:', date);
      return false;
    }
    
    const now = new Date();
    
    // Compare dates by timestamp to avoid timezone issues
    return dateObj.getTime() < now.getTime();
  } catch (error) {
    console.error('Error in isDateInPast:', error);
    return false;
  }
};

/**
 * Check if a date is in the future
 * @param date Date to check
 * @returns True if the date is in the future, false otherwise
 */
export const isDateInFuture = (date: Date): boolean => {
  const now = new Date();
  return date > now;
};

/**
 * Get the time difference between two dates in a human-readable format
 * @param date1 First date
 * @param date2 Second date (defaults to now)
 * @returns Human-readable time difference
 */
export const getTimeDifference = (date1: Date, date2: Date = new Date()): string => {
  const diffInMilliseconds = Math.abs(date2.getTime() - date1.getTime());
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  } else {
    return 'Just now';
  }
};

/**
 * Get a relative time string (e.g., "2 hours ago" or "in 3 days")
 * @param date Date to compare
 * @returns Relative time string
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const isPast = date < now;
  const timeDiff = getTimeDifference(date, now);
  
  return isPast ? `${timeDiff} ago` : `in ${timeDiff}`;
};

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if the date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
};

/**
 * Check if a date is in the future
 * @param date Date to check
 * @returns True if the date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > new Date();
};

/**
 * Get a date object for a specific time today
 * @param hours Hours (0-23)
 * @param minutes Minutes (0-59)
 * @returns Date object
 */
export const getTimeToday = (hours: number, minutes: number): Date => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Add hours to a date
 * @param date Base date
 * @param hours Hours to add
 * @returns New date with added hours
 */
export const addHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

/**
 * Format a date for display in a pin
 * @param date Date to format
 * @returns Formatted date string for pin display
 */
export const formatPinDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today, ${format(dateObj, 'h:mm a')}`;
  } else if (isTomorrow(dateObj)) {
    return `Tomorrow, ${format(dateObj, 'h:mm a')}`;
  } else {
    return format(dateObj, 'EEE, MMM d, h:mm a');
  }
}; 