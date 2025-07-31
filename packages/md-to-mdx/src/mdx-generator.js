/**
 * MDX Generator - Generates properly formatted .mdx files from transformed content
 */

const { promises: fs } = require('fs');
const path = require('path');
const { logger, perfLogger } = require('./logger');
const { FileSystemError, ProcessingError } = require('./errors');

/**
 * MDX Generator class
 */
class MDXGenerator {
  constructor(outputDir, options = {}) {
    this.outputDir = path.resolve(outputDir);
    this.options = {
      preserveTimestamps: true,
      createBackups: false,
      validateOutput: true,
      formatOutput: true,
      addGeneratedComment: false,
      ...options
    };
    
    this.logger = logger.child({ component: 'MDXGenerator' });
  }

  /**
   * Generate MDX file from transformed content
   */
  async generate(filePath, frontmatter, content, metadata = {}) {
    return perfLogger.time(`generate:${path.basename(filePath)}`, async () => {
      try {
        this.logger.debug('Generating MDX file', { 
          source: filePath,
          output: this.getOutputPath(filePath)
        });
        
        // Generate MDX content
        const mdxContent = this.generateMDXContent(frontmatter, content, metadata);
        
        // Validate output if enabled
        if (this.options.validateOutput) {
          this.validateMDXContent(mdxContent, filePath);
        }
        
        // Ensure output directory exists
        const outputPath = this.getOutputPath(filePath);
        await this.ensureOutputDirectory(outputPath);
        
        // Create backup if requested
        if (this.options.createBackups) {
          await this.createBackup(outputPath);
        }
        
        // Write the file
        await this.writeFile(outputPath, mdxContent, metadata);
        
        this.logger.info('MDX file generated', {
          source: filePath,
          output: outputPath,
          size: mdxContent.length
        });
        
        return {
          outputPath,
          content: mdxContent,
          size: mdxContent.length,
          success: true
        };
        
      } catch (error) {
        throw new ProcessingError({
          message: `Failed to generate MDX file: ${error.message}`,
          file: filePath,
          originalError: error
        });
      }
    });
  }

  /**
   * Generate complete MDX content with frontmatter
   */
  generateMDXContent(frontmatter, content, metadata = {}) {
    let mdxContent = '';
    
    // Add generated comment if requested
    if (this.options.addGeneratedComment) {
      mdxContent += `<!-- This file was automatically generated from ${metadata.sourceFile || 'markdown'} -->\n\n`;
    }
    
    // Add frontmatter if present
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      mdxContent += '---\n';
      mdxContent += this.serializeFrontmatter(frontmatter);
      mdxContent += '---\n\n';
    }
    
    // Add content
    mdxContent += content;
    
    // Format output if enabled
    if (this.options.formatOutput) {
      mdxContent = this.formatMDXContent(mdxContent);
    }
    
    return mdxContent;
  }

  /**
   * Serialize frontmatter to YAML format
   */
  serializeFrontmatter(frontmatter) {
    let yaml = '';
    
    for (const [key, value] of Object.entries(frontmatter)) {
      yaml += `${key}: ${this.serializeYAMLValue(value)}\n`;
    }
    
    return yaml;
  }

  /**
   * Serialize value to YAML format
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
        if (typeof item === 'string' && this.needsQuotes(serialized)) {
          return `"${serialized.replace(/"/g, '\\"')}"`;
        }
        return serialized;
      });
      return `[${serializedItems.join(', ')}]`;
    }
    
    if (typeof value === 'object') {
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      
      // Handle other objects (convert to JSON-like format)
      const entries = Object.entries(value).map(([k, v]) => 
        `${k}: ${this.serializeYAMLValue(v)}`
      );
      return `{${entries.join(', ')}}`;
    }
    
    if (typeof value === 'string') {
      // Add quotes if string contains special characters
      if (this.needsQuotes(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    
    return String(value);
  }

  /**
   * Check if a string value needs quotes in YAML
   */
  needsQuotes(value) {
    return value.includes(':') || 
           value.includes('#') || 
           value.includes('\n') || 
           value.includes('"') || 
           value.includes("'") ||
           value.includes('[') ||
           value.includes(']') ||
           value.includes('{') ||
           value.includes('}') ||
           value.startsWith(' ') ||
           value.endsWith(' ');
  }

  /**
   * Format MDX content for better readability
   */
  formatMDXContent(content) {
    return content
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, '')
      // Normalize multiple blank lines to maximum of 2
      .replace(/\n{3,}/g, '\n\n')
      // Ensure file ends with single newline
      .replace(/\n*$/, '\n');
  }

  /**
   * Validate MDX content
   */
  validateMDXContent(content, filePath) {
    const errors = [];
    
    // Check for basic MDX syntax issues
    
    // 1. Check for unclosed JSX tags
    const jsxErrors = this.validateJSXSyntax(content);
    errors.push(...jsxErrors);
    
    // 2. Check for invalid frontmatter
    const frontmatterErrors = this.validateFrontmatter(content);
    errors.push(...frontmatterErrors);
    
    // 3. Check for common MDX issues
    const mdxErrors = this.validateMDXSpecific(content);
    errors.push(...mdxErrors);
    
    if (errors.length > 0) {
      this.logger.warn('MDX validation issues detected', {
        file: filePath,
        errors: errors.length
      });
      
      // Log each error for debugging
      errors.forEach(error => {
        this.logger.debug('MDX validation error', { error, file: filePath });
      });
    }
  }

  /**
   * Validate JSX syntax in MDX content
   */
  validateJSXSyntax(content) {
    const errors = [];
    
    // Simple JSX tag matching (basic validation)
    const openTags = [];
    const jsxTagRegex = /<(\/?)([\w-]+)(?:\s[^>]*)?(\s*\/?)>/g;
    
    let match;
    while ((match = jsxTagRegex.exec(content)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2];
      const isSelfClosing = match[3] === '/';
      
      if (isClosing) {
        // Closing tag
        const lastOpen = openTags.pop();
        if (!lastOpen || lastOpen !== tagName) {
          errors.push(`Mismatched closing tag: </${tagName}>`);
        }
      } else if (!isSelfClosing) {
        // Opening tag (not self-closing)
        openTags.push(tagName);
      }
    }
    
    // Check for unclosed tags
    openTags.forEach(tagName => {
      errors.push(`Unclosed tag: <${tagName}>`);
    });
    
    return errors;
  }

  /**
   * Validate frontmatter syntax
   */
  validateFrontmatter(content) {
    const errors = [];
    
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (frontmatterMatch) {
      const frontmatterContent = frontmatterMatch[1];
      
      // Basic YAML validation
      const lines = frontmatterContent.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          // Should contain a colon for key-value pairs
          if (!trimmed.includes(':') && !trimmed.startsWith('-')) {
            errors.push(`Invalid frontmatter line ${index + 1}: ${trimmed}`);
          }
        }
      });
    }
    
    return errors;
  }

  /**
   * Validate MDX-specific syntax
   */
  validateMDXSpecific(content) {
    const errors = [];
    
    // Check for unescaped curly braces that might cause issues
    const braceRegex = /\{[^}]*\}/g;
    let match;
    while ((match = braceRegex.exec(content)) !== null) {
      const braceContent = match[0];
      
      // Check if it looks like invalid JSX expression
      if (braceContent.includes('\n') || braceContent.length > 200) {
        errors.push(`Potentially invalid JSX expression: ${braceContent.substring(0, 50)}...`);
      }
    }
    
    return errors;
  }

  /**
   * Get output path for a source file
   */
  getOutputPath(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    const parsedPath = path.parse(relativePath);
    
    // Change extension to .mdx
    const outputFileName = parsedPath.name + '.mdx';
    const outputPath = path.join(this.outputDir, parsedPath.dir, outputFileName);
    
    return path.resolve(outputPath);
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory(filePath) {
    const directory = path.dirname(filePath);
    
    try {
      await fs.mkdir(directory, { recursive: true });
      this.logger.debug('Output directory ensured', { directory });
    } catch (error) {
      throw new FileSystemError({
        message: `Failed to create output directory: ${directory}`,
        originalError: error
      });
    }
  }

  /**
   * Create backup of existing file
   */
  async createBackup(filePath) {
    try {
      await fs.access(filePath);
      
      // File exists, create backup
      const backupPath = filePath + '.backup';
      await fs.copyFile(filePath, backupPath);
      
      this.logger.debug('Backup created', { 
        original: filePath,
        backup: backupPath 
      });
    } catch (error) {
      // File doesn't exist, no backup needed
      if (error.code !== 'ENOENT') {
        this.logger.warn('Failed to create backup', {
          file: filePath,
          error: error.message
        });
      }
    }
  }

  /**
   * Write file with proper error handling
   */
  async writeFile(outputPath, content, metadata = {}) {
    try {
      await fs.writeFile(outputPath, content, 'utf-8');
      
      // Preserve timestamps if requested
      if (this.options.preserveTimestamps && metadata.lastModified) {
        const stats = await fs.stat(outputPath);
        await fs.utimes(outputPath, stats.atime, metadata.lastModified);
      }
      
      this.logger.debug('File written successfully', { 
        file: outputPath,
        size: content.length 
      });
      
    } catch (error) {
      throw new FileSystemError({
        message: `Failed to write file: ${outputPath}`,
        file: outputPath,
        originalError: error
      });
    }
  }

  /**
   * Generate multiple files from a batch
   */
  async generateBatch(files) {
    const results = [];
    
    for (const fileData of files) {
      try {
        const result = await this.generate(
          fileData.filePath,
          fileData.frontmatter,
          fileData.content,
          fileData.metadata
        );
        results.push({ ...result, source: fileData.filePath });
      } catch (error) {
        results.push({
          source: fileData.filePath,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get generation statistics
   */
  getStats() {
    return {
      outputDir: this.outputDir,
      options: this.options
    };
  }
}

module.exports = {
  MDXGenerator
};
