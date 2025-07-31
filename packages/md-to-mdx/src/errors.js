/**
 * Error handling classes for MD to MDX compilation
 */

/**
 * Base error class for processing errors
 */
class ProcessingError extends Error {
  constructor(options = {}) {
    super(options.message || 'Processing error occurred');
    
    this.name = 'ProcessingError';
    this.file = options.file || null;
    this.line = options.line || null;
    this.column = options.column || null;
    this.processor = options.processor || null;
    this.originalError = options.originalError || null;
    this.context = options.context || {};
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProcessingError);
    }
  }

  /**
   * Get formatted error message with context
   */
  getFormattedMessage() {
    let message = this.message;
    
    if (this.file) {
      message += `\n  File: ${this.file}`;
    }
    
    if (this.line !== null) {
      message += `\n  Line: ${this.line}`;
      if (this.column !== null) {
        message += `, Column: ${this.column}`;
      }
    }
    
    if (this.processor) {
      message += `\n  Processor: ${this.processor}`;
    }
    
    if (this.originalError) {
      message += `\n  Original Error: ${this.originalError.message}`;
    }
    
    return message;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      file: this.file,
      line: this.line,
      column: this.column,
      processor: this.processor,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * File system related errors
 */
class FileSystemError extends ProcessingError {
  constructor(options = {}) {
    super(options);
    this.name = 'FileSystemError';
  }
}

/**
 * Content parsing and transformation errors
 */
class ContentError extends ProcessingError {
  constructor(options = {}) {
    super(options);
    this.name = 'ContentError';
  }
}

/**
 * Mermaid syntax errors
 */
class MermaidError extends ContentError {
  constructor(options = {}) {
    super(options);
    this.name = 'MermaidError';
    this.processor = 'mermaid';
  }
}

/**
 * Math expression errors
 */
class MathError extends ContentError {
  constructor(options = {}) {
    super(options);
    this.name = 'MathError';
    this.processor = 'math';
  }
}

/**
 * Configuration errors
 */
class ConfigurationError extends ProcessingError {
  constructor(options = {}) {
    super(options);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error handler utility
 */
class ErrorHandler {
  constructor(options = {}) {
    this.logErrors = options.logErrors !== false;
    this.throwOnError = options.throwOnError === true;
    this.continueOnError = options.continueOnError !== false;
  }

  /**
   * Handle processing error
   */
  handle(error, context = {}) {
    const processedError = this.processError(error, context);
    
    if (this.logErrors) {
      console.error(processedError.getFormattedMessage());
    }
    
    if (this.throwOnError) {
      throw processedError;
    }
    
    return processedError;
  }

  /**
   * Process and enhance error with context
   */
  processError(error, context = {}) {
    if (error instanceof ProcessingError) {
      // Add additional context if provided
      if (context.file && !error.file) {
        error.file = context.file;
      }
      if (context.processor && !error.processor) {
        error.processor = context.processor;
      }
      return error;
    }
    
    // Convert regular errors to ProcessingError
    return new ProcessingError({
      message: error.message,
      originalError: error,
      ...context
    });
  }

  /**
   * Create error with context
   */
  createError(message, context = {}) {
    return new ProcessingError({
      message,
      ...context
    });
  }
}

/**
 * Default error handler instance
 */
const defaultErrorHandler = new ErrorHandler({
  logErrors: true,
  throwOnError: false,
  continueOnError: true
});

// For backward compatibility, also export ValidationError
const ValidationError = ConfigurationError;

module.exports = {
  ProcessingError,
  FileSystemError,
  ContentError,
  MermaidError,
  MathError,
  ConfigurationError,
  ValidationError,
  ErrorHandler
};