// Browser-compatible logger that handles both monday.com and local development
// This logger gracefully handles the browser environment where process may not be defined

/**
 * Browser-compatible logging utility
 * Uses monday.com Logger when available, falls back to console logging for development
 */
class TimelineLogger {
  /**
   * Check if we're in the monday.com environment
   */
  static isMondayEnvironment() {
    return typeof window !== 'undefined' && 
           window.monday !== undefined &&
           typeof process !== 'undefined' &&
           process.env !== undefined;
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {Object} [metadata] - Additional metadata to include
   */
  static info(message, metadata = {}) {
    if (this.isMondayEnvironment()) {
      console.log(`[TIMELINE-INFO] ${message}`, metadata);
    } else {
      console.log(`%c[INFO] ${message}`, 'color: #0066cc', metadata);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - The warning message to log
   * @param {Object} [metadata] - Additional metadata to include
   */
  static warn(message, metadata = {}) {
    if (this.isMondayEnvironment()) {
      console.warn(`[TIMELINE-WARN] ${message}`, metadata);
    } else {
      console.warn(`%c[WARN] ${message}`, 'color: #ff6600', metadata);
    }
  }

  /**
   * Log a debug message
   * @param {string} message - The debug message to log
   * @param {Object} [metadata] - Additional metadata to include
   */
  static debug(message, metadata = {}) {
    if (this.isMondayEnvironment()) {
      console.debug(`[TIMELINE-DEBUG] ${message}`, metadata);
    } else {
      console.debug(`%c[DEBUG] ${message}`, 'color: #666666', metadata);
    }
  }

  /**
   * Log an error message
   * @param {string} message - The error message to log
   * @param {Error} [error] - The error object to include
   * @param {Object} [metadata] - Additional metadata to include
   */
  static error(message, error = null, metadata = {}) {
    const logData = { ...metadata };
    if (error) {
      logData.error = error.message || error;
      logData.stack = error.stack;
    }
    
    if (this.isMondayEnvironment()) {
      console.error(`[TIMELINE-ERROR] ${message}`, logData);
    } else {
      console.error(`%c[ERROR] ${message}`, 'color: #cc0000', logData);
    }
  }

  /**
   * Log app initialization
   * @param {Object} context - The app context
   */
  static appInitialized(context) {
    this.info('Timeline Builder app initialized', { 
      boardId: context?.boardId,
      theme: context?.theme,
      user: context?.user 
    });
  }

  /**
   * Log data fetching operations
   * @param {string} operation - The operation being performed
   * @param {Object} details - Details about the operation
   */
  static dataOperation(operation, details = {}) {
    this.info(`Data operation: ${operation}`, details);
  }

  /**
   * Log user interactions
   * @param {string} action - The user action performed
   * @param {Object} details - Details about the action
   */
  static userAction(action, details = {}) {
    this.info(`User action: ${action}`, details);
  }

  /**
   * Log performance metrics
   * @param {string} metric - The metric name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} details - Additional details
   */
  static performance(metric, duration, details = {}) {
    this.info(`Performance: ${metric}`, { 
      duration: `${duration}ms`,
      ...details 
    });
  }
}

export default TimelineLogger;
