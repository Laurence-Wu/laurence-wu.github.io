/**
 * Configuration management for MD to MDX compilation
 */

const { logger } = require('./logger');
const { ConfigurationError } = require('./errors');

/**
 * Default configuration
 */
const defaultConfig = {
  // Input/Output paths
  contentDir: 'src/content',
  outputDir: 'src/content',
  
  // File patterns
  include: ['**/*.md'],
  exclude: ['**/node_modules/**', '**/.git/**', '**/.astro/**'],
  
  // Processing options
  processors: {
    standard: {
      enabled: true,
      priority: 0,
      preserveAllElements: true,
      validateSyntax: true
    },
    mermaid: {
      enabled: true,
      priority: 10,
      componentPath: '../../components/Mermaid.astro',
      componentName: 'Mermaid',
      validateSyntax: true,
      preserveCodeBlock: false
    },
    math: {
      enabled: true,
      priority: 20,
      inlineDelimiters: ['$', '$'],
      displayDelimiters: ['$$', '$$'],
      validateLatex: true,
      preserveEscapes: true
    },
    tables: {
      enabled: true,
      priority: 30,
      addResponsiveClasses: true,
      enhancedStyling: true
    },
    image: {
      enabled: true,
      priority: 15,
      imageFolderPattern: '{filename}',
      supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'],
      validateImageExists: true,
      warnMissingImages: true
    }
  },
  
  // Development options
  watch: true,
  hotReload: true,
  
  // Build options
  cleanOutput: false,
  preserveTimestamps: true,
  
  // Error handling
  continueOnError: true,
  logErrors: true,
  
  // Performance options
  parallel: true,
  maxConcurrency: 4,
  enableCaching: true
};

/**
 * Configuration manager
 */
class ConfigManager {
  constructor(userConfig = {}) {
    this.config = this.mergeConfig(defaultConfig, userConfig);
    this.validateConfig();
  }

  /**
   * Deep merge configuration objects
   */
  mergeConfig(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };
    
    for (const [key, value] of Object.entries(userConfig)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key] = this.mergeConfig(merged[key] || {}, value);
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];
    
    // Validate required paths
    if (!this.config.contentDir || typeof this.config.contentDir !== 'string') {
      errors.push('contentDir must be a valid string path');
    }
    
    if (!this.config.outputDir || typeof this.config.outputDir !== 'string') {
      errors.push('outputDir must be a valid string path');
    }
    
    // Validate file patterns
    if (!Array.isArray(this.config.include)) {
      errors.push('include must be an array of glob patterns');
    }
    
    if (!Array.isArray(this.config.exclude)) {
      errors.push('exclude must be an array of glob patterns');
    }
    
    // Validate processors
    if (!this.config.processors || typeof this.config.processors !== 'object') {
      errors.push('processors must be an object');
    } else {
      this.validateProcessors(errors);
    }
    
    if (errors.length > 0) {
      throw new ConfigurationError({
        message: `Configuration validation failed:\n${errors.join('\n')}`
      });
    }
  }

  /**
   * Validate processor configurations
   */
  validateProcessors(errors) {
    for (const [name, config] of Object.entries(this.config.processors)) {
      if (!config || typeof config !== 'object') {
        errors.push(`Processor '${name}' must be an object`);
        continue;
      }
      
      if (typeof config.enabled !== 'boolean') {
        errors.push(`Processor '${name}' enabled must be a boolean`);
      }
      
      if (typeof config.priority !== 'number') {
        errors.push(`Processor '${name}' priority must be a number`);
      }
      
      // Validate specific processor configs
      if (name === 'mermaid') {
        this.validateMermaidConfig(name, config, errors);
      } else if (name === 'math') {
        this.validateMathConfig(name, config, errors);
      }
    }
  }

  /**
   * Validate mermaid processor configuration
   */
  validateMermaidConfig(name, config, errors) {
    if (!config.componentPath || typeof config.componentPath !== 'string') {
      errors.push(`Processor '${name}' componentPath must be a valid string`);
    }
    
    if (!config.componentName || typeof config.componentName !== 'string') {
      errors.push(`Processor '${name}' componentName must be a valid string`);
    }
  }

  /**
   * Validate math processor configuration
   */
  validateMathConfig(name, config, errors) {
    if (!Array.isArray(config.inlineDelimiters) || config.inlineDelimiters.length !== 2) {
      errors.push(`Processor '${name}' inlineDelimiters must be an array of 2 strings`);
    }
    
    if (!Array.isArray(config.displayDelimiters) || config.displayDelimiters.length !== 2) {
      errors.push(`Processor '${name}' displayDelimiters must be an array of 2 strings`);
    }
  }

  /**
   * Get configuration value
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Set configuration value
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    this.validateConfig();
  }

  /**
   * Get enabled processors sorted by priority
   */
  getEnabledProcessors() {
    return Object.entries(this.config.processors)
      .filter(([, config]) => config.enabled)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, ...config }));
  }

  /**
   * Get processor configuration
   */
  getProcessorConfig(name) {
    return this.config.processors[name] || null;
  }

  /**
   * Check if processor is enabled
   */
  isProcessorEnabled(name) {
    const config = this.getProcessorConfig(name);
    return config && config.enabled === true;
  }

  /**
   * Get full configuration object
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Log configuration summary
   */
  logSummary() {
    const enabledProcessors = this.getEnabledProcessors();
    
    logger.info('Configuration loaded', {
      contentDir: this.config.contentDir,
      outputDir: this.config.outputDir,
      enabledProcessors: enabledProcessors.map(p => p.name),
      watch: this.config.watch,
      hotReload: this.config.hotReload
    });
  }
}

/**
 * Load configuration from various sources
 */
async function loadConfig(userConfig = {}) {
  try {
    // Try to load from astro.config.mjs or other config files
    // For now, just use the provided userConfig
    const configManager = new ConfigManager(userConfig);
    configManager.logSummary();
    return configManager;
  } catch (error) {
    logger.error('Failed to load configuration', { error: error.message });
    throw error;
  }
}

/**
 * Validate configuration object
 */
function validateConfig(config) {
  const configManager = new ConfigManager(config);
  return configManager.getConfig();
}

module.exports = {
  defaultConfig,
  ConfigManager,
  loadConfig,
  validateConfig
};