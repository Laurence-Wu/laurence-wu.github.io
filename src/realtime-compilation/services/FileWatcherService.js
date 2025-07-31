import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';

/**
 * FileWatcherService - Monitors MD files for changes and triggers compilation
 * 
 * This service uses chokidar to watch for file system changes in content directories
 * and emits events for file add, change, and delete operations.
 */
export class FileWatcherService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      watchPaths: options.watchPaths || ['src/content/blog', 'src/content/projects'],
      debounceMs: options.debounceMs || 300,
      ignoreInitial: options.ignoreInitial !== false,
      ...options
    };
    
    this.watcher = null;
    this.isWatching = false;
  }

  /**
   * Start the file watcher
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isWatching) {
      return;
    }

    try {
      // Create chokidar watcher with configuration
      this.watcher = chokidar.watch(this.options.watchPaths, {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.DS_Store',
          '**/.*', // Hidden files
          '**/*.mdx' // Ignore compiled MDX files
        ],
        persistent: true,
        ignoreInitial: this.options.ignoreInitial,
        followSymlinks: false,
        depth: 10,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });

      // Set up event handlers
      this.setupEventHandlers();
      
      this.isWatching = true;
      this.emit('started');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the file watcher
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isWatching || !this.watcher) {
      return;
    }

    try {
      await this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      this.emit('stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add a new path to watch
   * @param {string} watchPath - Path to add to the watcher
   */
  addPath(watchPath) {
    if (!this.watcher) {
      throw new Error('FileWatcherService is not started');
    }

    this.watcher.add(watchPath);
    this.emit('pathAdded', watchPath);
  }

  /**
   * Remove a path from watching
   * @param {string} watchPath - Path to remove from the watcher
   */
  removePath(watchPath) {
    if (!this.watcher) {
      throw new Error('FileWatcherService is not started');
    }

    this.watcher.unwatch(watchPath);
    this.emit('pathRemoved', watchPath);
  }

  /**
   * Set up event handlers for file system events
   * @private
   */
  setupEventHandlers() {
    // Handle file additions
    this.watcher.on('add', (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        this.emit('fileAdded', {
          path: filePath,
          type: 'add',
          timestamp: new Date()
        });
      }
    });

    // Handle file changes
    this.watcher.on('change', (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        this.emit('fileChanged', {
          path: filePath,
          type: 'change',
          timestamp: new Date()
        });
      }
    });

    // Handle file deletions
    this.watcher.on('unlink', (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        this.emit('fileDeleted', {
          path: filePath,
          type: 'delete',
          timestamp: new Date()
        });
      }
    });

    // Handle directory events
    this.watcher.on('addDir', (dirPath) => {
      this.emit('directoryAdded', {
        path: dirPath,
        type: 'addDir',
        timestamp: new Date()
      });
    });

    this.watcher.on('unlinkDir', (dirPath) => {
      this.emit('directoryDeleted', {
        path: dirPath,
        type: 'unlinkDir',
        timestamp: new Date()
      });
    });

    // Handle watcher errors
    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    // Handle watcher ready event
    this.watcher.on('ready', () => {
      this.emit('ready');
    });
  }

  /**
   * Check if a file is a Markdown file
   * @param {string} filePath - Path to check
   * @returns {boolean} True if the file is a Markdown file
   * @private
   */
  isMarkdownFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.md';
  }

  /**
   * Get the current watching status
   * @returns {boolean} True if currently watching
   */
  isActive() {
    return this.isWatching;
  }

  /**
   * Get the list of watched paths
   * @returns {string[]} Array of watched paths
   */
  getWatchedPaths() {
    return this.options.watchPaths;
  }

  /**
   * Get watcher statistics
   * @returns {Object} Statistics about the watcher
   */
  getStats() {
    if (!this.watcher) {
      return { 
        isWatching: false, 
        watchedPaths: this.options.watchPaths,
        watchedFiles: []
      };
    }

    return {
      isWatching: this.isWatching,
      watchedPaths: this.options.watchPaths,
      watchedFiles: this.watcher.getWatched()
    };
  }
}

export default FileWatcherService;