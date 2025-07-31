/**
 * RealtimeCompiler - Main orchestrator for real-time MD to MDX compilation
 * 
 * This class coordinates all components (FileWatcherService, DebounceManager, 
 * CompilationEngine, FileManager, and ErrorLogger) to provide seamless
 * real-time compilation with status tracking and concurrent processing.
 */

import { EventEmitter } from 'events';
import { FileWatcherService } from './FileWatcherService.js';
import DebounceManager from './DebounceManager.js';
import { CompilationEngine } from './CompilationEngine.js';
import { FileManager } from './FileManager.js';
import { ErrorLogger, ErrorCategories } from './ErrorLogger.js';

/**
 * Compilation status constants
 */
export const CompilationStatus = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  WATCHING: 'watching',
  COMPILING: 'compiling',
  ERROR: 'error',
  STOPPED: 'stopped'
};

/**
 * File processing status
 */
export const FileStatus = {
  PENDING: 'pending',
  COMPILING: 'compiling',
  COMPLETED: 'completed',
  ERROR: 'error'
};

/**
 * Main RealtimeCompiler class
 */
export class RealtimeCompiler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      watchPaths: options.watchPaths || ['src/content/blog', 'src/content/projects'],
      debounceMs: options.debounceMs || 300,
      maxConcurrentCompilations: options.maxConcurrentCompilations || 5,
      enableHotReload: options.enableHotReload !== false,
      logLevel: options.logLevel || 'info',
      ...options
    };

    // Initialize components
    this.fileWatcher = new FileWatcherService({
      watchPaths: this.options.watchPaths,
      debounceMs: this.options.debounceMs
    });

    this.debounceManager = new DebounceManager(this.options.debounceMs);
    
    this.compilationEngine = new CompilationEngine({
      preserveFrontmatter: true,
      enableMermaidSupport: true,
      enableMathSupport: true
    });

    this.fileManager = new FileManager({
      contentRoot: 'src/content',
      outputExtension: '.mdx'
    });

    this.errorLogger = new ErrorLogger({
      logLevel: this.options.logLevel,
      enableConsoleOutput: true
    });

    // State management
    this.status = CompilationStatus.IDLE;
    this.compilationQueue = new Map(); // Map<filePath, FileProcessingInfo>
    this.activeCompilations = new Set(); // Set<filePath>
    this.compilationHistory = [];
    
    // Statistics
    this.stats = {
      totalFilesProcessed: 0,
      successfulCompilations: 0,
      failedCompilations: 0,
      averageCompilationTime: 0,
      queuedFiles: 0,
      activeCompilations: 0,
      startTime: null,
      lastCompilationTime: null
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize and start the real-time compiler
   */
  async start() {
    if (this.status !== CompilationStatus.IDLE && this.status !== CompilationStatus.STOPPED) {
      this.errorLogger.logWarning('RealtimeCompiler is already running or initializing');
      return;
    }

    try {
      this.setStatus(CompilationStatus.INITIALIZING);
      this.stats.startTime = new Date();
      
      this.errorLogger.logInfo('Starting RealtimeCompiler...');
      
      // Initialize compilation engine
      await this.compilationEngine.initialize();
      
      // Start file watcher
      await this.fileWatcher.start();
      
      this.setStatus(CompilationStatus.WATCHING);
      this.errorLogger.logInfo('RealtimeCompiler started successfully');
      
      this.emit('started');
      
    } catch (error) {
      this.setStatus(CompilationStatus.ERROR);
      const structuredError = this.errorLogger.logIntegrationError('RealtimeCompiler', error, {
        operation: 'start'
      });
      this.emit('error', structuredError);
      throw structuredError;
    }
  }

  /**
   * Stop the real-time compiler
   */
  async stop() {
    if (this.status === CompilationStatus.STOPPED) {
      return;
    }

    try {
      this.errorLogger.logInfo('Stopping RealtimeCompiler...');
      
      // Cancel all pending debounced operations
      this.debounceManager.cancelAll();
      
      // Wait for active compilations to complete (with timeout)
      await this.waitForActiveCompilations(5000);
      
      // Stop file watcher
      await this.fileWatcher.stop();
      
      // Clean up compilation engine
      this.compilationEngine.destroy();
      
      this.setStatus(CompilationStatus.STOPPED);
      this.errorLogger.logInfo('RealtimeCompiler stopped');
      
      this.emit('stopped');
      
    } catch (error) {
      const structuredError = this.errorLogger.logIntegrationError('RealtimeCompiler', error, {
        operation: 'stop'
      });
      this.emit('error', structuredError);
      throw structuredError;
    }
  }

  /**
   * Manually compile a specific file
   */
  async compileFile(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a non-empty string');
    }

    try {
      const outputPath = this.fileManager.getOutputPath(filePath);
      
      // Add to queue and process immediately
      this.addToQueue(filePath, 'manual');
      await this.processFile(filePath);
      
      return { success: true, inputPath: filePath, outputPath };
      
    } catch (error) {
      const structuredError = this.errorLogger.logCompilationError(filePath, error, {
        operation: 'manual_compile'
      });
      throw structuredError;
    }
  }

  /**
   * Compile all MD files in watched directories
   */
  async compileAll() {
    try {
      this.errorLogger.logInfo('Starting batch compilation of all MD files...');
      
      const mdFiles = await this.findAllMdFiles();
      const results = [];
      
      for (const filePath of mdFiles) {
        try {
          const result = await this.compileFile(filePath);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            inputPath: filePath,
            error: error.message
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      this.errorLogger.logInfo(`Batch compilation completed: ${successful} successful, ${failed} failed`);
      
      return {
        total: results.length,
        successful,
        failed,
        results
      };
      
    } catch (error) {
      const structuredError = this.errorLogger.logIntegrationError('RealtimeCompiler', error, {
        operation: 'compile_all'
      });
      throw structuredError;
    }
  }

  /**
   * Set up event handlers for all components
   */
  setupEventHandlers() {
    // File watcher events
    this.fileWatcher.on('fileAdded', (event) => {
      this.handleFileEvent(event.path, 'add');
    });

    this.fileWatcher.on('fileChanged', (event) => {
      this.handleFileEvent(event.path, 'change');
    });

    this.fileWatcher.on('fileDeleted', (event) => {
      this.handleFileEvent(event.path, 'delete');
    });

    this.fileWatcher.on('error', (error) => {
      this.errorLogger.logWatcherError(error);
    });

    // Error logger events
    this.errorLogger.on('criticalError', (error) => {
      this.emit('criticalError', error);
    });
  }

  /**
   * Handle file system events from the watcher
   */
  handleFileEvent(filePath, eventType) {
    try {
      switch (eventType) {
        case 'add':
        case 'change':
          this.scheduleCompilation(filePath);
          break;
        case 'delete':
          this.handleFileDelete(filePath);
          break;
      }
    } catch (error) {
      this.errorLogger.logIntegrationError('RealtimeCompiler', error, {
        operation: 'handle_file_event',
        filePath,
        eventType
      });
    }
  }

  /**
   * Schedule a file for compilation with debouncing
   */
  scheduleCompilation(filePath) {
    this.addToQueue(filePath, 'auto');
    
    this.debounceManager.debounce(filePath, async () => {
      await this.processFile(filePath);
    });
  }

  /**
   * Handle file deletion
   */
  async handleFileDelete(filePath) {
    try {
      // Remove from queue if pending
      this.compilationQueue.delete(filePath);
      
      // Cancel any pending debounced compilation
      this.debounceManager.cancel(filePath);
      
      // Delete corresponding MDX file
      const deleted = await this.fileManager.deleteCorrespondingMdx(filePath);
      
      if (deleted) {
        this.errorLogger.logInfo(`Deleted corresponding MDX file for: ${filePath}`);
        this.emit('fileDeleted', { inputPath: filePath });
      }
      
    } catch (error) {
      this.errorLogger.logFileSystemError('delete', filePath, error);
    }
  }

  /**
   * Add a file to the compilation queue
   */
  addToQueue(filePath, trigger) {
    const queueItem = {
      filePath,
      trigger, // 'auto', 'manual'
      status: FileStatus.PENDING,
      queuedAt: new Date(),
      attempts: 0
    };
    
    this.compilationQueue.set(filePath, queueItem);
    this.updateQueueStats();
    
    this.emit('fileQueued', queueItem);
  }

  /**
   * Process a file from the queue
   */
  async processFile(filePath) {
    const queueItem = this.compilationQueue.get(filePath);
    if (!queueItem) {
      return;
    }

    // Check concurrent compilation limit
    if (this.activeCompilations.size >= this.options.maxConcurrentCompilations) {
      this.errorLogger.logWarning(`Compilation queue full, delaying: ${filePath}`);
      // Re-schedule with a delay
      setTimeout(() => this.processFile(filePath), 1000);
      return;
    }

    const startTime = Date.now();
    
    try {
      // Mark as active
      this.activeCompilations.add(filePath);
      queueItem.status = FileStatus.COMPILING;
      queueItem.startedAt = new Date();
      queueItem.attempts++;
      
      this.setStatus(CompilationStatus.COMPILING);
      this.updateQueueStats();
      
      this.emit('compilationStarted', { filePath, queueItem });
      
      // Get output path
      const outputPath = this.fileManager.getOutputPath(filePath);
      
      // Compile the file
      const result = await this.compilationEngine.compileFile(filePath, outputPath);
      
      const compilationTime = Date.now() - startTime;
      
      if (result.success) {
        // Success
        queueItem.status = FileStatus.COMPLETED;
        queueItem.completedAt = new Date();
        queueItem.compilationTime = compilationTime;
        
        this.stats.successfulCompilations++;
        this.stats.totalFilesProcessed++;
        this.updateAverageCompilationTime(compilationTime);
        
        this.errorLogger.logInfo(`Compiled successfully: ${filePath} -> ${outputPath} (${compilationTime}ms)`);
        
        this.emit('compilationCompleted', {
          filePath,
          outputPath,
          compilationTime,
          queueItem
        });
        
        // Trigger hot reload if enabled
        if (this.options.enableHotReload) {
          this.emit('hotReload', { filePath, outputPath });
        }
        
      } else {
        // Compilation failed
        throw result.error || new Error('Compilation failed');
      }
      
    } catch (error) {
      // Handle compilation error
      const compilationTime = Date.now() - startTime;
      
      queueItem.status = FileStatus.ERROR;
      queueItem.error = error;
      queueItem.compilationTime = compilationTime;
      
      this.stats.failedCompilations++;
      this.stats.totalFilesProcessed++;
      
      this.errorLogger.logCompilationError(filePath, error, {
        attempts: queueItem.attempts,
        compilationTime
      });
      
      this.emit('compilationFailed', {
        filePath,
        error,
        compilationTime,
        queueItem
      });
      
    } finally {
      // Clean up
      this.activeCompilations.delete(filePath);
      this.compilationQueue.delete(filePath);
      
      // Add to history
      this.compilationHistory.push({
        ...queueItem,
        processedAt: new Date()
      });
      
      // Maintain history size
      if (this.compilationHistory.length > 100) {
        this.compilationHistory.shift();
      }
      
      this.updateQueueStats();
      
      // Update status
      if (this.activeCompilations.size === 0 && this.compilationQueue.size === 0) {
        this.setStatus(CompilationStatus.WATCHING);
      }
      
      this.stats.lastCompilationTime = new Date();
    }
  }

  /**
   * Find all MD files in watched directories
   */
  async findAllMdFiles() {
    const allFiles = [];
    
    for (const watchPath of this.options.watchPaths) {
      try {
        const files = await this.scanDirectoryForMdFiles(watchPath);
        allFiles.push(...files);
      } catch (error) {
        this.errorLogger.logFileSystemError('scan', watchPath, error);
      }
    }
    
    return allFiles;
  }

  /**
   * Recursively scan directory for MD files
   */
  async scanDirectoryForMdFiles(directory) {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    const files = [];
    
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectoryForMdFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && path.extname(entry.name) === '.md') {
          files.push(fullPath);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    return files;
  }

  /**
   * Wait for active compilations to complete
   */
  async waitForActiveCompilations(timeoutMs = 10000) {
    const startTime = Date.now();
    
    while (this.activeCompilations.size > 0) {
      if (Date.now() - startTime > timeoutMs) {
        this.errorLogger.logWarning(`Timeout waiting for ${this.activeCompilations.size} active compilations`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Set the compiler status
   */
  setStatus(newStatus) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    if (oldStatus !== newStatus) {
      this.emit('statusChanged', { oldStatus, newStatus });
    }
  }

  /**
   * Update queue statistics
   */
  updateQueueStats() {
    this.stats.queuedFiles = this.compilationQueue.size;
    this.stats.activeCompilations = this.activeCompilations.size;
  }

  /**
   * Update average compilation time
   */
  updateAverageCompilationTime(newTime) {
    const total = this.stats.successfulCompilations;
    this.stats.averageCompilationTime = 
      (this.stats.averageCompilationTime * (total - 1) + newTime) / total;
  }

  /**
   * Get current status and statistics
   */
  getStatus() {
    return {
      status: this.status,
      stats: {
        ...this.stats,
        uptime: this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0,
        successRate: this.stats.totalFilesProcessed > 0 
          ? ((this.stats.successfulCompilations / this.stats.totalFilesProcessed) * 100).toFixed(2) + '%'
          : '0%'
      },
      queue: {
        pending: Array.from(this.compilationQueue.values()),
        active: Array.from(this.activeCompilations)
      },
      watchedPaths: this.options.watchPaths,
      isActive: this.status === CompilationStatus.WATCHING || this.status === CompilationStatus.COMPILING
    };
  }

  /**
   * Get compilation history
   */
  getHistory(limit = 20) {
    return this.compilationHistory.slice(-limit);
  }

  /**
   * Get error statistics from ErrorLogger
   */
  getErrorStats() {
    return this.errorLogger.getStatistics();
  }

  /**
   * Clean up orphaned MDX files
   */
  async cleanupOrphanedFiles() {
    try {
      this.errorLogger.logInfo('Starting cleanup of orphaned MDX files...');
      
      const cleanedFiles = [];
      
      for (const watchPath of this.options.watchPaths) {
        const cleaned = await this.fileManager.cleanupOrphanedFiles(watchPath);
        cleanedFiles.push(...cleaned);
      }
      
      this.errorLogger.logInfo(`Cleanup completed: ${cleanedFiles.length} orphaned files removed`);
      
      this.emit('cleanupCompleted', { cleanedFiles });
      
      return cleanedFiles;
      
    } catch (error) {
      const structuredError = this.errorLogger.logIntegrationError('RealtimeCompiler', error, {
        operation: 'cleanup_orphaned_files'
      });
      throw structuredError;
    }
  }

  /**
   * Flush all pending compilations immediately
   */
  flushPendingCompilations() {
    const flushedCount = this.debounceManager.flushAll();
    this.errorLogger.logInfo(`Flushed ${flushedCount} pending compilations`);
    return flushedCount;
  }

  /**
   * Get component health status
   */
  getHealthStatus() {
    return {
      fileWatcher: {
        isActive: this.fileWatcher.isActive(),
        watchedPaths: this.fileWatcher.getWatchedPaths(),
        stats: this.fileWatcher.getStats()
      },
      debounceManager: {
        pendingCount: this.debounceManager.getPendingCount(),
        pendingKeys: this.debounceManager.getPendingKeys()
      },
      compilationEngine: {
        stats: this.compilationEngine.getStats(),
        config: this.compilationEngine.getConfig()
      },
      errorLogger: {
        stats: this.errorLogger.getStatistics(),
        recentErrors: this.errorLogger.getRecentErrors(5)
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      await this.stop();
      await this.errorLogger.shutdown();
      this.removeAllListeners();
      this.errorLogger.logInfo('RealtimeCompiler shutdown completed');
    } catch (error) {
      // Error during shutdown
    }
  }
}

export default RealtimeCompiler;