/**
 * MD Scanner - Discovers and monitors .md files in content directory
 */

const { promises: fs } = require('fs');
const path = require('path');
const { glob } = require('glob');
const chokidar = require('chokidar');
const crypto = require('crypto');
const { logger, perfLogger } = require('./logger');
const { FileSystemError } = require('./errors');
const { performanceMonitor, contentHashCache, measureTime } = require('./performance');

/**
 * MD Scanner class for file discovery and monitoring
 */
class MDScanner {
  constructor(contentDir, options = {}) {
    this.contentDir = path.resolve(contentDir);
    this.options = {
      include: ['**/*.md'],
      exclude: ['**/node_modules/**', '**/.git/**', '**/.astro/**'],
      watchOptions: {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: false
      },
      ...options
    };
    
    this.fileCache = new Map();
    this.watcher = null;
    this.watchCallbacks = new Set();
    
    this.logger = logger.child({ component: 'MDScanner' });
  }

  /**
   * Scan for all .md files in the content directory
   */
  async scanFiles() {
    const { result } = await measureTime('scanFiles', async () => {
      try {
        this.logger.debug('Starting file scan', { contentDir: this.contentDir });
        
        // Check if content directory exists
        await this.ensureDirectoryExists(this.contentDir);
        
        // Build glob patterns
        const patterns = this.options.include.map(pattern => 
          path.join(this.contentDir, pattern)
        );
        
        // Find all matching files
        const files = await glob(patterns, {
          ignore: this.options.exclude.map(pattern => 
            path.join(this.contentDir, pattern)
          ),
          absolute: true,
          nodir: true
        });
        
        this.logger.info(`Found ${files.length} .md files`);
        
        // Process files with incremental checking
        const fileList = await this.processFilesIncremental(files);
        
        // Update cache
        this.fileCache.clear();
        fileList.forEach(fileData => {
          this.fileCache.set(fileData.filePath, fileData);
        });
        
        return fileList;
      } catch (error) {
        throw new FileSystemError({
          message: `Failed to scan files in ${this.contentDir}`,
          originalError: error,
          context: { contentDir: this.contentDir }
        });
      }
    }, { contentDir: this.contentDir });
    
    return result;
  }

  /**
   * Process files with incremental checking
   */
  async processFilesIncremental(files) {
    const { result } = await measureTime('processFilesIncremental', async () => {
      const fileList = [];
      const batchSize = 10; // Process files in small batches
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (filePath) => {
            try {
              // Quick stat check first
              const stats = await fs.stat(filePath);
              const cachedFile = this.fileCache.get(filePath);
              
              // Check if file needs processing based on modification time
              if (cachedFile && stats.mtime <= cachedFile.lastModified) {
                // File hasn't changed, return cached data
                return {
                  ...cachedFile,
                  processingStatus: 'cached'
                };
              }
              
              // File is new or changed, process it
              return await this.processFile(filePath);
            } catch (error) {
              this.logger.warn(`Failed to process file: ${filePath}`, { error: error.message });
              return null;
            }
          })
        );
        
        fileList.push(...batchResults.filter(Boolean));
        
        // Trigger garbage collection periodically
        if (i % 50 === 0) {
          performanceMonitor.takeMemorySnapshot(`batch-${Math.floor(i / batchSize)}`);
        }
      }
      
      return fileList;
    }, { fileCount: files.length });
    
    return result;
  }

  /**
   * Process individual file to extract metadata
   */
  async processFile(filePath) {
    const { result } = await measureTime(`processFile:${path.basename(filePath)}`, async () => {
      try {
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Generate content hash for incremental processing
        const contentHash = contentHashCache.generateHash(content, { 
          lastModified: stats.mtime,
          size: stats.size 
        });
        
        // Check if content has actually changed
        const hasChanged = contentHashCache.hasChanged(filePath, content, { 
          lastModified: stats.mtime 
        });
        
        // Parse frontmatter
        const { frontmatter, content: bodyContent } = this.parseFrontmatter(content);
        
        // Generate output path
        const relativePath = path.relative(this.contentDir, filePath);
        const outputPath = path.join(
          this.contentDir,
          relativePath.replace(/\.md$/, '.mdx')
        );
        
        return {
          filePath,
          outputPath,
          relativePath,
          lastModified: stats.mtime,
          size: stats.size,
          contentHash,
          frontmatter,
          content: bodyContent,
          processingStatus: hasChanged ? 'pending' : 'up-to-date',
          hasChanged
        };
      } catch (error) {
        throw new FileSystemError({
          message: `Failed to process file ${filePath}`,
          file: filePath,
          originalError: error
        });
      }
    }, { filePath });
    
    return result;
  }

  /**
   * Parse frontmatter from markdown content
   */
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return {
        frontmatter: {},
        content: content
      };
    }
    
    try {
      // Simple YAML parsing - in production, use a proper YAML parser
      const frontmatterText = match[1];
      const frontmatter = {};
      
      frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Handle arrays (simple implementation)
          if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
          }
          
          frontmatter[key] = value;
        }
      });
      
      return {
        frontmatter,
        content: match[2]
      };
    } catch (error) {
      this.logger.warn('Failed to parse frontmatter, using empty object', { error: error.message });
      return {
        frontmatter: {},
        content: match[2] || content
      };
    }
  }

  /**
   * Generate content hash for change detection
   */
  generateContentHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new FileSystemError({
          message: `Content directory does not exist: ${dirPath}`,
          context: { directory: dirPath }
        });
      }
      throw error;
    }
  }

  /**
   * Start watching files for changes
   */
  watchFiles(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.watchCallbacks.add(callback);
    
    if (!this.watcher) {
      this.startWatcher();
    }
    
    return () => {
      this.watchCallbacks.delete(callback);
      if (this.watchCallbacks.size === 0) {
        this.stopWatcher();
      }
    };
  }

  /**
   * Start file watcher
   */
  startWatcher() {
    const watchPatterns = this.options.include.map(pattern => 
      path.join(this.contentDir, pattern)
    );
    
    this.watcher = chokidar.watch(watchPatterns, {
      ...this.options.watchOptions,
      ignored: [
        ...this.options.exclude.map(pattern => 
          path.join(this.contentDir, pattern)
        ),
        this.options.watchOptions.ignored
      ].filter(Boolean)
    });
    
    this.watcher
      .on('add', (filePath) => this.handleFileEvent('add', filePath))
      .on('change', (filePath) => this.handleFileEvent('change', filePath))
      .on('unlink', (filePath) => this.handleFileEvent('unlink', filePath))
      .on('error', (error) => {
        this.logger.error('File watcher error', { error: error.message });
      });
    
    this.logger.info('File watcher started', { 
      patterns: watchPatterns,
      contentDir: this.contentDir 
    });
  }

  /**
   * Handle file system events
   */
  async handleFileEvent(event, filePath) {
    try {
      this.logger.debug(`File ${event}`, { file: filePath });
      
      let fileData = null;
      
      if (event === 'add' || event === 'change') {
        fileData = await this.processFile(filePath);
        this.fileCache.set(filePath, fileData);
      } else if (event === 'unlink') {
        this.fileCache.delete(filePath);
      }
      
      // Notify all callbacks
      for (const callback of this.watchCallbacks) {
        try {
          await callback(event, filePath, fileData);
        } catch (error) {
          this.logger.error('Watch callback error', { 
            error: error.message,
            file: filePath,
            event 
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle file event', {
        event,
        file: filePath,
        error: error.message
      });
    }
  }

  /**
   * Stop file watcher
   */
  stopWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.logger.info('File watcher stopped');
    }
  }

  /**
   * Get list of cached files
   */
  getFileList() {
    return Array.from(this.fileCache.values());
  }

  /**
   * Get file data by path
   */
  getFile(filePath) {
    return this.fileCache.get(filePath) || null;
  }

  /**
   * Check if file has changed since last scan
   */
  async hasFileChanged(filePath) {
    const cachedFile = this.getFile(filePath);
    if (!cachedFile) {
      return true; // New file
    }
    
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime > cachedFile.lastModified;
    } catch (error) {
      return true; // File might be deleted or inaccessible
    }
  }

  /**
   * Get files that need processing
   */
  getFilesToProcess() {
    return this.getFileList().filter(file => 
      file.processingStatus === 'pending' || file.processingStatus === 'error'
    );
  }

  /**
   * Update file processing status
   */
  updateFileStatus(filePath, status, error = null) {
    const file = this.getFile(filePath);
    if (file) {
      file.processingStatus = status;
      if (error) {
        file.processingError = error;
      } else {
        delete file.processingError;
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopWatcher();
    this.fileCache.clear();
    this.watchCallbacks.clear();
  }
}

module.exports = {
  MDScanner
};
