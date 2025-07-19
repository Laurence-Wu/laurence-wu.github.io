/**
 * Auto Import Manager
 * Manages automatic component imports for remark plugins
 */

export class AutoImportManager {
  constructor() {
    this.imports = new Map();
    this.usedComponents = new Set();
  }

  /**
   * Add a component import
   * @param {string} componentName - Name of the component
   * @param {string} importPath - Path to import from
   * @param {string} [importType='default'] - Type of import ('default', 'named')
   */
  addImport(componentName, importPath, importType = 'default') {
    const importKey = `${componentName}:${importPath}`;
    
    if (!this.imports.has(importKey)) {
      this.imports.set(importKey, {
        componentName,
        importPath,
        importType,
        used: false
      });
    }
  }

  /**
   * Mark a component as used
   * @param {string} componentName - Name of the component
   */
  markAsUsed(componentName) {
    this.usedComponents.add(componentName);
    
    // Mark corresponding import as used
    for (const [key, importInfo] of this.imports.entries()) {
      if (importInfo.componentName === componentName) {
        importInfo.used = true;
      }
    }
  }

  /**
   * Check if a component import exists
   * @param {string} componentName - Name of the component
   * @returns {boolean}
   */
  hasImport(componentName) {
    for (const importInfo of this.imports.values()) {
      if (importInfo.componentName === componentName) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate import statements for used components
   * @returns {string[]} Array of import statements
   */
  generateImportStatements() {
    const statements = [];
    
    for (const importInfo of this.imports.values()) {
      if (importInfo.used) {
        if (importInfo.importType === 'default') {
          statements.push(`import ${importInfo.componentName} from "${importInfo.importPath}";`);
        } else if (importInfo.importType === 'named') {
          statements.push(`import { ${importInfo.componentName} } from "${importInfo.importPath}";`);
        }
      }
    }
    
    return statements;
  }

  /**
   * Get all used components
   * @returns {Set<string>}
   */
  getUsedComponents() {
    return new Set(this.usedComponents);
  }

  /**
   * Clear all imports and usage tracking
   */
  clear() {
    this.imports.clear();
    this.usedComponents.clear();
  }

  /**
   * Get import statistics
   * @returns {Object}
   */
  getStats() {
    const total = this.imports.size;
    const used = Array.from(this.imports.values()).filter(imp => imp.used).length;
    
    return {
      totalImports: total,
      usedImports: used,
      unusedImports: total - used,
      components: Array.from(this.usedComponents)
    };
  }
}