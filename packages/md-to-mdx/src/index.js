// Main entry point for the MD to MDX compiler package

// Import core components
const { MDToMDXCompiler, createCompiler, compileAll } = require('./md-to-mdx-compiler');
const { MDScanner } = require('./md-scanner');
const { ContentTransformer } = require('./content-transformer');
const { MDXGenerator } = require('./mdx-generator');
const { createMDToMDXPlugin } = require('./md-to-mdx-plugin');

// Import processors
const { StandardProcessor } = require('./processors/standard-processor');
const { MermaidProcessor } = require('./processors/mermaid-processor');
const { MathProcessor } = require('./processors/math-processor');
const { TableProcessor } = require('./processors/table-processor');
const { ImageProcessor } = require('./processors/image-processor');

// Import utilities
const { ProcessingError, ValidationError, FileSystemError } = require('./errors');
const { logger, Logger } = require('./logger');
const { loadConfig, validateConfig, defaultConfig } = require('./config');

// Export everything
module.exports = {
  // Main compiler
  MDToMDXCompiler,
  createCompiler,
  compileAll,
  
  // Core components
  MDScanner,
  ContentTransformer,
  MDXGenerator,
  
  // Plugin for build systems
  createMDToMDXPlugin,
  
  // Processors
  StandardProcessor,
  MermaidProcessor,
  MathProcessor,
  TableProcessor,
  ImageProcessor,
  
  // Utilities
  ProcessingError,
  ValidationError,
  FileSystemError,
  logger,
  Logger,
  loadConfig,
  validateConfig,
  
  // Default configurations
  defaultConfig
};

// Also provide named exports for ES modules
module.exports.default = module.exports;