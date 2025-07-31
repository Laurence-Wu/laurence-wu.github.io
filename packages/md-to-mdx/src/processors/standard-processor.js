/**
 * Standard Markdown Processor - Preserves all standard Markdown elements
 */

const { logger } = require('../logger');
const { ContentError } = require('../errors');

/**
 * Standard Markdown Processor class
 */
class StandardProcessor {
  constructor(options = {}) {
    this.name = 'standard';
    this.priority = 0; // Process first to establish baseline
    this.enabled = options.enabled !== false;
    
    this.options = {
      preserveAllElements: true,
      validateSyntax: true,
      normalizeWhitespace: false,
      ...options
    };
    
    this.logger = logger.child({ component: 'StandardProcessor' });
  }

  /**
   * Process content to ensure standard Markdown elements are preserved
   */
  async process(content, context) {
    try {
      this.logger.debug('Processing standard Markdown elements', {
        file: context.sourceFile
      });
      
      // Validate Markdown syntax if enabled
      if (this.options.validateSyntax) {
        this.validateMarkdownSyntax(content, context);
      }
      
      // Preserve standard elements (this is mainly a pass-through processor)
      let processedContent = content;
      
      // Normalize whitespace if requested
      if (this.options.normalizeWhitespace) {
        processedContent = this.normalizeWhitespace(processedContent);
      }
      
      // Ensure standard elements are properly formatted for MDX
      processedContent = this.ensureMDXCompatibility(processedContent);
      
      this.logger.debug('Standard Markdown processing completed', {
        file: context.sourceFile,
        originalLength: content.length,
        processedLength: processedContent.length
      });
      
      return processedContent;
      
    } catch (error) {
      throw new ContentError({
        message: `Standard Markdown processing failed: ${error.message}`,
        file: context.sourceFile,
        processor: this.name,
        originalError: error
      });
    }
  }

  /**
   * Validate Markdown syntax
   */
  validateMarkdownSyntax(content, context) {
    const warnings = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Check for common Markdown syntax issues
      
      // 1. Headers - ensure space after #
      if (line.match(/^#+[^\s]/)) {
        warnings.push(`Line ${lineNumber}: Header should have space after # symbols`);
      }
      
      // 2. Lists - check for proper indentation
      if (line.match(/^\s*[-*+]\s*$/) || line.match(/^\s*\d+\.\s*$/)) {
        warnings.push(`Line ${lineNumber}: Empty list item detected`);
      }
      
      // 3. Links - check for malformed links
      const linkMatches = line.match(/\[([^\]]*)\]\(([^)]*)\)/g);
      if (linkMatches) {
        linkMatches.forEach(match => {
          const linkMatch = match.match(/\[([^\]]*)\]\(([^)]*)\)/);
          if (linkMatch && !linkMatch[2].trim()) {
            warnings.push(`Line ${lineNumber}: Empty link URL detected`);
          }
        });
      }
      
      // 4. Images - check for malformed images
      const imageMatches = line.match(/!\[([^\]]*)\]\(([^)]*)\)/g);
      if (imageMatches) {
        imageMatches.forEach(match => {
          const imageMatch = match.match(/!\[([^\]]*)\]\(([^)]*)\)/);
          if (imageMatch && !imageMatch[2].trim()) {
            warnings.push(`Line ${lineNumber}: Empty image URL detected`);
          }
        });
      }
      
      // 5. Code blocks - check for unclosed code blocks
      if (line.includes('```')) {
        const codeBlockCount = (content.match(/```/g) || []).length;
        if (codeBlockCount % 2 !== 0) {
          warnings.push(`Unclosed code block detected`);
        }
      }
    }
    
    // Add warnings to context
    if (warnings.length > 0) {
      context.warnings.push(...warnings.map(warning => 
        new ContentError({ 
          message: warning, 
          file: context.sourceFile,
          processor: this.name 
        })
      ));
      
      this.logger.warn('Markdown syntax issues detected', {
        file: context.sourceFile,
        warnings: warnings.length
      });
    }
  }

  /**
   * Normalize whitespace in content
   */
  normalizeWhitespace(content) {
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
   * Ensure standard Markdown elements are MDX compatible
   */
  ensureMDXCompatibility(content) {
    let processedContent = content;
    
    // 1. Preserve HTML comments (they're valid in MDX)
    // No changes needed for HTML comments
    
    // 2. Ensure proper spacing around JSX-like elements that might be in content
    // This is handled by other processors
    
    // 3. Preserve code blocks exactly as they are (except for special ones)
    // This processor doesn't modify code blocks - that's handled by specialized processors
    
    // 4. Ensure proper escaping of special characters in text
    processedContent = this.escapeSpecialCharacters(processedContent);
    
    return processedContent;
  }

  /**
   * Escape special characters that might conflict with JSX
   */
  escapeSpecialCharacters(content) {
    // Split content into blocks to avoid processing code blocks
    const blocks = this.splitIntoBlocks(content);
    
    return blocks.map(block => {
      if (block.type === 'code') {
        // Don't process code blocks
        return block.content;
      }
      
      // Escape JSX-conflicting characters in regular text
      let processed = block.content;
      
      // Escape curly braces that aren't part of intended JSX
      // This is a conservative approach - only escape obvious non-JSX braces
      processed = processed.replace(/\{(?![a-zA-Z_$])/g, '\\{');
      processed = processed.replace(/(?<![a-zA-Z0-9_$])\}/g, '\\}');
      
      return processed;
    }).join('');
  }

  /**
   * Split content into blocks (code vs regular text)
   */
  splitIntoBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    let currentBlock = { type: 'text', content: '', lines: [] };
    let inCodeBlock = false;
    let codeBlockFence = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for code block fences
      const fenceMatch = line.match(/^(\s*)(```|~~~)(.*)$/);
      
      if (fenceMatch && !inCodeBlock) {
        // Starting a code block
        if (currentBlock.lines.length > 0) {
          currentBlock.content = currentBlock.lines.join('\n');
          blocks.push(currentBlock);
        }
        
        inCodeBlock = true;
        codeBlockFence = fenceMatch[2];
        currentBlock = { 
          type: 'code', 
          content: '', 
          lines: [line],
          language: fenceMatch[3].trim()
        };
      } else if (fenceMatch && inCodeBlock && fenceMatch[2] === codeBlockFence) {
        // Ending a code block
        currentBlock.lines.push(line);
        currentBlock.content = currentBlock.lines.join('\n');
        blocks.push(currentBlock);
        
        inCodeBlock = false;
        codeBlockFence = '';
        currentBlock = { type: 'text', content: '', lines: [] };
      } else {
        // Regular line
        currentBlock.lines.push(line);
      }
    }
    
    // Add final block
    if (currentBlock.lines.length > 0) {
      currentBlock.content = currentBlock.lines.join('\n');
      blocks.push(currentBlock);
    }
    
    return blocks;
  }

  /**
   * Get list of standard Markdown elements that this processor preserves
   */
  getPreservedElements() {
    return [
      'headers', // # ## ### etc.
      'lists', // ordered and unordered
      'links', // [text](url)
      'images', // ![alt](url)
      'emphasis', // **bold**, *italic*, ~~strikethrough~~
      'code', // `inline code` and ```code blocks```
      'blockquotes', // > quoted text
      'horizontal-rules', // --- or ***
      'line-breaks', // \n and double spaces
      'paragraphs', // regular text blocks
      'tables', // | table | syntax |
      'html-comments', // <!-- comments -->
      'html-tags' // <tag>content</tag> (basic HTML)
    ];
  }

  /**
   * Check if content contains only standard Markdown elements
   */
  isStandardMarkdown(content) {
    // Check for non-standard elements that would require special processing
    
    // Check for JSX components (but not HTML tags)
    const jsxComponentRegex = /<[A-Z][a-zA-Z0-9]*(?:\s[^>]*)?(?:\s*\/>|>[\s\S]*?<\/[A-Z][a-zA-Z0-9]*>)/;
    if (jsxComponentRegex.test(content)) {
      return false;
    }
    
    // Check for JSX expressions
    const jsxExpressionRegex = /\{[^}]*\}/;
    if (jsxExpressionRegex.test(content)) {
      return false;
    }
    
    // Check for import/export statements
    if (content.includes('import ') || content.includes('export ')) {
      return false;
    }
    
    return true;
  }

  /**
   * Get processing statistics
   */
  getStats(content) {
    const lines = content.split('\n');
    const stats = {
      totalLines: lines.length,
      headers: (content.match(/^#+\s/gm) || []).length,
      lists: (content.match(/^\s*[-*+]\s/gm) || []).length + (content.match(/^\s*\d+\.\s/gm) || []).length,
      links: (content.match(/\[([^\]]*)\]\(([^)]*)\)/g) || []).length,
      images: (content.match(/!\[([^\]]*)\]\(([^)]*)\)/g) || []).length,
      codeBlocks: (content.match(/```/g) || []).length / 2,
      inlineCode: (content.match(/`[^`]+`/g) || []).length,
      blockquotes: (content.match(/^\s*>/gm) || []).length,
      horizontalRules: (content.match(/^---+$|^\*\*\*+$|^___+$/gm) || []).length
    };
    
    return stats;
  }
}

module.exports = {
  StandardProcessor
};
