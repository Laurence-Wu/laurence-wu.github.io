/**
 * Performance Monitoring and Optimization System
 */

const { performance } = require('perf_hooks');
const { Worker } = require('worker_threads');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { logger } = require('./logger');

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.memorySnapshots = [];
    this.enabled = true;
    
    this.logger = logger.child({ component: 'PerformanceMonitor' });
  }

  /**
   * Start timing an operation
   */
  startTimer(name, metadata = {}) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    this.timers.set(name, {
      startTime,
      startMemory,
      metadata
    });
  }

  /**
   * End timing an operation and record metrics
   */
  endTimer(name, additionalMetadata = {}) {
    if (!this.enabled) return null;
    
    const timer = this.timers.get(name);
    if (!timer) {
      this.logger.warn(`Timer not found: ${name}`);
      return null;
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - timer.startTime;
    
    const metric = {
      name,
      duration,
      startTime: timer.startTime,
      endTime,
      memoryDelta: {
        rss: endMemory.rss - timer.startMemory.rss,
        heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
        external: endMemory.external - timer.startMemory.external
      },
      metadata: { ...timer.metadata, ...additionalMetadata }
    };
    
    this.recordMetric(metric);
    this.timers.delete(name);
    
    return metric;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric) {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    this.metrics.get(metric.name).push(metric);
    
    // Keep only last 1000 metrics per operation to prevent memory leaks
    const metrics = this.metrics.get(metric.name);
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operationName) {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) {
      return null;
    }
    
    const durations = metrics.map(m => m.duration);
    const memoryDeltas = metrics.map(m => m.memoryDelta.heapUsed);
    
    return {
      count: metrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        total: durations.reduce((a, b) => a + b, 0)
      },
      memory: {
        minDelta: Math.min(...memoryDeltas),
        maxDelta: Math.max(...memoryDeltas),
        avgDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length
      },
      lastRun: metrics[metrics.length - 1]
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats() {
    const stats = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(label = '') {
    const snapshot = {
      timestamp: Date.now(),
      label,
      memory: process.memoryUsage(),
      performance: {
        nodeStart: performance.timeOrigin,
        now: performance.now()
      }
    };
    
    this.memorySnapshots.push(snapshot);
    
    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift();
    }
    
    return snapshot;
  }

  /**
   * Clear all metrics and timers
   */
  clear() {
    this.metrics.clear();
    this.timers.clear();
    this.memorySnapshots = [];
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const stats = this.getAllStats();
    const currentMemory = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      memory: {
        current: currentMemory,
        snapshots: this.memorySnapshots.slice(-10) // Last 10 snapshots
      },
      operations: stats,
      summary: {
        totalOperations: Object.keys(stats).length,
        totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
        activeTimers: this.timers.size
      }
    };
  }
}

/**
 * Content hash cache for incremental processing
 */
class ContentHashCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 10000; // Maximum number of cached hashes
  }

  /**
   * Generate content hash
   */
  generateHash(content, metadata = {}) {
    const hasher = crypto.createHash('sha256');
    hasher.update(content);
    
    // Include relevant metadata in hash
    if (metadata.lastModified) {
      hasher.update(metadata.lastModified.toString());
    }
    
    return hasher.digest('hex');
  }

  /**
   * Check if content has changed
   */
  hasChanged(filePath, content, metadata = {}) {
    const newHash = this.generateHash(content, metadata);
    const cachedHash = this.cache.get(filePath);
    
    if (cachedHash !== newHash) {
      this.cache.set(filePath, newHash);
      
      // Cleanup old entries if cache is too large
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Get cached hash
   */
  getHash(filePath) {
    return this.cache.get(filePath);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

/**
 * Parallel processing manager
 */
class ParallelProcessor {
  constructor(options = {}) {
    this.maxWorkers = options.maxWorkers || Math.max(1, Math.floor(os.cpus().length / 2));
    this.maxConcurrency = options.maxConcurrency || 4;
    this.workers = [];
    this.activeJobs = 0;
    this.jobQueue = [];
    
    this.logger = logger.child({ component: 'ParallelProcessor' });
  }

  /**
   * Process files in parallel batches
   */
  async processFiles(files, processFn, options = {}) {
    const batchSize = options.batchSize || this.maxConcurrency;
    const results = [];
    
    this.logger.info(`Processing ${files.length} files in batches of ${batchSize}`);
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (file, index) => {
        const jobId = `batch-${Math.floor(i / batchSize)}-${index}`;
        return this.executeJob(jobId, () => processFn(file));
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Optional: Add small delay between batches to prevent overwhelming the system
      if (options.batchDelay && i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, options.batchDelay));
      }
    }
    
    return results;
  }

  /**
   * Execute a job with concurrency control
   */
  async executeJob(jobId, jobFn) {
    return new Promise((resolve, reject) => {
      const job = {
        id: jobId,
        fn: jobFn,
        resolve,
        reject,
        startTime: performance.now()
      };
      
      if (this.activeJobs < this.maxConcurrency) {
        this.runJob(job);
      } else {
        this.jobQueue.push(job);
      }
    });
  }

  /**
   * Run a job
   */
  async runJob(job) {
    this.activeJobs++;
    
    try {
      const result = await job.fn();
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    } finally {
      this.activeJobs--;
      
      // Process next job in queue
      if (this.jobQueue.length > 0) {
        const nextJob = this.jobQueue.shift();
        this.runJob(nextJob);
      }
    }
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      maxWorkers: this.maxWorkers,
      maxConcurrency: this.maxConcurrency,
      activeJobs: this.activeJobs,
      queuedJobs: this.jobQueue.length
    };
  }

  /**
   * Clear job queue
   */
  clear() {
    this.jobQueue = [];
  }
}

/**
 * Memory optimization utilities
 */
class MemoryOptimizer {
  constructor() {
    this.gcThreshold = 100 * 1024 * 1024; // 100MB
    this.lastGcTime = 0;
    this.gcInterval = 30000; // 30 seconds
    
    this.logger = logger.child({ component: 'MemoryOptimizer' });
  }

  /**
   * Check if garbage collection should be triggered
   */
  shouldTriggerGC() {
    const memory = process.memoryUsage();
    const timeSinceLastGC = Date.now() - this.lastGcTime;
    
    return (
      memory.heapUsed > this.gcThreshold ||
      timeSinceLastGC > this.gcInterval
    );
  }

  /**
   * Trigger garbage collection if available
   */
  triggerGC() {
    if (global.gc && this.shouldTriggerGC()) {
      const beforeMemory = process.memoryUsage();
      global.gc();
      const afterMemory = process.memoryUsage();
      
      this.lastGcTime = Date.now();
      
      this.logger.debug('Garbage collection triggered', {
        before: beforeMemory.heapUsed,
        after: afterMemory.heapUsed,
        freed: beforeMemory.heapUsed - afterMemory.heapUsed
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Process large content in chunks to optimize memory usage
   */
  async processLargeContent(content, chunkSize = 1024 * 1024, processFn) {
    if (content.length <= chunkSize) {
      return processFn(content);
    }
    
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      chunks.push(chunk);
    }
    
    const results = [];
    for (const chunk of chunks) {
      const result = await processFn(chunk);
      results.push(result);
      
      // Trigger GC periodically during large processing
      this.triggerGC();
    }
    
    return results.join('');
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    const memory = process.memoryUsage();
    
    return {
      ...memory,
      gcThreshold: this.gcThreshold,
      lastGcTime: this.lastGcTime,
      shouldTriggerGC: this.shouldTriggerGC()
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();
const contentHashCache = new ContentHashCache();
const memoryOptimizer = new MemoryOptimizer();

/**
 * Performance decorator for timing functions
 */
function timed(name) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      performanceMonitor.startTimer(`${name || propertyKey}`, {
        className: target.constructor.name,
        method: propertyKey
      });
      
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTimer(`${name || propertyKey}`, { success: true });
        return result;
      } catch (error) {
        performanceMonitor.endTimer(`${name || propertyKey}`, { 
          success: false, 
          error: error.message 
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Utility function to measure execution time
 */
export async function measureTime(name, fn, metadata = {}) {
  performanceMonitor.startTimer(name, metadata);
  try {
    const result = await fn();
    const metric = performanceMonitor.endTimer(name, { success: true });
    return { result, metric };
  } catch (error) {
    performanceMonitor.endTimer(name, { success: false, error: error.message });
    throw error;
  }
}

module.exports = {
  PerformanceMonitor,
  ContentHashCache,
  ParallelProcessor,
  MemoryOptimizer,
  timed,
  performanceMonitor,
  contentHashCache,
  memoryOptimizer,
  measureTime
};
