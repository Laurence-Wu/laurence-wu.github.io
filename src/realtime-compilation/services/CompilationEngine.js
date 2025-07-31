/**
 * CompilationEngine - Real-time MD to MDX compilation service
 * 
 * This class provides a simplified interface for real-time compilation
 * with support for frontmatter preservation, Mermaid diagrams, and Math expressions.
 */

import path from 'path';
import { promises as fs } from 'fs';

/**
 * Compilation result interface
 */
class CompilationResult {
  constructor(options = {}) {
    this.success = options.success || false;
    this.inputPath = options.inputPath || '';
    this.outputPath = options.outputPath || '';
    this.error = options.error || null;
    this.warnings = options.warnings || [];
    this.stats = options.stats || {};
  }
}

/**
 * CompilationEngine class for real-time MD to MDX compilation
 */
class CompilationEngine {
  constructor(config = {}) {
    this.config = {
      preserveFrontmatter: true,
      enableMermaidSupport: true,
      enableMathSupport: true,
      continueOnError: true,
      validateOutput: true,
      ...config
    };
    
    this.isInitialized = false;
    
    // Statistics tracking
    this.stats = {
      totalCompilations: 0,
      successfulCompilations: 0,
      failedCompilations: 0,
      averageCompilationTime: 0,
      lastCompilationTime: null
    };
  }

  /**
   * Initialize the compilation engine
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // CompilationEngine initialized
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize CompilationEngine: ${error.message}`);
    }
  }

  /**
   * Compile a single MD file to MDX format
   * 
   * @param {string} inputPath - Path to the input .md file
   * @param {string} outputPath - Path where the .mdx file should be written
   * @returns {Promise<CompilationResult>} Compilation result
   */
  async compileFile(inputPath, outputPath) {
    await this.initialize();
    
    const startTime = Date.now();
    
    try {
      // Read the input file
      const content = await fs.readFile(inputPath, 'utf-8');
      
      // Process the content
      const processedContent = await this.processContent(content, inputPath);
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write the output file
      await fs.writeFile(outputPath, processedContent, 'utf-8');
      
      // Calculate compilation time
      const compilationTime = Date.now() - startTime;
      this.updateStats(compilationTime, true);
      
      return new CompilationResult({
        success: true,
        inputPath: inputPath,
        outputPath: outputPath,
        error: null,
        warnings: [],
        stats: {
          compilationTime,
          originalSize: content.length,
          outputSize: processedContent.length
        }
      });
      
    } catch (error) {
      const compilationTime = Date.now() - startTime;
      this.updateStats(compilationTime, false);
      
      return new CompilationResult({
        success: false,
        inputPath: inputPath,
        outputPath: outputPath,
        error: error,
        warnings: [],
        stats: {
          compilationTime
        }
      });
    }
  }

  /**
   * Process markdown content to MDX
   * 
   * @private
   * @param {string} content - Raw markdown content
   * @param {string} filePath - Source file path for context
   * @returns {Promise<string>} Processed MDX content
   */
  async processContent(content, filePath) {
    let processedContent = content;
    
    // Extract and preserve frontmatter
    const { frontmatter, body } = this.extractFrontmatter(processedContent);
    processedContent = body;
    
    // Process Mermaid diagrams if enabled
    if (this.config.enableMermaidSupport) {
      processedContent = this.processMermaidDiagrams(processedContent);
    }
    
    // Process Math expressions if enabled
    if (this.config.enableMathSupport) {
      processedContent = this.processMathExpressions(processedContent);
    }
    
    // Process tables
    processedContent = this.processTables(processedContent);
    
    // Process images
    processedContent = this.processImages(processedContent, filePath);
    
    // Reassemble with frontmatter
    if (frontmatter && this.config.preserveFrontmatter) {
      processedContent = `---\n${frontmatter}\n---\n\n${processedContent}`;
    }
    
    return processedContent;
  }

  /**
   * Extract frontmatter from markdown content
   * 
   * @private
   * @param {string} content - Markdown content
   * @returns {{frontmatter: string|null, body: string}} Extracted frontmatter and body
   */
  extractFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      return {
        frontmatter: match[1],
        body: match[2]
      };
    }
    
    return {
      frontmatter: null,
      body: content
    };
  }

  /**
   * Process Mermaid diagrams
   * 
   * @private
   * @param {string} content - Content to process
   * @returns {string} Processed content
   */
  processMermaidDiagrams(content) {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    
    return content.replace(mermaidRegex, (match, diagramCode) => {
      const escapedCode = diagramCode.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `<Mermaid code={\`${escapedCode}\`} />`;
    });
  }

  /**
   * Process Math expressions
   * 
   * @private
   * @param {string} content - Content to process
   * @returns {string} Processed content
   */
  processMathExpressions(content) {
    // Process display math ($$...$$)
    content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathCode) => {
      const escapedCode = mathCode.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `\n\n<div className="math-display">\n  {String.raw\`${escapedCode}\`}\n</div>\n\n`;
    });
    
    // Process inline math ($...$)
    content = content.replace(/\$([^$\n]+)\$/g, (match, mathCode) => {
      const escapedCode = mathCode.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `<span className="math-inline">{String.raw\`${escapedCode}\`}</span>`;
    });
    
    return content;
  }

  /**
   * Process tables (basic processing)
   * 
   * @private
   * @param {string} content - Content to process
   * @returns {string} Processed content
   */
  processTables(content) {
    // Basic table processing - could be enhanced
    return content;
  }

  /**
   * Process images
   * 
   * @private
   * @param {string} content - Content to process
   * @param {string} filePath - Source file path for relative image resolution
   * @returns {string} Processed content
   */
  processImages(content, filePath) {
    // Basic image processing - could be enhanced to handle relative paths
    return content;
  }

  /**
   * Compile multiple files in batch
   * 
   * @param {Array<{inputPath: string, outputPath: string}>} files - Array of file mappings
   * @returns {Promise<Array<CompilationResult>>} Array of compilation results
   */
  async compileBatch(files) {
    await this.initialize();
    
    const results = [];
    
    for (const file of files) {
      const result = await this.compileFile(file.inputPath, file.outputPath);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Validate MDX content without writing to file
   * 
   * @param {string} content - MDX content to validate
   * @returns {Promise<{valid: boolean, errors: Array, warnings: Array}>} Validation result
   */
  async validateMdx(content) {
    await this.initialize();
    
    try {
      // Basic validation - check for unclosed JSX tags
      const errors = [];
      const warnings = [];
      
      // Check for unclosed JSX tags (basic check)
      const openTags = content.match(/<[^/>]+>/g) || [];
      const closeTags = content.match(/<\/[^>]+>/g) || [];
      
      if (openTags.length !== closeTags.length) {
        warnings.push('Potential unclosed JSX tags detected');
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [error],
        warnings: []
      };
    }
  }

  /**
   * Update compilation statistics
   * 
   * @private
   * @param {number} compilationTime - Time taken for compilation in ms
   * @param {boolean} success - Whether compilation was successful
   */
  updateStats(compilationTime, success) {
    this.stats.totalCompilations++;
    this.stats.lastCompilationTime = compilationTime;
    
    if (success) {
      this.stats.successfulCompilations++;
    } else {
      this.stats.failedCompilations++;
    }
    
    // Update rolling average
    this.stats.averageCompilationTime = 
      (this.stats.averageCompilationTime * (this.stats.totalCompilations - 1) + compilationTime) / 
      this.stats.totalCompilations;
  }

  /**
   * Get compilation statistics
   * 
   * @returns {Object} Current compilation statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalCompilations > 0 
        ? (this.stats.successfulCompilations / this.stats.totalCompilations * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset compilation statistics
   */
  resetStats() {
    this.stats = {
      totalCompilations: 0,
      successfulCompilations: 0,
      failedCompilations: 0,
      averageCompilationTime: 0,
      lastCompilationTime: null
    };
  }

  /**
   * Check if the engine supports a specific feature
   * 
   * @param {string} feature - Feature name ('mermaid', 'math', 'tables', 'images')
   * @returns {boolean} Whether the feature is supported
   */
  supportsFeature(feature) {
    switch (feature.toLowerCase()) {
      case 'mermaid':
        return this.config.enableMermaidSupport;
      case 'math':
        return this.config.enableMathSupport;
      case 'tables':
      case 'images':
        return true; // Always enabled
      default:
        return false;
    }
  }

  /**
   * Get the current configuration
   * 
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration (requires reinitialization)
   * 
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.isInitialized = false; // Force reinitialization
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.isInitialized = false;
    // CompilationEngine destroyed
  }
}

export {
  CompilationEngine,
  CompilationResult
};