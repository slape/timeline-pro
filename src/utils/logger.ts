// Browser-compatible logger that doesn't rely on server-side SDK features
// Simple implementation that works in both development and production environments

/**
 * Browser-compatible logging utility for the Timeline Builder app
 */
export type LogMetadata = Record<string, unknown>;

declare global {
  interface Window {
    monday?: any;
  }
}


/**
 * Lightweight logger that works in both monday.com iframe and local dev.
 * No compile-time dependency on the monday SDK – it only checks for
 * `window.monday` at runtime.
 */
class TimelineLogger {
  /**
   * Check if we're in the monday.com environment
   */
  static isMondayEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           window.monday !== undefined;
  }

  /**
   * Format metadata for console output
   */
  static formatMetadata(metadata: LogMetadata): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return '';
    }
    
    try {
      return JSON.stringify(metadata, null, 2);
    } catch (e) {
      return '[Unable to stringify metadata]';
    }
  }

  /**
   * Log an info message - FOCUSED DEBUG MODE: Suppress most info logs
   * @param {string} message - The message to log
   * @param {Object} [metadata] - Additional metadata to include
   */
  static info(message: string, metadata: LogMetadata = {}): void {
    // Suppress ALL info logs during focused debugging
    // All info messages are suppressed for clean console
  }

  /**
   * Log a warning message
   * @param {string} message - The warning message to log
   * @param {Object} [metadata] - Additional metadata to include
   */
  static warn(message: string, metadata: LogMetadata = {}): void {
    const formattedMeta = this.formatMetadata(metadata);
    console.warn(`%c[WARN] ${message}`, 'color: #ff6600', formattedMeta || '');
  }

  /**
   * Log a debug message - FOCUSED DEBUG MODE: Only show critical hidden items debugging
   * @param {string} message - The debug message to log
   * @param {Object} [metadata] - Additional metadata to include
   */
  static debug(message: string, metadata: LogMetadata = {}): void {
    // FOCUSED DEBUG MODE: Show all bounds debugging for constants verification
    const criticalKeywords = [
      '🎯 ALTERNATE MODE DETECTED',
      '🔍 ALTERNATE BOUNDS',
      '🔍 ABOVE BOUNDS',
      '🔍 BELOW BOUNDS',
      '🚨 ALTERNATE BOUNDS ENFORCED',
      '[DRAG-DEBUG]',
      '[Y-DELTA]'
    ];
    
    const isCritical = criticalKeywords.some(keyword => message.includes(keyword));
    
    if (isCritical) {
      const formattedMeta = this.formatMetadata(metadata);
      console.debug(`%c[DEBUG] ${message}`, 'color: #666666', formattedMeta || '');
    }
    // All other debug messages are suppressed for clean console
  }

  /**
   * Log an error message
   * @param {string} message - The error message to log
   * @param {Error} [error] - The error object to include
   * @param {Object} [metadata] - Additional metadata to include
   */
  static error(message: string, error: unknown = null, metadata: LogMetadata = {}): void {
    const logData = { ...metadata };
    
    if (error) {
      if (error instanceof Error) {
        logData.error = error.message;
        logData.stack = error.stack;
      } else if (typeof error === 'string') {
        logData.error = error;
      }
    
    }
    
    const formattedMeta = this.formatMetadata(logData);
    console.error(`%c[ERROR] ${message}`, 'color: #cc0000', formattedMeta || '');
  }

  /**
   * Log app initialization
   * @param {Object} context - The app context
   */
  static appInitialized(context?: {
    /** Board ID can be string (legacy) or number (numeric ID from monday context) */
    boardId?: string | number;
    theme?: string;
    /** User can be userId string or full user object from monday SDK */
    user?: string | { id: string; [k: string]: any };
  }): void {
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
  static dataOperation(operation: string, details: LogMetadata = {}): void {
    this.info(`Data operation: ${operation}`, details);
  }

  /**
   * Log user interactions
   * @param {string} action - The user action performed
   * @param {Object} details - Details about the action
   */
  static userAction(action: string, details: LogMetadata = {}): void {
    this.info(`User action: ${action}`, details);
  }

  /**
   * Log performance metrics
   * @param {string} metric - The metric name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} details - Additional details
   */
  static performance(metric: string, duration: number, details: LogMetadata = {}): void {
    this.info(`Performance: ${metric}`, { 
      duration: `${duration}ms`,
      ...details 
    });
  }
}

export default TimelineLogger;
