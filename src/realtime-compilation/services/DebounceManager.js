/**
 * DebounceManager - Manages debounced function calls with per-key debouncing
 * 
 * This class provides per-file debouncing to prevent excessive compilation
 * during rapid file changes. Each file path gets its own debounce timer.
 */
class DebounceManager {
  /**
   * Create a new DebounceManager instance
   * @param {number} delayMs - Default delay in milliseconds (default: 300ms)
   */
  constructor(delayMs = 300) {
    this.delayMs = delayMs;
    this.timers = new Map(); // Map<string, NodeJS.Timeout>
    this.callbacks = new Map(); // Map<string, Function>
  }

  /**
   * Debounce a function call for a specific key
   * @param {string} key - Unique identifier (typically file path)
   * @param {Function} callback - Function to execute after delay
   * @param {number} [customDelay] - Custom delay for this specific call
   */
  debounce(key, callback, customDelay) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const delay = customDelay ?? this.delayMs;
    
    // Cancel existing timer for this key
    this.cancel(key);
    
    // Store the callback
    this.callbacks.set(key, callback);
    
    // Set new timer
    const timer = setTimeout(() => {
      try {
        const storedCallback = this.callbacks.get(key);
        if (storedCallback) {
          storedCallback();
        }
      } catch (error) {
        // Error executing debounced callback
      } finally {
        // Clean up after execution
        this.timers.delete(key);
        this.callbacks.delete(key);
      }
    }, delay);
    
    this.timers.set(key, timer);
  }

  /**
   * Cancel a pending debounced call for a specific key
   * @param {string} key - Unique identifier to cancel
   * @returns {boolean} - True if a timer was cancelled, false if no timer existed
   */
  cancel(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
      this.callbacks.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Immediately execute and cancel a pending debounced call
   * @param {string} key - Unique identifier to flush
   * @returns {boolean} - True if a callback was executed, false if no callback existed
   */
  flush(key) {
    const callback = this.callbacks.get(key);
    if (callback) {
      // Cancel the timer
      this.cancel(key);
      
      // Execute immediately
      try {
        callback();
        return true;
      } catch (error) {
        console.error(`Error executing flushed callback for key "${key}":`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Flush all pending debounced calls immediately
   * @returns {number} - Number of callbacks that were executed
   */
  flushAll() {
    let executedCount = 0;
    const keys = Array.from(this.callbacks.keys());
    
    for (const key of keys) {
      if (this.flush(key)) {
        executedCount++;
      }
    }
    
    return executedCount;
  }

  /**
   * Cancel all pending debounced calls
   * @returns {number} - Number of timers that were cancelled
   */
  cancelAll() {
    const cancelledCount = this.timers.size;
    
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.timers.clear();
    this.callbacks.clear();
    
    return cancelledCount;
  }

  /**
   * Check if a key has a pending debounced call
   * @param {string} key - Unique identifier to check
   * @returns {boolean} - True if there's a pending call for this key
   */
  hasPending(key) {
    return this.timers.has(key);
  }

  /**
   * Get the number of pending debounced calls
   * @returns {number} - Number of pending calls
   */
  getPendingCount() {
    return this.timers.size;
  }

  /**
   * Get all keys with pending debounced calls
   * @returns {string[]} - Array of keys with pending calls
   */
  getPendingKeys() {
    return Array.from(this.timers.keys());
  }

  /**
   * Clean up all resources (useful for shutdown)
   */
  destroy() {
    this.cancelAll();
  }
}

export default DebounceManager;