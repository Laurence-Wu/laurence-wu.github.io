/**
 * Math Processor - Transforms LaTeX math expressions into proper MDX format compatible with KaTeX
 */

const { logger } = require('../logger');
const { MathError } = require('../errors');

/**
 * Math Processor class
 */
class MathProcessor {
  constructor(options = {}) {
    this.name = 'math';
    this.priority = 20; // Process after mermaid and images
    this.enabled = options.enabled !== false;
    
    this.options = {
      inlineDelimiters: ['$', '$'],
      displayDelimiters: ['$$', '$$'],
      validateLatex: true,
      preserveEscapes: true,
      escapeForMDX: true,
      ...options
    };
    
    this.logger = logger.child({ component: 'MathProcessor' });
    
    // Common LaTeX commands for validation
    this.commonLatexCommands = [
      'frac', 'sqrt', 'sum', 'int', 'lim', 'sin', 'cos', 'tan', 'log', 'ln',
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu',
      'pi', 'sigma', 'phi', 'omega', 'infty', 'partial', 'nabla', 'cdot',
      'times', 'div', 'pm', 'mp', 'leq', 'geq', 'neq', 'approx', 'equiv',
      'left', 'right', 'begin', 'end', 'text', 'mathrm', 'mathbf', 'mathit'
    ];
  }

  /**
   * Process content to transform math expressions
   */
  async process(content, context) {
    try {
      this.logger.debug('Processing math expressions', {
        file: context.sourceFile
      });
      
      // Find all math expressions
      const mathExpressions = this.findMathExpressions(content);
      
      if (mathExpressions.length === 0) {
        this.logger.debug('No math expressions found', { file: context.sourceFile });
        return content;
      }
      
      this.logger.debug(`Found ${mathExpressions.length} math expressions`, {
        file: context.sourceFile
      });
      
      // Process each expression
      let processedContent = content;
      let offset = 0;
      
      for (const mathExpr of mathExpressions) {
        try {
          // Validate LaTeX syntax if enabled
          if (this.options.validateLatex) {
            this.validateLatexSyntax(mathExpr.expression, context);
          }
          
          // Generate MDX-compatible syntax
          const mdxSyntax = this.generateMDXSyntax(mathExpr);
          
          // Replace the math expression
          const startPos = mathExpr.start + offset;
          const endPos = mathExpr.end + offset;
          
          processedContent = processedContent.substring(0, startPos) + 
                           mdxSyntax + 
                           processedContent.substring(endPos);
          
          // Update offset for subsequent replacements
          offset += mdxSyntax.length - (mathExpr.end - mathExpr.start);
          
          this.logger.debug('Transformed math expression', {
            file: context.sourceFile,
            type: mathExpr.type,
            originalLength: mathExpr.end - mathExpr.start,
            newLength: mdxSyntax.length
          });
          
        } catch (error) {
          const mathError = new MathError({
            message: `Failed to process math expression: ${error.message}`,
            file: context.sourceFile,
            line: mathExpr.line,
            originalError: error
          });
          
          context.warnings.push(mathError);
          
          this.logger.warn('Math processing failed', {
            file: context.sourceFile,
            expression: mathExpr.expression.substring(0, 50) + '...',
            error: error.message
          });
        }
      }
      
      this.logger.info('Math processing completed', {
        file: context.sourceFile,
        expressionsProcessed: mathExpressions.length,
        warnings: context.warnings.filter(w => w instanceof MathError).length
      });
      
      return processedContent;
      
    } catch (error) {
      throw new MathError({
        message: `Math processing failed: ${error.message}`,
        file: context.sourceFile,
        processor: this.name,
        originalError: error
      });
    }
  }

  /**
   * Find all math expressions in content
   */
  findMathExpressions(content) {
    const expressions = [];
    const lines = content.split('\n');
    let charPosition = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Find display math expressions ($$...$$)
      const displayMatches = this.findDisplayMath(line, charPosition, lineNumber);
      expressions.push(...displayMatches);
      
      // Find inline math expressions ($...$) - but not display math
      const inlineMatches = this.findInlineMath(line, charPosition, lineNumber, displayMatches);
      expressions.push(...inlineMatches);
      
      charPosition += line.length + 1; // +1 for newline
    }
    
    // Sort by position to process in order
    return expressions.sort((a, b) => a.start - b.start);
  }

  /**
   * Find display math expressions ($$...$$)
   */
  findDisplayMath(line, charPosition, lineNumber) {
    const expressions = [];
    const [openDelim, closeDelim] = this.options.displayDelimiters;
    
    // Handle multi-character delimiters
    const regex = new RegExp(`\\${openDelim}((?:\\\\.|[^\\${closeDelim[0]}])*?)\\${closeDelim}`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      const fullMatch = match[0];
      const expression = match[1];
      
      // Skip if this is escaped
      if (this.isEscaped(line, match.index)) {
        continue;
      }
      
      expressions.push({
        start: charPosition + match.index,
        end: charPosition + match.index + fullMatch.length,
        line: lineNumber,
        type: 'display',
        expression: expression.trim(),
        fullMatch,
        delimiters: [openDelim, closeDelim]
      });
    }
    
    return expressions;
  }

  /**
   * Find inline math expressions ($...$)
   */
  findInlineMath(line, charPosition, lineNumber, displayMatches) {
    const expressions = [];
    const [openDelim, closeDelim] = this.options.inlineDelimiters;
    
    // Skip if delimiters are the same as display delimiters
    if (openDelim === this.options.displayDelimiters[0]) {
      return expressions;
    }
    
    const regex = new RegExp(`\\${openDelim}((?:\\\\.|[^\\${closeDelim[0]}])*?)\\${closeDelim}`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      const fullMatch = match[0];
      const expression = match[1];
      
      // Skip if this is escaped
      if (this.isEscaped(line, match.index)) {
        continue;
      }
      
      // Skip if this overlaps with a display math expression
      const matchStart = charPosition + match.index;
      const matchEnd = matchStart + fullMatch.length;
      const overlapsDisplay = displayMatches.some(display => 
        (matchStart >= display.start && matchStart < display.end) ||
        (matchEnd > display.start && matchEnd <= display.end)
      );
      
      if (overlapsDisplay) {
        continue;
      }
      
      expressions.push({
        start: matchStart,
        end: matchEnd,
        line: lineNumber,
        type: 'inline',
        expression: expression.trim(),
        fullMatch,
        delimiters: [openDelim, closeDelim]
      });
    }
    
    return expressions;
  }

  /**
   * Check if a position in the line is escaped
   */
  isEscaped(line, position) {
    if (position === 0) return false;
    
    let backslashCount = 0;
    for (let i = position - 1; i >= 0 && line[i] === '\\'; i--) {
      backslashCount++;
    }
    
    // Odd number of backslashes means the character is escaped
    return backslashCount % 2 === 1;
  }

  /**
   * Validate LaTeX syntax
   */
  validateLatexSyntax(expression, context) {
    if (!expression || typeof expression !== 'string') {
      throw new Error('Empty or invalid LaTeX expression');
    }

    const trimmedExpr = expression.trim();
    if (trimmedExpr.length === 0) {
      throw new Error('Empty LaTeX expression');
    }

    // Check for balanced braces
    this.validateBalancedBraces(trimmedExpr);
    
    // Check for common LaTeX syntax issues
    this.validateCommonSyntax(trimmedExpr, context);
  }

  /**
   * Validate balanced braces in LaTeX expression
   */
  validateBalancedBraces(expression) {
    const braceTypes = [
      { open: '{', close: '}', name: 'curly braces' },
      { open: '[', close: ']', name: 'square brackets' },
      { open: '(', close: ')', name: 'parentheses' }
    ];
    
    for (const braceType of braceTypes) {
      let count = 0;
      let escaped = false;
      
      for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          continue;
        }
        
        if (char === braceType.open) {
          count++;
        } else if (char === braceType.close) {
          count--;
          if (count < 0) {
            throw new Error(`Unmatched closing ${braceType.name}`);
          }
        }
      }
      
      if (count !== 0) {
        throw new Error(`Unmatched ${braceType.name}`);
      }
    }
  }

  /**
   * Validate common LaTeX syntax patterns
   */
  validateCommonSyntax(expression, context) {
    const warnings = [];
    
    // Check for unknown commands (basic validation)
    const commandRegex = /\\([a-zA-Z]+)/g;
    let match;
    while ((match = commandRegex.exec(expression)) !== null) {
      const command = match[1];
      if (!this.commonLatexCommands.includes(command)) {
        warnings.push(`Unknown LaTeX command: \\${command}`);
      }
    }
    
    // Check for common syntax errors
    if (expression.includes('\\frac{}')) {
      warnings.push('Empty fraction numerator or denominator');
    }
    
    if (expression.includes('\\sqrt{}')) {
      warnings.push('Empty square root');
    }
    
    // Check for unescaped special characters in text mode
    const specialChars = ['&', '%', '#'];
    for (const char of specialChars) {
      if (expression.includes(char) && !expression.includes(`\\${char}`)) {
        warnings.push(`Unescaped special character: ${char}`);
      }
    }
    
    // Add warnings to context
    if (warnings.length > 0) {
      context.warnings.push(...warnings.map(warning => 
        new MathError({ 
          message: warning, 
          file: context.sourceFile,
          processor: this.name 
        })
      ));
    }
  }

  /**
   * Generate MDX-compatible syntax for math expression
   */
  generateMDXSyntax(mathExpr) {
    const { type, expression } = mathExpr;
    
    // Escape the expression for MDX
    const escapedExpression = this.escapeForMDX(expression);
    
    if (type === 'display') {
      // Display math - centered block
      return `\n\n<div className="math-display">\n  {String.raw\`${escapedExpression}\`}\n</div>\n\n`;
    } else {
      // Inline math
      return `<span className="math-inline">{String.raw\`${escapedExpression}\`}</span>`;
    }
  }

  /**
   * Escape LaTeX expression for MDX
   */
  escapeForMDX(expression) {
    if (!this.options.escapeForMDX) {
      return expression;
    }
    
    return expression
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/`/g, '\\`')    // Escape backticks
      .replace(/\$/g, '\\$')   // Escape dollar signs
      .replace(/\{/g, '\\{')   // Escape opening braces
      .replace(/\}/g, '\\}');  // Escape closing braces
  }

  /**
   * Get math expression type from delimiters
   */
  getExpressionType(openDelim, closeDelim) {
    const [displayOpen, displayClose] = this.options.displayDelimiters;
    
    if (openDelim === displayOpen && closeDelim === displayClose) {
      return 'display';
    }
    
    return 'inline';
  }

  /**
   * Get processing statistics
   */
  getStats(content) {
    const expressions = this.findMathExpressions(content);
    const inlineCount = expressions.filter(expr => expr.type === 'inline').length;
    const displayCount = expressions.filter(expr => expr.type === 'display').length;
    
    const commands = new Set();
    expressions.forEach(expr => {
      const commandMatches = expr.expression.match(/\\([a-zA-Z]+)/g);
      if (commandMatches) {
        commandMatches.forEach(cmd => commands.add(cmd));
      }
    });
    
    return {
      totalExpressions: expressions.length,
      inlineExpressions: inlineCount,
      displayExpressions: displayCount,
      uniqueCommands: Array.from(commands),
      averageLength: expressions.length > 0 
        ? Math.round(expressions.reduce((sum, expr) => sum + expr.expression.length, 0) / expressions.length)
        : 0
    };
  }

  /**
   * Check if content contains math expressions
   */
  hasMathExpressions(content) {
    const [inlineOpen] = this.options.inlineDelimiters;
    const [displayOpen] = this.options.displayDelimiters;
    
    return content.includes(inlineOpen) || content.includes(displayOpen);
  }
}

module.exports = {
  MathProcessor
};
