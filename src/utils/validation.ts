/**
 * Validate an email address
 * @param email Email to validate
 * @returns True if the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a password
 * @param password Password to validate
 * @returns True if the password is valid (at least 8 characters)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Validate a display name
 * @param name Display name to validate
 * @returns True if the name is valid (not empty and at least 3 characters)
 */
export const isValidDisplayName = (name: string): boolean => {
  return name.trim().length >= 3;
};

/**
 * Validate a pin title
 * @param title Pin title to validate
 * @returns True if the title is valid (not empty)
 */
export const isValidPinTitle = (title: string): boolean => {
  return title.trim().length > 0;
};

/**
 * Validate a pin note
 * @param note Pin note to validate
 * @returns True if the note is valid (can be empty)
 */
export const isValidPinNote = (note: string): boolean => {
  return true; // Notes can be empty
};

/**
 * Validate a pin location
 * @param location Pin location to validate
 * @returns True if the location is valid (has latitude and longitude)
 */
export const isValidPinLocation = (location: { latitude: number; longitude: number }): boolean => {
  return (
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number'
  );
};

/**
 * Validate a pin hangout time
 * @param time Hangout time to validate
 * @returns True if the time is valid (is a Date object)
 */
export const isValidHangoutTime = (time: Date): boolean => {
  return time instanceof Date && !isNaN(time.getTime());
};

/**
 * Validate a pin expiration time
 * @param time Expiration time to validate
 * @param hangoutTime Hangout time to compare with
 * @returns True if the expiration time is valid (is after the hangout time)
 */
export const isValidExpirationTime = (time: Date, hangoutTime: Date): boolean => {
  return (
    time instanceof Date &&
    !isNaN(time.getTime()) &&
    time > hangoutTime
  );
};

/**
 * Validate a pin visibility list
 * @param visibleTo Array of user IDs
 * @returns True if the visibility list is valid (is an array)
 */
export const isValidVisibilityList = (visibleTo: string[]): boolean => {
  return Array.isArray(visibleTo);
}; 