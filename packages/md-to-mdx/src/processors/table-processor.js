/**
 * Table Processor - Ensures Markdown tables are properly formatted for enhanced styling
 */

const { logger } = require('../logger');
const { ContentError } = require('../errors');

/**
 * Table Processor class
 */
class TableProcessor {
  constructor(options = {}) {
    this.name = 'table';
    this.priority = 30; // Process after other content processors
    this.enabled = options.enabled !== false;
    
    this.options = {
      addResponsiveClasses: true,
      enhancedStyling: true,
      wrapInContainer: false,
      addDataLabels: true, // For mobile responsive tables
      validateStructure: true,
      ...options
    };
    
    this.logger = logger.child({ component: 'TableProcessor' });
  }

  /**
   * Process content to enhance table formatting
   */
  async process(content, context) {
    try {
      this.logger.debug('Processing tables', {
        file: context.sourceFile
      });
      
      // Find all tables in the content
      const tables = this.findTables(content);
      
      if (tables.length === 0) {
        this.logger.debug('No tables found', { file: context.sourceFile });
        return content;
      }
      
      this.logger.debug(`Found ${tables.length} tables`, {
        file: context.sourceFile
      });
      
      // Process each table
      let processedContent = content;
      let offset = 0;
      
      for (const table of tables) {
        try {
          // Validate table structure if enabled
          if (this.options.validateStructure) {
            this.validateTableStructure(table, context);
          }
          
          // Generate enhanced table syntax
          const enhancedTable = this.enhanceTableSyntax(table);
          
          // Replace the table
          const startPos = table.start + offset;
          const endPos = table.end + offset;
          
          processedContent = processedContent.substring(0, startPos) + 
                           enhancedTable + 
                           processedContent.substring(endPos);
          
          // Update offset for subsequent replacements
          offset += enhancedTable.length - (table.end - table.start);
          
          this.logger.debug('Enhanced table', {
            file: context.sourceFile,
            rows: table.rows.length,
            columns: table.headers.length,
            originalLength: table.end - table.start,
            newLength: enhancedTable.length
          });
          
        } catch (error) {
          const tableError = new ContentError({
            message: `Failed to process table: ${error.message}`,
            file: context.sourceFile,
            line: table.startLine,
            originalError: error
          });
          
          context.warnings.push(tableError);
          
          this.logger.warn('Table processing failed', {
            file: context.sourceFile,
            table: table.startLine,
            error: error.message
          });
        }
      }
      
      this.logger.info('Table processing completed', {
        file: context.sourceFile,
        tablesProcessed: tables.length,
        warnings: context.warnings.filter(w => w.processor === this.name).length
      });
      
      return processedContent;
      
    } catch (error) {
      throw new ContentError({
        message: `Table processing failed: ${error.message}`,
        file: context.sourceFile,
        processor: this.name,
        originalError: error
      });
    }
  }

  /**
   * Find all tables in content
   */
  findTables(content) {
    const tables = [];
    const lines = content.split('\n');
    let charPosition = 0;
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Check if this line looks like a table header
      if (this.isTableRow(line)) {
        // Look for separator line
        if (i + 1 < lines.length && this.isTableSeparator(lines[i + 1].trim())) {
          // Found a table - parse it
          const table = this.parseTable(lines, i, charPosition);
          if (table) {
            tables.push(table);
            i = table.endLineIndex;
            charPosition = table.end;
            continue;
          }
        }
      }
      
      charPosition += lines[i].length + 1; // +1 for newline
      i++;
    }
    
    return tables;
  }

  /**
   * Check if a line looks like a table row
   */
  isTableRow(line) {
    // Must contain at least one pipe character
    if (!line.includes('|')) {
      return false;
    }
    
    // Count pipes (should have at least 2 for a valid table row)
    const pipeCount = (line.match(/\|/g) || []).length;
    return pipeCount >= 2;
  }

  /**
   * Check if a line is a table separator
   */
  isTableSeparator(line) {
    // Should contain pipes and dashes/colons
    if (!line.includes('|')) {
      return false;
    }
    
    // Remove pipes and check if remaining characters are valid separator chars
    const withoutPipes = line.replace(/\|/g, '').trim();
    return /^[\s\-:]+$/.test(withoutPipes);
  }

  /**
   * Parse a complete table starting from a given line
   */
  parseTable(lines, startIndex, startCharPosition) {
    const headerLine = lines[startIndex].trim();
    const separatorLine = lines[startIndex + 1].trim();
    
    // Parse header
    const headers = this.parseTableRow(headerLine);
    const alignments = this.parseTableSeparator(separatorLine);
    
    if (headers.length !== alignments.length) {
      return null; // Invalid table structure
    }
    
    // Parse data rows
    const rows = [];
    let currentIndex = startIndex + 2;
    let endCharPosition = startCharPosition;
    
    // Add header and separator line lengths
    endCharPosition += lines[startIndex].length + 1; // +1 for newline
    endCharPosition += lines[startIndex + 1].length + 1; // +1 for newline
    
    while (currentIndex < lines.length) {
      const line = lines[currentIndex].trim();
      
      if (!line || !this.isTableRow(line)) {
        break; // End of table
      }
      
      const rowCells = this.parseTableRow(line);
      rows.push(rowCells);
      
      endCharPosition += lines[currentIndex].length + 1; // +1 for newline
      currentIndex++;
    }
    
    return {
      start: startCharPosition,
      end: endCharPosition,
      startLine: startIndex + 1,
      endLine: currentIndex,
      endLineIndex: currentIndex,
      headers,
      alignments,
      rows,
      columnCount: headers.length,
      rowCount: rows.length
    };
  }

  /**
   * Parse a table row into cells
   */
  parseTableRow(line) {
    // Split by pipes and clean up
    const cells = line.split('|')
      .map(cell => cell.trim())
      .filter((cell, index, array) => {
        // Remove empty cells at start/end (from leading/trailing pipes)
        return !(cell === '' && (index === 0 || index === array.length - 1));
      });
    
    return cells;
  }

  /**
   * Parse table separator line to determine alignments
   */
  parseTableSeparator(line) {
    const cells = line.split('|')
      .map(cell => cell.trim())
      .filter((cell, index, array) => {
        return !(cell === '' && (index === 0 || index === array.length - 1));
      });
    
    return cells.map(cell => {
      if (cell.startsWith(':') && cell.endsWith(':')) {
        return 'center';
      } else if (cell.endsWith(':')) {
        return 'right';
      } else {
        return 'left';
      }
    });
  }

  /**
   * Validate table structure
   */
  validateTableStructure(table, context) {
    const warnings = [];
    
    // Check if all rows have the same number of columns
    const expectedColumns = table.headers.length;
    
    table.rows.forEach((row, index) => {
      if (row.length !== expectedColumns) {
        warnings.push(`Row ${index + 1} has ${row.length} columns, expected ${expectedColumns}`);
      }
    });
    
    // Check for empty headers
    table.headers.forEach((header, index) => {
      if (!header.trim()) {
        warnings.push(`Column ${index + 1} has empty header`);
      }
    });
    
    // Add warnings to context
    if (warnings.length > 0) {
      context.warnings.push(...warnings.map(warning => 
        new ContentError({ 
          message: warning, 
          file: context.sourceFile,
          processor: this.name 
        })
      ));
    }
  }

  /**
   * Enhance table syntax with additional features
   */
  enhanceTableSyntax(table) {
    let enhanced = '';
    
    // Add wrapper if requested
    if (this.options.wrapInContainer) {
      enhanced += '<div className="table-wrapper">\n\n';
    }
    
    // Build the enhanced table
    enhanced += this.buildTableHeader(table);
    enhanced += this.buildTableSeparator(table);
    enhanced += this.buildTableRows(table);
    
    // Close wrapper if added
    if (this.options.wrapInContainer) {
      enhanced += '\n</div>';
    }
    
    return enhanced;
  }

  /**
   * Build enhanced table header
   */
  buildTableHeader(table) {
    const { headers, alignments } = table;
    
    let headerRow = '|';
    
    headers.forEach((header, index) => {
      let cellContent = ` ${header} `;
      
      // Add responsive data labels if enabled
      if (this.options.addDataLabels) {
        // This will be used by CSS for mobile responsive tables
        cellContent = ` ${header} `;
      }
      
      headerRow += cellContent + '|';
    });
    
    return headerRow + '\n';
  }

  /**
   * Build enhanced table separator
   */
  buildTableSeparator(table) {
    const { alignments } = table;
    
    let separatorRow = '|';
    
    alignments.forEach(alignment => {
      let separator;
      switch (alignment) {
        case 'center':
          separator = ' :---: ';
          break;
        case 'right':
          separator = ' ---: ';
          break;
        case 'left':
          separator = ' :--- ';
          break;
        default:
          separator = ' --- ';
      }
      
      separatorRow += separator + '|';
    });
    
    return separatorRow + '\n';
  }

  /**
   * Build enhanced table rows
   */
  buildTableRows(table) {
    const { rows, headers } = table;
    let tableRows = '';
    
    rows.forEach((row, rowIndex) => {
      let rowContent = '|';
      
      row.forEach((cell, cellIndex) => {
        let cellContent = ` ${cell} `;
        
        // Add data labels for mobile responsiveness
        if (this.options.addDataLabels && headers[cellIndex]) {
          // The data-label will be used by CSS for mobile display
          cellContent = ` ${cell} `;
        }
        
        rowContent += cellContent + '|';
      });
      
      tableRows += rowContent + '\n';
    });
    
    return tableRows;
  }

  /**
   * Add responsive attributes to table
   */
  addResponsiveAttributes(table) {
    // This would add HTML attributes for responsive behavior
    // For now, we rely on CSS classes and data attributes
    return table;
  }

  /**
   * Get processing statistics
   */
  getStats(content) {
    const tables = this.findTables(content);
    
    const stats = {
      totalTables: tables.length,
      totalRows: 0,
      totalColumns: 0,
      averageColumns: 0,
      averageRows: 0,
      alignmentTypes: { left: 0, center: 0, right: 0 }
    };
    
    if (tables.length === 0) {
      return stats;
    }
    
    tables.forEach(table => {
      stats.totalRows += table.rowCount;
      stats.totalColumns += table.columnCount;
      
      table.alignments.forEach(alignment => {
        stats.alignmentTypes[alignment]++;
      });
    });
    
    stats.averageColumns = Math.round(stats.totalColumns / tables.length);
    stats.averageRows = Math.round(stats.totalRows / tables.length);
    
    return stats;
  }

  /**
   * Check if content contains tables
   */
  hasTables(content) {
    // Quick check for pipe characters that might indicate tables
    if (!content.includes('|')) {
      return false;
    }
    
    // More thorough check
    const lines = content.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (this.isTableRow(lines[i].trim()) && 
          this.isTableSeparator(lines[i + 1].trim())) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = {
  TableProcessor
};
