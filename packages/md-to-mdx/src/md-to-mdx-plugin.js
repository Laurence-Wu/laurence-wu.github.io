/**
 * MD to MDX Plugin - Integrates the compilation process with Astro's build system
 */

const { createCompiler } = require('./md-to-mdx-compiler');
const { logger } = require('./logger');
const { ProcessingError } = require('./errors');

/**
 * Create MD to MDX plugin for Astro
 */
function createMDToMDXPlugin(userConfig = {}) {
  let compiler = null;
  let unwatchFunction = null;
  
  return {
    name: 'md-to-mdx-compiler',
    
    /**
     * Plugin configuration hook
     */
    configResolved(config) {
      // Store config for later use
      this.isProduction = config.command === 'build';
      this.isDevelopment = config.command === 'serve';
    },

    /**
     * Build start hook
     */
    async buildStart() {
      try {
        logger.info('Starting MD to MDX compilation');
        
        // Create and initialize compiler
        compiler = createCompiler({
          watch: this.isDevelopment,
          hotReload: this.isDevelopment,
          ...userConfig
        });
        
        await compiler.initialize();
        
        // Compile all files
        const result = await compiler.compileAll();
        
        if (!result.success) {
          logger.warn('MD to MDX compilation completed with errors', result.summary);
        } else {
          logger.info('MD to MDX compilation completed successfully', result.summary);
        }
        
        // Start watching in development mode
        if (this.isDevelopment) {
          unwatchFunction = await compiler.startWatching();
          logger.info('MD to MDX file watcher started');
        }
        
      } catch (error) {
        logger.error('MD to MDX compilation failed', { error: error.message });
        throw new ProcessingError({
          message: `MD to MDX plugin failed: ${error.message}`,
          originalError: error
        });
      }
    },

    /**
     * Build end hook
     */
    async buildEnd() {
      try {
        // Stop watching
        if (unwatchFunction) {
          unwatchFunction();
          unwatchFunction = null;
          logger.info('MD to MDX file watcher stopped');
        }
        
        // Clean up compiler
        if (compiler) {
          compiler.destroy();
          compiler = null;
        }
        
        logger.info('MD to MDX plugin cleanup completed');
        
      } catch (error) {
        logger.error('MD to MDX plugin cleanup failed', { error: error.message });
      }
    },

    /**
     * Handle hot updates in development
     */
    async handleHotUpdate(ctx) {
      const { file, server } = ctx;
      
      // Check if this is a .md file
      if (!file.endsWith('.md')) {
        return;
      }
      
      try {
        logger.info(`Hot update triggered for: ${file}`);
        
        // The file watcher should handle the compilation
        // We just need to trigger a page reload
        server.ws.send({
          type: 'full-reload'
        });
        
        return [];
        
      } catch (error) {
        logger.error('Hot update handling failed', { 
          file,
          error: error.message 
        });
        return [];
      }
    }
  };
}

/**
 * Vite plugin version for non-Astro projects
 */
function createViteMDToMDXPlugin(userConfig = {}) {
  let compiler = null;
  let unwatchFunction = null;
  
  return {
    name: 'vite-md-to-mdx-compiler',
    
    /**
     * Config resolved hook
     */
    configResolved(config) {
      this.isProduction = config.command === 'build';
      this.isDevelopment = config.command === 'serve';
    },

    /**
     * Build start hook
     */
    async buildStart() {
      try {
        logger.info('Starting MD to MDX compilation (Vite)');
        
        compiler = createCompiler({
          watch: this.isDevelopment,
          hotReload: this.isDevelopment,
          ...userConfig
        });
        
        await compiler.initialize();
        const result = await compiler.compileAll();
        
        if (!result.success) {
          logger.warn('MD to MDX compilation completed with errors', result.summary);
        } else {
          logger.info('MD to MDX compilation completed successfully', result.summary);
        }
        
        if (this.isDevelopment) {
          unwatchFunction = await compiler.startWatching();
        }
        
      } catch (error) {
        logger.error('MD to MDX compilation failed', { error: error.message });
        throw error;
      }
    },

    /**
     * Build end hook
     */
    async buildEnd() {
      if (unwatchFunction) {
        unwatchFunction();
        unwatchFunction = null;
      }
      
      if (compiler) {
        compiler.destroy();
        compiler = null;
      }
    },

    /**
     * Handle hot updates
     */
    handleHotUpdate(ctx) {
      const { file, server } = ctx;
      
      if (file.endsWith('.md')) {
        logger.info(`Hot update triggered for: ${file}`);
        
        // Trigger full reload for .md files
        server.ws.send({
          type: 'full-reload'
        });
        
        return [];
      }
    }
  };
}

/**
 * Webpack plugin version
 */
class WebpackMDToMDXPlugin {
  constructor(userConfig = {}) {
    this.userConfig = userConfig;
    this.compiler = null;
    this.unwatchFunction = null;
  }

  apply(compiler) {
    const pluginName = 'WebpackMDToMDXPlugin';
    
    // Hook into the compilation process
    compiler.hooks.beforeRun.tapAsync(pluginName, async (compilation, callback) => {
      try {
        await this.startCompilation(false);
        callback();
      } catch (error) {
        callback(error);
      }
    });

    compiler.hooks.watchRun.tapAsync(pluginName, async (compilation, callback) => {
      try {
        await this.startCompilation(true);
        callback();
      } catch (error) {
        callback(error);
      }
    });

    compiler.hooks.done.tap(pluginName, () => {
      this.cleanup();
    });
  }

  async startCompilation(isWatch) {
    try {
      logger.info('Starting MD to MDX compilation (Webpack)');
      
      this.compiler = createCompiler({
        watch: isWatch,
        hotReload: isWatch,
        ...this.userConfig
      });
      
      await this.compiler.initialize();
      const result = await this.compiler.compileAll();
      
      if (!result.success) {
        logger.warn('MD to MDX compilation completed with errors', result.summary);
      } else {
        logger.info('MD to MDX compilation completed successfully', result.summary);
      }
      
      if (isWatch) {
        this.unwatchFunction = await this.compiler.startWatching();
      }
      
    } catch (error) {
      logger.error('MD to MDX compilation failed', { error: error.message });
      throw error;
    }
  }

  cleanup() {
    if (this.unwatchFunction) {
      this.unwatchFunction();
      this.unwatchFunction = null;
    }
    
    if (this.compiler) {
      this.compiler.destroy();
      this.compiler = null;
    }
  }
}

/**
 * Generic build tool integration
 */
class GenericMDToMDXIntegration {
  constructor(userConfig = {}) {
    this.userConfig = userConfig;
    this.compiler = null;
    this.unwatchFunction = null;
  }

  /**
   * Initialize the integration
   */
  async initialize() {
    this.compiler = createCompiler(this.userConfig);
    await this.compiler.initialize();
  }

  /**
   * Run compilation
   */
  async compile() {
    if (!this.compiler) {
      await this.initialize();
    }
    
    return await this.compiler.compileAll();
  }

  /**
   * Start watching for changes
   */
  async watch() {
    if (!this.compiler) {
      await this.initialize();
    }
    
    // Run initial compilation
    await this.compile();
    
    // Start watching
    this.unwatchFunction = await this.compiler.startWatching();
    
    return this.unwatchFunction;
  }

  /**
   * Stop watching and cleanup
   */
  destroy() {
    if (this.unwatchFunction) {
      this.unwatchFunction();
      this.unwatchFunction = null;
    }
    
    if (this.compiler) {
      this.compiler.destroy();
      this.compiler = null;
    }
  }
}

/**
 * Helper function to create integration for different build tools
 */
function createIntegration(buildTool, userConfig = {}) {
  switch (buildTool.toLowerCase()) {
    case 'astro':
      return createMDToMDXPlugin(userConfig);
    
    case 'vite':
      return createViteMDToMDXPlugin(userConfig);
    
    case 'webpack':
      return new WebpackMDToMDXPlugin(userConfig);
    
    case 'generic':
    default:
      return new GenericMDToMDXIntegration(userConfig);
  }
}

/**
 * Express middleware for development servers
 */
function createExpressMiddleware(userConfig = {}) {
  let integration = null;
  
  return async (req, res, next) => {
    // Initialize on first request
    if (!integration) {
      integration = new GenericMDToMDXIntegration(userConfig);
      await integration.initialize();
    }
    
    // Check if request is for a .md file that needs compilation
    if (req.path.endsWith('.md')) {
      try {
        await integration.compile();
      } catch (error) {
        logger.error('Express middleware compilation failed', { 
          path: req.path,
          error: error.message 
        });
      }
    }
    
    next();
  };
}

/**
 * Programmatic API for custom integrations
 */
class ProgrammaticAPI {
  constructor(userConfig = {}) {
    this.userConfig = userConfig;
    this.compiler = null;
  }

  /**
   * Initialize the API
   */
  async init() {
    this.compiler = createCompiler(this.userConfig);
    await this.compiler.initialize();
    return this;
  }

  /**
   * Compile all files
   */
  async compileAll() {
    if (!this.compiler) {
      throw new Error('API not initialized. Call init() first.');
    }
    
    return await this.compiler.compileAll();
  }

  /**
   * Compile specific files
   */
  async compileFiles(filePaths) {
    if (!this.compiler) {
      throw new Error('API not initialized. Call init() first.');
    }
    
    const files = [];
    for (const filePath of filePaths) {
      const fileData = this.compiler.scanner.getFile(filePath);
      if (fileData) {
        files.push(fileData);
      }
    }
    
    return await this.compiler.compileFiles(files);
  }

  /**
   * Get compiler statistics
   */
  getStats() {
    return this.compiler ? this.compiler.getStats() : null;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.compiler) {
      this.compiler.destroy();
      this.compiler = null;
    }
  }
}

/**
 * Create programmatic API instance
 */
export async function createAPI(userConfig = {}) {
  const api = new ProgrammaticAPI(userConfig);
  return await api.init();
}

module.exports = {
  WebpackMDToMDXPlugin,
  GenericMDToMDXIntegration,
  ProgrammaticAPI,
  createMDToMDXPlugin,
  createViteMDToMDXPlugin,
  createIntegration,
  createExpressMiddleware
};
