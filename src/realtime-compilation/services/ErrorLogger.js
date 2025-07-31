/**
 * Simple ErrorLogger for real-time compilation
 */

export class ErrorLogger {
  constructor(options = {}) {
    this.enableLogging = options.enableLogging !== false;
  }

  logError(error, context = {}) {
    if (!this.enableLogging) return;
    
    const message = error?.message || 'Unknown error';
    console.error(`[Error] ${message}`, context);
  }

  logInfo(message, context = {}) {
    if (!this.enableLogging) return;
    console.log(`[Info] ${message}`, context);
  }

  logWarning(message, context = {}) {
    if (!this.enableLogging) return;
    console.warn(`[Warning] ${message}`, context);
  }
}

export default ErrorLogger;