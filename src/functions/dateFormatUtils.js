import moment from "moment";

/**
 * Utility functions for date validation, conversion, and formatting
 * Centralizes all date-related operations for consistency across the app
 */

/**
 * Validate if a value is a valid date
 * @param {*} date - Value to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

/**
 * Check if a value is a moment object
 * @param {*} value - Value to check
 * @returns {boolean} True if moment object
 */
export const isMomentObject = (value) => {
  return moment.isMoment(value);
};

/**
 * Convert various date formats to JavaScript Date object
 * @param {Date|moment|string} dateInput - Input date in various formats
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const convertToDate = (dateInput) => {
  if (!dateInput) return null;

  // Already a Date object
  if (isValidDate(dateInput)) {
    return dateInput;
  }

  // Moment object
  if (isMomentObject(dateInput)) {
    return dateInput.toDate();
  }

  // String - try to parse
  if (typeof dateInput === "string") {
    const parsed = new Date(dateInput);
    return isValidDate(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Format date for display using Intl.DateTimeFormat
 * @param {Date|moment|string} date - Date to format
 * @param {Object} options - Formatting options (default: { dateStyle: 'short' })
 * @returns {string|null} Formatted date string or null if invalid
 */
export const formatDateForDisplay = (
  date,
  options = { dateStyle: "short" },
) => {
  const dateObj = convertToDate(date);
  if (!dateObj) return null;

  try {
    // eslint-disable-next-line no-undef
    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
  } catch (error) {
    console.warn("Date formatting error:", error);
    return null;
  }
};

/**
 * Format date as YYYY-MM-DD string for Monday.com API
 * @param {Date|moment|string} date - Date to format
 * @returns {string|null} YYYY-MM-DD formatted string or null if invalid
 */
export const formatDateForAPI = (date) => {
  const dateObj = convertToDate(date);
  if (!dateObj) return null;

  try {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn("API date formatting error:", error);
    return null;
  }
};

/**
 * Create column value for Monday.com based on column type
 * @param {Date|moment|string} date - Date to format
 * @param {string} columnType - Type of column ('date', 'timeline', etc.)
 * @param {Object} currentColumnValue - Current column value for timeline columns
 * @returns {string|null} JSON string for column value or null if invalid
 */
export const createColumnValue = (
  date,
  columnType = "date",
  currentColumnValue = null,
) => {
  const dateString = formatDateForAPI(date);
  if (!dateString) return null;

  try {
    if (columnType === "timeline") {
      const fromDate = currentColumnValue?.value
        ? JSON.parse(currentColumnValue.value).from
        : null;
      return JSON.stringify({ from: fromDate, to: dateString });
    }

    // Default date column
    return JSON.stringify({ date: dateString });
  } catch (error) {
    console.warn("Column value creation error:", error);
    return null;
  }
};

/**
 * Parse date from Monday.com column value
 * @param {string} columnValue - JSON string from Monday.com
 * @param {string} columnType - Type of column ('date', 'timeline', etc.)
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDateFromColumnValue = (columnValue, columnType = "date") => {
  if (!columnValue) return null;

  try {
    const parsed = JSON.parse(columnValue);

    if (columnType === "timeline") {
      // For timeline columns, use 'to' date or fall back to 'from'
      const dateString = parsed.to || parsed.from;
      return dateString ? new Date(dateString) : null;
    }

    // Default date column
    return parsed.date ? new Date(parsed.date) : null;
  } catch (error) {
    console.warn("Column value parsing error:", error);
    return null;
  }
};

/**
 * Get current date as moment object (for date picker initialization)
 * @param {Date|moment|string} fallbackDate - Fallback date if no current date
 * @returns {moment} Moment object for current or fallback date
 */
export const getCurrentMoment = (fallbackDate = null) => {
  if (fallbackDate) {
    const dateObj = convertToDate(fallbackDate);
    return dateObj ? moment(dateObj) : moment();
  }
  return moment();
};

/**
 * Validate date input for API operations
 * @param {*} dateInput - Date input to validate
 * @returns {Object} Validation result with { isValid, date, error }
 */
export const validateDateInput = (dateInput) => {
  if (!dateInput) {
    return { isValid: false, date: null, error: "No date provided" };
  }

  const convertedDate = convertToDate(dateInput);
  if (!convertedDate) {
    return { isValid: false, date: null, error: "Invalid date format" };
  }

  return { isValid: true, date: convertedDate, error: null };
};
