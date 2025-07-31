/**
 * MD to MDX Compiler - Main orchestrator for the compilation process
 */

const { promises: fs } = require('fs');
const path = require('path');
const os = require('os');
const { MDScanner } = require('./md-scanner');
const { ContentTransformer } = require('./content-transformer');
const { StandardProcessor } = require('./processors/standard-processor');
const { MermaidProcessor } = require('./processors/mermaid-processor');
const { ImageProcessor } = require('./processors/image-processor');
const { MathProcessor } = require('./processors/math-processor');
const { TableProcessor } = require('./processors/table-processor');
const { loadConfig } = require('./config');
const { logger } = require('./logger');
const { ProcessingError, FileSystemError } = require('./errors');
const { HotReloadManager } = require('./hot-reload');
const { performanceMonitor, contentHashCache, memoryOptimizer, ParallelProcessor, measureTime } = require('./performance');

/**
 * MD to MDX Compiler class
 */
class MDToMDXCompiler {
  constructor(userConfig = {}) {
    this.config = null;
    this.scanner = null;
    this.transformer = null;
    this.hotReloadManager = null;
    this.parallelProcessor = null;
    this.isInitialized = false;
    this.userConfig = userConfig;
    
    this.logger = logger.child({ component: 'MDToMDXCompiler' });
  }

  /**
   * Initialize the compiler
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing MD to MDX compiler');
      
      // Load configuration
      this.config = await loadConfig(this.userConfig);
      
      // Initialize scanner
      this.scanner = new MDScanner(this.config.get('contentDir'), {
        include: this.config.get('include'),
        exclude: this.config.get('exclude')
      });
      
      // Initialize transformer
      this.transformer = new ContentTransformer({
        continueOnError: this.config.get('continueOnError'),
        validateOutput: true
      });
      
      // Add processors
      this.setupProcessors();
      
      // Initialize parallel processor
      this.parallelProcessor = new ParallelProcessor({
        maxConcurrency: this.config.get('maxConcurrency', 4),
        maxWorkers: this.config.get('maxWorkers', Math.max(1, Math.floor(os.cpus().length / 2)))
      });
      
      // Initialize hot reload if enabled
      if (this.config.get('hotReload')) {
        this.hotReloadManager = new HotReloadManager({
          debounceDelay: 300,
          reloadDelay: 100
        });
      }
      
      // Enable performance monitoring
      performanceMonitor.setEnabled(this.config.get('performanceMonitoring', true));
      
      this.isInitialized = true;
      this.logger.info('Compiler initialized successfully');
      
    } catch (error) {
      throw new ProcessingError({
        message: `Failed to initialize compiler: ${error.message}`,
        originalError: error
      });
    }
  }

  /**
   * Setup processors based on configuration
   */
  setupProcessors() {
    const enabledProcessors = this.config.getEnabledProcessors();
    
    for (const processorConfig of enabledProcessors) {
      let processor;
      
      switch (processorConfig.name) {
        case 'standard':
          processor = new StandardProcessor(processorConfig);
          break;
        case 'mermaid':
          processor = new MermaidProcessor(processorConfig);
          break;
        case 'image':
          processor = new ImageProcessor(processorConfig);
          break;
        case 'math':
          processor = new MathProcessor(processorConfig);
          break;
        case 'tables':
          processor = new TableProcessor(processorConfig);
          break;
        default:
          this.logger.warn(`Unknown processor: ${processorConfig.name}`);
          continue;
      }
      
      this.transformer.addProcessor(processor);
      this.logger.debug(`Added processor: ${processorConfig.name}`, {
        priority: processor.priority,
        enabled: processor.enabled
      });
    }
  }

  /**
   * Compile all .md files to .mdx
   */
  async compileAll() {
    await this.initialize();
    
    const { result, metric } = await measureTime('compileAll', async () => {
      try {
        this.logger.info('Starting compilation of all .md files');
        
        // Take initial memory snapshot
        performanceMonitor.takeMemorySnapshot('compile-start');
        
        // Scan for .md files
        const files = await this.scanner.scanFiles();
        
        if (files.length === 0) {
          this.logger.info('No .md files found to compile');
          return { success: true, files: [], errors: [], performance: {} };
        }
        
        // Filter files that need processing (incremental processing)
        const filesToProcess = files.filter(file => 
          file.processingStatus === 'pending' || 
          file.processingStatus === 'error' ||
          file.hasChanged !== false
        );
        
        const skippedFiles = files.length - filesToProcess.length;
        
        this.logger.info(`Found ${files.length} .md files, processing ${filesToProcess.length} (${skippedFiles} up-to-date)`);
        
        // Compile files with parallel processing
        const results = await this.compileFilesParallel(filesToProcess);
        
        // Add skipped files to results
        const skippedResults = files
          .filter(file => !filesToProcess.includes(file))
          .map(file => ({
            file: file.filePath,
            outputFile: file.outputPath,
            status: 'skipped',
            reason: 'up-to-date'
          }));
        
        const allResults = [...results, ...skippedResults];
        
        // Generate summary
        const summary = this.generateSummary(allResults);
        
        // Take final memory snapshot
        performanceMonitor.takeMemorySnapshot('compile-end');
        
        // Generate performance report
        const performanceReport = performanceMonitor.generateReport();
        
        this.logger.info('Compilation completed', summary);
        
        return {
          success: summary.errors === 0,
          files: allResults,
          summary,
          performance: performanceReport
        };
        
      } catch (error) {
        throw new ProcessingError({
          message: `Compilation failed: ${error.message}`,
          originalError: error
        });
      }
    }, { 
      operation: 'compileAll',
      compiler: 'MDToMDXCompiler' 
    });
    
    return result;
  }

  /**
   * Compile files using parallel processing
   */
  async compileFilesParallel(files) {
    const { result } = await measureTime('compileFilesParallel', async () => {
      const batchSize = this.config.get('batchSize', 10);
      const batchDelay = this.config.get('batchDelay', 0);
      
      const results = await this.parallelProcessor.processFiles(
        files,
        (file) => this.compileFile(file),
        { 
          batchSize,
          batchDelay 
        }
      );
      
      // Convert Promise.allSettled results to our format
      return results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            file: 'unknown',
            status: 'error',
            error: result.reason?.message || 'Unknown error',
            errors: [result.reason]
          };
        }
      });
    }, { fileCount: files.length });
    
    return result;
  }

  /**
   * Compile specific files (legacy method for backward compatibility)
   */
  async compileFiles(files) {
    return this.compileFilesParallel(files);
  }

  /**
   * Compile a single file
   */
  async compileFile(fileData) {
    const { result, metric } = await measureTime(`compileFile:${fileData.relativePath}`, async () => {
      try {
        this.logger.debug('Compiling file', { file: fileData.filePath });
        
        // Check if output file already exists and is newer
        if (await this.shouldSkipFile(fileData)) {
          this.logger.debug('Skipping file (up to date)', { file: fileData.filePath });
          return {
            file: fileData.filePath,
            outputFile: fileData.outputPath,
            status: 'skipped',
            reason: 'up-to-date'
          };
        }
        
        // Use memory optimizer for large files
        const isLargeFile = fileData.content.length > 1024 * 1024; // 1MB
        let transformResult;
        
        if (isLargeFile) {
          this.logger.debug('Processing large file with memory optimization', { 
            file: fileData.filePath,
            size: fileData.content.length 
          });
          
          transformResult = await memoryOptimizer.processLargeContent(
            fileData.content,
            512 * 1024, // 512KB chunks
            async (content) => {
              return await this.transformer.transform(
                fileData.filePath,
                content,
                { ...fileData, content }
              );
            }
          );
        } else {
          // Transform content normally
          transformResult = await this.transformer.transform(
            fileData.filePath,
            fileData.content,
            fileData
          );
        }
        
        // Write output file
        await this.writeOutputFile(fileData.outputPath, transformResult.content);
        
        // Update file status
        this.scanner.updateFileStatus(
          fileData.filePath, 
          transformResult.success ? 'complete' : 'error'
        );
        
        // Trigger garbage collection for large files
        if (isLargeFile) {
          memoryOptimizer.triggerGC();
        }
        
        return {
          file: fileData.filePath,
          outputFile: fileData.outputPath,
          status: transformResult.success ? 'success' : 'error',
          errors: transformResult.context?.errors || [],
          warnings: transformResult.context?.warnings || [],
          stats: {
            originalSize: fileData.content.length,
            outputSize: transformResult.content?.length || 0,
            processingTime: metric?.duration,
            memoryUsed: metric?.memoryDelta?.heapUsed
          }
        };
        
      } catch (error) {
        this.scanner.updateFileStatus(fileData.filePath, 'error', error);
        
        return {
          file: fileData.filePath,
          outputFile: fileData.outputPath,
          status: 'error',
          error: error.message,
          errors: [error]
        };
      }
    }, { 
      filePath: fileData.filePath,
      fileSize: fileData.content.length 
    });
    
    return result;
  }

  /**
   * Check if file should be skipped (already up to date)
   */
  async shouldSkipFile(fileData) {
    try {
      const outputStats = await fs.stat(fileData.outputPath);
      return outputStats.mtime >= fileData.lastModified;
    } catch (error) {
      // Output file doesn't exist or is inaccessible
      return false;
    }
  }

  /**
   * Write output file
   */
  async writeOutputFile(outputPath, content) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write file
      await fs.writeFile(outputPath, content, 'utf-8');
      
      this.logger.debug('Output file written', { file: outputPath });
      
    } catch (error) {
      throw new FileSystemError({
        message: `Failed to write output file: ${outputPath}`,
        file: outputPath,
        originalError: error
      });
    }
  }

  /**
   * Generate compilation summary
   */
  generateSummary(results) {
    const summary = {
      total: results.length,
      success: 0,
      errors: 0,
      warnings: 0,
      skipped: 0
    };
    
    for (const result of results) {
      switch (result.status) {
        case 'success':
          summary.success++;
          break;
        case 'error':
          summary.errors++;
          break;
        case 'skipped':
          summary.skipped++;
          break;
      }
      
      if (result.warnings) {
        summary.warnings += result.warnings.length;
      }
    }
    
    return summary;
  }

  /**
   * Start file watching for development
   */
  async startWatching() {
    await this.initialize();
    
    if (!this.config.get('watch')) {
      this.logger.info('File watching is disabled');
      return;
    }
    
    this.logger.info('Starting file watcher');
    
    const unwatch = this.scanner.watchFiles(async (event, filePath, fileData) => {
      try {
        this.logger.info(`File ${event}: ${filePath}`);
        
        if (event === 'unlink') {
          // Remove corresponding .mdx file
          const outputPath = filePath.replace(/\.md$/, '.mdx');
          try {
            await fs.unlink(outputPath);
            this.logger.info(`Removed output file: ${outputPath}`);
            
            // Trigger hot reload for file deletion
            if (this.hotReloadManager) {
              this.hotReloadManager.triggerReload(filePath, 'delete');
            }
          } catch (error) {
            // Ignore if file doesn't exist
          }
        } else if (fileData) {
          // Compile the changed file
          const result = await this.compileFile(fileData);
          
          if (result.status === 'success') {
            this.logger.info(`Compiled: ${filePath} -> ${result.outputFile}`);
            
            // Trigger hot reload for successful compilation
            if (this.hotReloadManager) {
              this.hotReloadManager.triggerReload(result.outputFile, event);
            }
          } else {
            this.logger.error(`Compilation failed: ${filePath}`, {
              error: result.error
            });
            
            // Still trigger reload to show error state
            if (this.hotReloadManager) {
              this.hotReloadManager.triggerReload(filePath, 'error');
            }
          }
        }
      } catch (error) {
        this.logger.error('Watch event handling failed', {
          event,
          file: filePath,
          error: error.message
        });
      }
    });
    
    return unwatch;
  }

  /**
   * Get compiler statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      config: this.config ? this.config.getConfig() : null,
      scanner: this.scanner ? {
        fileCount: this.scanner.getFileList().length
      } : null,
      transformer: this.transformer ? this.transformer.getStats() : null,
      parallelProcessor: this.parallelProcessor ? this.parallelProcessor.getStats() : null,
      performance: performanceMonitor.getAllStats(),
      memory: memoryOptimizer.getMemoryStats(),
      contentCache: contentHashCache.getStats()
    };
  }

  /**
   * Get hot reload manager for external integration
   */
  getHotReloadManager() {
    return this.hotReloadManager;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.scanner) {
      this.scanner.destroy();
    }
    
    if (this.hotReloadManager) {
      this.hotReloadManager.destroy();
    }
    
    if (this.parallelProcessor) {
      this.parallelProcessor.clear();
    }
    
    // Clear performance monitoring data
    performanceMonitor.clear();
    contentHashCache.clear();
    
    this.isInitialized = false;
    this.logger.info('Compiler destroyed');
  }
}

/**
 * Create and configure compiler instance
 */
function createCompiler(userConfig = {}) {
  return new MDToMDXCompiler(userConfig);
}

/**
 * Compile all .md files with default configuration
 */
async function compileAll(userConfig = {}) {
  const compiler = createCompiler(userConfig);
  try {
    return await compiler.compileAll();
  } finally {
    compiler.destroy();
  }
}

module.exports = {
  MDToMDXCompiler,
  createCompiler,
  compileAll
};