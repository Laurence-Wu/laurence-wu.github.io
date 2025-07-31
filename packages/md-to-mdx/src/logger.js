/**
 * Logging utility for MD to MDX compilation
 */

/**
 * Log levels
 */
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Logger class with context support
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO;
    this.prefix = options.prefix || '[MD-to-MDX]';
    this.colors = options.colors !== false;
    this.timestamp = options.timestamp !== false;
  }

  /**
   * Format message with timestamp and prefix
   */
  formatMessage(level, message, context = {}) {
    let formatted = '';
    
    if (this.timestamp) {
      formatted += `[${new Date().toISOString()}] `;
    }
    
    formatted += `${this.prefix} `;
    
    if (this.colors) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[90m'  // Gray
      };
      const reset = '\x1b[0m';
      formatted += `${colors[level] || ''}${message}${reset}`;
    } else {
      formatted += message;
    }
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }

  /**
   * Log error message
   */
  error(message, context = {}) {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message, context = {}) {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    if (this.level >= LogLevel.INFO) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  /**
   * Log debug message
   */
  debug(message, context = {}) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context = {}) {
    return new ContextLogger(this, context);
  }
}

/**
 * Context logger that adds context to all messages
 */
class ContextLogger {
  constructor(parent, context = {}) {
    this.parent = parent;
    this.context = context;
  }

  error(message, additionalContext = {}) {
    this.parent.error(message, { ...this.context, ...additionalContext });
  }

  warn(message, additionalContext = {}) {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  info(message, additionalContext = {}) {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  debug(message, additionalContext = {}) {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  child(additionalContext = {}) {
    return new ContextLogger(this.parent, { ...this.context, ...additionalContext });
  }
}

/**
 * Default logger instance
 */
const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  colors: process.stdout.isTTY,
  timestamp: true
});

/**
 * Performance logger for timing operations
 */
class PerformanceLogger {
  constructor(logger) {
    this.logger = logger;
    this.timers = new Map();
  }

  /**
   * Start timing an operation
   */
  start(operation, context = {}) {
    const startTime = performance.now();
    this.timers.set(operation, { startTime, context });
    this.logger.debug(`Started ${operation}`, context);
  }

  /**
   * End timing an operation
   */
  end(operation, additionalContext = {}) {
    const timer = this.timers.get(operation);
    if (!timer) {
      this.logger.warn(`Timer not found for operation: ${operation}`);
      return;
    }

    const duration = performance.now() - timer.startTime;
    const context = { ...timer.context, ...additionalContext, duration: `${duration.toFixed(2)}ms` };
    
    this.logger.info(`Completed ${operation}`, context);
    this.timers.delete(operation);
    
    return duration;
  }

  /**
   * Time a function execution
   */
  async time(operation, fn, context = {}) {
    this.start(operation, context);
    try {
      const result = await fn();
      this.end(operation);
      return result;
    } catch (error) {
      this.end(operation, { error: error.message });
      throw error;
    }
  }
}

/**
 * Default performance logger
 */
const perfLogger = new PerformanceLogger(logger);

module.exports = {
  Logger,
  ContextLogger,
  PerformanceLogger,
  LogLevel,
  logger,
  perfLogger
};
