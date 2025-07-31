/**
 * Content Transformer - Orchestrates the transformation of .md content to .mdx format
 */

const path = require('path');
const { logger, perfLogger } = require('./logger');
const { ProcessingError, ContentError, defaultErrorHandler } = require('./errors');
const { performanceMonitor, measureTime, memoryOptimizer } = require('./performance');

/**
 * Content Transformer class
 */
class ContentTransformer {
  constructor(options = {}) {
    this.processors = new Map();
    this.errorHandler = options.errorHandler || defaultErrorHandler;
    this.options = {
      continueOnError: true,
      validateOutput: true,
      preserveWhitespace: true,
      ...options
    };
    
    this.logger = logger.child({ component: 'ContentTransformer' });
  }

  /**
   * Add a processor to the transformation pipeline
   */
  addProcessor(processor) {
    if (!processor || typeof processor.process !== 'function') {
      throw new Error('Processor must have a process method');
    }
    
    const name = processor.name || processor.constructor.name;
    const priority = processor.priority || 50;
    
    this.processors.set(name, {
      processor,
      priority,
      enabled: processor.enabled !== false
    });
    
    this.logger.debug(`Added processor: ${name}`, { priority });
  }

  /**
   * Remove a processor from the pipeline
   */
  removeProcessor(processorName) {
    const removed = this.processors.delete(processorName);
    if (removed) {
      this.logger.debug(`Removed processor: ${processorName}`);
    }
    return removed;
  }

  /**
   * Get processors sorted by priority
   */
  getOrderedProcessors() {
    return Array.from(this.processors.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.processor);
  }

  /**
   * Transform markdown content to MDX format
   */
  async transform(filePath, content, metadata = {}) {
    const { result, metric } = await measureTime(`transform:${path.basename(filePath)}`, async () => {
      try {
        this.logger.debug('Starting transformation', { file: filePath });
        
        // Take memory snapshot for large files
        const isLargeFile = content.length > 1024 * 1024;
        if (isLargeFile) {
          performanceMonitor.takeMemorySnapshot(`transform-start-${path.basename(filePath)}`);
        }
        
        // Parse frontmatter and content
        const { frontmatter, content: bodyContent } = this.parseFrontmatter(content);
        
        // Create transformation context
        const context = {
          sourceFile: filePath,
          content: bodyContent,
          originalContent: content,
          frontmatter,
          metadata: {
            ...metadata,
            processingStatus: 'processing'
          },
          options: this.options,
          errors: [],
          warnings: [],
          performance: {
            startTime: performance.now(),
            processorTimes: {}
          }
        };
        
        // Apply processors in order
        const processors = this.getOrderedProcessors();
        let transformedContent = bodyContent;
        
        for (const processor of processors) {
          const processorName = processor.name || processor.constructor.name;
          const processorStartTime = performance.now();
          
          try {
            this.logger.debug(`Applying processor: ${processorName}`, {
              file: filePath
            });
            
            const result = await processor.process(transformedContent, context);
            
            if (typeof result === 'string') {
              transformedContent = result;
            } else if (result && typeof result.content === 'string') {
              transformedContent = result.content;
              // Merge any additional context updates
              if (result.warnings) {
                context.warnings.push(...result.warnings);
              }
              if (result.errors) {
                context.errors.push(...result.errors);
              }
            }
            
            // Record processor timing
            context.performance.processorTimes[processorName] = performance.now() - processorStartTime;
            
          } catch (error) {
            const processingError = this.errorHandler.processError(error, {
              file: filePath,
              processor: processorName
            });
            
            context.errors.push(processingError);
            context.performance.processorTimes[processorName] = performance.now() - processorStartTime;
            
            if (!this.options.continueOnError) {
              throw processingError;
            }
            
            this.logger.warn('Processor failed, continuing with next', {
              file: filePath,
              processor: processorName,
              error: error.message
            });
          }
        }
        
        // Validate output if enabled
        if (this.options.validateOutput) {
          this.validateMDXOutput(transformedContent, context);
        }
        
        // Generate final MDX content
        const mdxContent = this.generateMDXContent(frontmatter, transformedContent);
        
        // Update context
        context.metadata.processingStatus = context.errors.length > 0 ? 'error' : 'complete';
        context.performance.totalTime = performance.now() - context.performance.startTime;
        
        // Take final memory snapshot for large files
        if (isLargeFile) {
          performanceMonitor.takeMemorySnapshot(`transform-end-${path.basename(filePath)}`);
          memoryOptimizer.triggerGC();
        }
        
        this.logger.info('Transformation completed', {
          file: filePath,
          errors: context.errors.length,
          warnings: context.warnings.length,
          processingTime: context.performance.totalTime
        });
        
        return {
          content: mdxContent,
          frontmatter,
          context,
          success: context.errors.length === 0
        };
        
      } catch (error) {
        const processingError = this.errorHandler.processError(error, {
          file: filePath,
          processor: 'ContentTransformer'
        });
        
        this.logger.error('Transformation failed', {
          file: filePath,
          error: processingError.message
        });
        
        throw processingError;
      }
    }, { 
      filePath,
      contentLength: content.length 
    });
    
    return result;
  }

  /**
   * Parse frontmatter from content
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
      const frontmatterText = match[1];
      const frontmatter = this.parseYAMLFrontmatter(frontmatterText);
      
      return {
        frontmatter,
        content: match[2]
      };
    } catch (error) {
      this.logger.warn('Failed to parse frontmatter', { error: error.message });
      return {
        frontmatter: {},
        content: match[2] || content
      };
    }
  }

  /**
   * Simple YAML frontmatter parser
   */
  parseYAMLFrontmatter(yamlText) {
    const frontmatter = {};
    const lines = yamlText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue; // Skip empty lines and comments
      }
      
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex <= 0) {
        continue; // Skip invalid lines
      }
      
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();
      
      // Parse value
      value = this.parseYAMLValue(value);
      frontmatter[key] = value;
    }
    
    return frontmatter;
  }

  /**
   * Parse YAML value with basic type detection
   */
  parseYAMLValue(value) {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1).trim();
      if (!arrayContent) return [];
      
      return arrayContent.split(',').map(item => {
        const trimmed = item.trim();
        return this.parseYAMLValue(trimmed);
      });
    }
    
    // Handle booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Handle numbers
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Handle null/undefined
    if (value === 'null' || value === '~') return null;
    if (value === 'undefined') return undefined;
    
    // Return as string
    return value;
  }

  /**
   * Validate MDX output
   */
  validateMDXOutput(content, context) {
    const errors = [];
    
    // Check for unclosed JSX tags (basic validation)
    const jsxTagRegex = /<(\w+)(?:\s[^>]*)?(?:\s*\/>|>[\s\S]*?<\/\1>)/g;
    const openTagRegex = /<(\w+)(?:\s[^>]*)?>/g;
    const closeTagRegex = /<\/(\w+)>/g;
    
    const openTags = [];
    let match;
    
    // Find all opening tags
    while ((match = openTagRegex.exec(content)) !== null) {
      const tagName = match[1];
      // Skip self-closing tags
      if (!match[0].endsWith('/>')) {
        openTags.push({ name: tagName, position: match.index });
      }
    }
    
    // Find all closing tags and match them
    const closeTags = [];
    while ((match = closeTagRegex.exec(content)) !== null) {
      closeTags.push({ name: match[1], position: match.index });
    }
    
    // Basic tag matching (simplified)
    if (openTags.length !== closeTags.length) {
      errors.push('Mismatched JSX tags detected');
    }
    
    // Check for invalid JSX syntax patterns
    if (content.includes('<>') && !content.includes('</>')){
      errors.push('Unclosed React Fragment detected');
    }
    
    if (errors.length > 0) {
      context.warnings.push(...errors.map(error => 
        new ContentError({ message: error, file: context.sourceFile })
      ));
    }
  }

  /**
   * Generate final MDX content with frontmatter
   */
  generateMDXContent(frontmatter, content) {
    let mdxContent = '';
    
    // Add frontmatter if present
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      mdxContent += '---\n';
      
      for (const [key, value] of Object.entries(frontmatter)) {
        mdxContent += `${key}: ${this.serializeYAMLValue(value)}\n`;
      }
      
      mdxContent += '---\n\n';
    }
    
    // Add content
    mdxContent += content;
    
    return mdxContent;
  }

  /**
   * Serialize value back to YAML format
   */
  serializeYAMLValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    
    if (Array.isArray(value)) {
      const serializedItems = value.map(item => {
        const serialized = this.serializeYAMLValue(item);
        // Add quotes if the item contains special characters
        if (typeof item === 'string' && (item.includes(',') || item.includes('[') || item.includes(']'))) {
          return `"${serialized}"`;
        }
        return serialized;
      });
      return `[${serializedItems.join(', ')}]`;
    }
    
    if (typeof value === 'string') {
      // Add quotes if string contains special characters
      if (value.includes(':') || value.includes('#') || value.includes('\n') || 
          value.includes('"') || value.includes("'")) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    
    return String(value);
  }

  /**
   * Preserve standard Markdown elements
   */
  preserveStandardMarkdown(content) {
    // This method ensures that standard Markdown syntax is preserved
    // It's called by processors to maintain content integrity
    
    // Standard Markdown elements that should pass through unchanged:
    // - Headers (# ## ### etc.)
    // - Lists (ordered and unordered)
    // - Links and images
    // - Emphasis (bold, italic, strikethrough)
    // - Code blocks and inline code (non-special)
    // - Blockquotes
    // - Horizontal rules
    // - Line breaks and paragraphs
    
    return content; // For now, just return as-is
  }

  /**
   * Get transformation statistics
   */
  getStats() {
    return {
      processorsCount: this.processors.size,
      enabledProcessors: this.getOrderedProcessors().length,
      processors: Array.from(this.processors.keys())
    };
  }

  /**
   * Reset transformer state
   */
  reset() {
    // Clear any cached state if needed
    this.logger.debug('Transformer reset');
  }
}

module.exports = {
  ContentTransformer
};
