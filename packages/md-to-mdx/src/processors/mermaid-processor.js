/**
 * Mermaid Processor - Transforms ```mermaid code blocks into <Mermaid> component syntax
 */

const { logger } = require('../logger');
const { MermaidError } = require('../errors');

/**
 * Mermaid Processor class
 */
class MermaidProcessor {
  constructor(options = {}) {
    this.name = 'mermaid';
    this.priority = 10; // Process after standard elements
    this.enabled = options.enabled !== false;
    
    this.options = {
      componentPath: '../../components/Mermaid.astro',
      componentName: 'Mermaid',
      validateSyntax: true,
      preserveCodeBlock: false,
      addTitle: true,
      ...options
    };
    
    this.logger = logger.child({ component: 'MermaidProcessor' });
    
    // Mermaid diagram type keywords for validation
    this.mermaidKeywords = [
      'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
      'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline',
      'quadrantChart', 'requirementDiagram', 'c4Context', 'c4Container', 'c4Component',
      'c4Dynamic', 'c4Deployment'
    ];
  }

  /**
   * Process content to transform mermaid code blocks
   */
  async process(content, context) {
    try {
      this.logger.debug('Processing mermaid code blocks', {
        file: context.sourceFile
      });
      
      // Find all mermaid code blocks
      const mermaidBlocks = this.findMermaidBlocks(content);
      
      if (mermaidBlocks.length === 0) {
        this.logger.debug('No mermaid blocks found', { file: context.sourceFile });
        return content;
      }
      
      this.logger.debug(`Found ${mermaidBlocks.length} mermaid blocks`, {
        file: context.sourceFile
      });
      
      // Process each block
      let processedContent = content;
      let offset = 0;
      
      for (const block of mermaidBlocks) {
        try {
          // Validate mermaid syntax if enabled
          if (this.options.validateSyntax) {
            this.validateMermaidSyntax(block.code, context);
          }
          
          // Generate component syntax
          const componentSyntax = this.generateComponentSyntax(block.code, block.title);
          
          // Replace the code block with component syntax
          const startPos = block.start + offset;
          const endPos = block.end + offset;
          
          processedContent = processedContent.substring(0, startPos) + 
                           componentSyntax + 
                           processedContent.substring(endPos);
          
          // Update offset for subsequent replacements
          offset += componentSyntax.length - (block.end - block.start);
          
          this.logger.debug('Transformed mermaid block', {
            file: context.sourceFile,
            originalLength: block.end - block.start,
            newLength: componentSyntax.length
          });
          
        } catch (error) {
          const mermaidError = new MermaidError({
            message: `Failed to process mermaid block: ${error.message}`,
            file: context.sourceFile,
            line: block.line,
            originalError: error
          });
          
          context.errors.push(mermaidError);
          
          if (!this.options.preserveCodeBlock) {
            // Replace with error message
            const errorSyntax = this.generateErrorSyntax(block.code, error.message);
            const startPos = block.start + offset;
            const endPos = block.end + offset;
            
            processedContent = processedContent.substring(0, startPos) + 
                             errorSyntax + 
                             processedContent.substring(endPos);
            
            offset += errorSyntax.length - (block.end - block.start);
          }
        }
      }
      
      this.logger.info('Mermaid processing completed', {
        file: context.sourceFile,
        blocksProcessed: mermaidBlocks.length,
        errors: context.errors.filter(e => e instanceof MermaidError).length
      });
      
      return processedContent;
      
    } catch (error) {
      throw new MermaidError({
        message: `Mermaid processing failed: ${error.message}`,
        file: context.sourceFile,
        processor: this.name,
        originalError: error
      });
    }
  }

  /**
   * Find all mermaid code blocks in content
   */
  findMermaidBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    let inMermaidBlock = false;
    let currentBlock = null;
    let lineNumber = 0;
    let charPosition = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      lineNumber = i + 1;
      
      if (!inMermaidBlock) {
        // Look for mermaid code block start
        const startMatch = line.match(/^(\s*)(```|~~~)\s*mermaid\s*(.*)$/i);
        if (startMatch) {
          inMermaidBlock = true;
          currentBlock = {
            start: charPosition,
            line: lineNumber,
            indent: startMatch[1],
            fence: startMatch[2],
            title: startMatch[3].trim() || null,
            code: '',
            codeLines: []
          };
        }
      } else {
        // Look for code block end
        const endMatch = line.match(/^(\s*)(```|~~~)\s*$/);
        if (endMatch && endMatch[2] === currentBlock.fence) {
          // End of mermaid block
          currentBlock.end = charPosition + line.length + 1; // +1 for newline
          currentBlock.code = currentBlock.codeLines.join('\n');
          blocks.push(currentBlock);
          
          inMermaidBlock = false;
          currentBlock = null;
        } else {
          // Code line
          currentBlock.codeLines.push(line);
        }
      }
      
      charPosition += line.length + 1; // +1 for newline
    }
    
    // Handle unclosed block
    if (inMermaidBlock && currentBlock) {
      currentBlock.end = charPosition;
      currentBlock.code = currentBlock.codeLines.join('\n');
      blocks.push(currentBlock);
      
      this.logger.warn('Unclosed mermaid code block detected', {
        line: currentBlock.line
      });
    }
    
    return blocks;
  }

  /**
   * Validate mermaid syntax
   */
  validateMermaidSyntax(code, context) {
    if (!code || typeof code !== 'string') {
      throw new Error('Empty or invalid mermaid code');
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      throw new Error('Empty mermaid code block');
    }

    // Check for recognized mermaid diagram types
    const hasValidKeyword = this.mermaidKeywords.some(keyword => 
      trimmedCode.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasValidKeyword) {
      context.warnings.push(new MermaidError({
        message: 'Mermaid code does not contain recognized diagram type keywords',
        file: context.sourceFile
      }));
    }

    // Basic syntax validation
    this.validateBasicSyntax(trimmedCode);
  }

  /**
   * Validate basic mermaid syntax patterns
   */
  validateBasicSyntax(code) {
    const errors = [];
    
    // Check for common syntax errors
    
    // 1. Unmatched brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Unmatched square brackets');
    }
    
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Unmatched parentheses');
    }
    
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unmatched curly braces');
    }
    
    // 2. Check for invalid characters in node IDs
    const nodeIdRegex = /^\s*([A-Za-z0-9_-]+)/gm;
    let match;
    while ((match = nodeIdRegex.exec(code)) !== null) {
      const nodeId = match[1];
      if (nodeId.includes(' ')) {
        errors.push(`Invalid node ID '${nodeId}' contains spaces`);
      }
    }
    
    // 3. Arrow syntax validation disabled - let Mermaid handle syntax errors
    // This was causing false positives with valid Mermaid syntax
    
    if (errors.length > 0) {
      throw new Error(`Mermaid syntax errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Generate MDX component syntax for mermaid diagram
   */
  generateComponentSyntax(code, title = null) {
    // Escape the code for JSX
    const escapedCode = this.escapeForJSX(code);
    
    // Generate component props
    const props = [];
    
    if (title) {
      props.push(`title="${this.escapeForJSX(title)}"`);
    }
    
    props.push(`code={\`${escapedCode}\`}`);
    
    // Generate component syntax
    const componentSyntax = `<${this.options.componentName} ${props.join(' ')} />`;
    
    return componentSyntax;
  }

  /**
   * Generate error syntax for failed mermaid blocks
   */
  generateErrorSyntax(code, errorMessage) {
    const escapedCode = this.escapeForJSX(code);
    const escapedError = this.escapeForJSX(errorMessage);
    
    return `<div style={{color: '#ff6b6b', padding: '1rem', border: '1px solid #ff6b6b', borderRadius: '4px'}}>
  <strong>Mermaid Error:</strong> ${escapedError}
  <details style={{marginTop: '0.5rem'}}>
    <summary>Show code</summary>
    <pre style={{background: '#f5f5f5', padding: '0.5rem', marginTop: '0.5rem', overflowX: 'auto'}}>
      <code>{\`${escapedCode}\`}</code>
    </pre>
  </details>
</div>`;
  }

  /**
   * Escape content for JSX
   */
  escapeForJSX(content) {
    return content
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/`/g, '\\`')    // Escape backticks
      .replace(/\$/g, '\\$')   // Escape dollar signs
      .replace(/\{/g, '\\{')   // Escape opening braces
      .replace(/\}/g, '\\}');  // Escape closing braces
  }

  /**
   * Get mermaid diagram type from code
   */
  getDiagramType(code) {
    const trimmedCode = code.trim().toLowerCase();
    
    for (const keyword of this.mermaidKeywords) {
      if (trimmedCode.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    
    return 'unknown';
  }

  /**
   * Get processing statistics
   */
  getStats(content) {
    const blocks = this.findMermaidBlocks(content);
    const diagramTypes = {};
    
    blocks.forEach(block => {
      const type = this.getDiagramType(block.code);
      diagramTypes[type] = (diagramTypes[type] || 0) + 1;
    });
    
    return {
      totalBlocks: blocks.length,
      diagramTypes,
      averageCodeLength: blocks.length > 0 
        ? Math.round(blocks.reduce((sum, block) => sum + block.code.length, 0) / blocks.length)
        : 0
    };
  }

  /**
   * Check if content contains mermaid blocks
   */
  hasMermaidBlocks(content) {
    return /```\s*mermaid/i.test(content);
  }
}

module.exports = {
  MermaidProcessor
};
