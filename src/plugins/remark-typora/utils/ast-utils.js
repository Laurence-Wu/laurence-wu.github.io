/**
 * AST Utilities
 * Helper functions for manipulating markdown AST nodes
 */

import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';

export class AstUtils {
  /**
   * Find all nodes of a specific type
   * @param {Object} tree - AST tree
   * @param {string} nodeType - Type of node to find
   * @returns {Array} Array of matching nodes
   */
  static findNodesByType(tree, nodeType) {
    const nodes = [];
    visit(tree, nodeType, (node) => {
      nodes.push(node);
    });
    return nodes;
  }

  /**
   * Find all code blocks with a specific language
   * @param {Object} tree - AST tree
   * @param {string} language - Language identifier
   * @returns {Array} Array of matching code nodes
   */
  static findCodeBlocksByLanguage(tree, language) {
    const codeBlocks = [];
    visit(tree, 'code', (node) => {
      if (node.lang === language) {
        codeBlocks.push(node);
      }
    });
    return codeBlocks;
  }

  /**
   * Find all image nodes
   * @param {Object} tree - AST tree
   * @returns {Array} Array of image nodes
   */
  static findImageNodes(tree) {
    const images = [];
    visit(tree, 'image', (node) => {
      images.push(node);
    });
    return images;
  }

  /**
   * Find all HTML nodes (for processing <img> tags, etc.)
   * @param {Object} tree - AST tree
   * @returns {Array} Array of HTML nodes
   */
  static findHtmlNodes(tree) {
    const htmlNodes = [];
    visit(tree, 'html', (node) => {
      htmlNodes.push(node);
    });
    return htmlNodes;
  }

  /**
   * Create a JSX element node
   * @param {string} name - Component name
   * @param {Object} attributes - JSX attributes
   * @param {Array} children - Child nodes
   * @returns {Object} JSX element node
   */
  static createJsxElement(name, attributes = {}, children = []) {
    return {
      type: 'mdxJsxFlowElement',
      name,
      attributes: Object.entries(attributes).map(([key, value]) => ({
        type: 'mdxJsxAttribute',
        name: key,
        value: typeof value === 'string' ? value : {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(value),
          data: {
            estree: {
              type: 'Program',
              body: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'Literal',
                  value: value,
                  raw: JSON.stringify(value)
                }
              }]
            }
          }
        }
      })),
      children
    };
  }

  /**
   * Create a JSX expression attribute (for template literals, etc.)
   * @param {string} name - Attribute name
   * @param {string} expression - JavaScript expression
   * @returns {Object} JSX attribute node
   */
  static createJsxExpressionAttribute(name, expression) {
    return {
      type: 'mdxJsxAttribute',
      name,
      value: {
        type: 'mdxJsxAttributeValueExpression',
        value: expression,
        data: {
          estree: {
            type: 'Program',
            body: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'TemplateLiteral',
                quasis: [{
                  type: 'TemplateElement',
                  value: { raw: expression, cooked: expression },
                  tail: true
                }],
                expressions: []
              }
            }]
          }
        }
      }
    };
  }

  /**
   * Replace a node in the AST
   * @param {Object} tree - AST tree
   * @param {Object} oldNode - Node to replace
   * @param {Object} newNode - Replacement node
   */
  static replaceNode(tree, oldNode, newNode) {
    visit(tree, (node, index, parent) => {
      if (node === oldNode && parent && typeof index === 'number') {
        parent.children[index] = newNode;
        return 'skip';
      }
    });
  }

  /**
   * Remove nodes matching a condition
   * @param {Object} tree - AST tree
   * @param {Function} condition - Function that returns true for nodes to remove
   */
  static removeNodes(tree, condition) {
    remove(tree, condition);
  }

  /**
   * Insert import statements at the beginning of the file
   * @param {Object} tree - AST tree
   * @param {Array<string>} importStatements - Array of import statement strings
   */
  static insertImports(tree, importStatements) {
    if (!importStatements || importStatements.length === 0) {
      return;
    }

    const importNodes = importStatements.map(statement => {
      // Parse the import statement to extract component name and path
      const match = statement.match(/import\s+(\w+)\s+from\s+["']([^"']+)["'];?/);
      if (!match) {
        // Fallback for malformed import statements
        return {
          type: 'mdxjsEsm',
          value: statement
        };
      }

      const [, componentName, importPath] = match;
      
      return {
        type: 'mdxjsEsm',
        value: statement,
        data: {
          estree: {
            type: 'Program',
            body: [{
              type: 'ImportDeclaration',
              specifiers: [{
                type: 'ImportDefaultSpecifier',
                local: {
                  type: 'Identifier',
                  name: componentName
                }
              }],
              source: {
                type: 'Literal',
                value: importPath,
                raw: `"${importPath}"`
              }
            }],
            sourceType: 'module'
          }
        }
      };
    });

    // Insert at the beginning of the document
    tree.children.unshift(...importNodes);
  }

  /**
   * Check if a node has specific attributes
   * @param {Object} node - AST node
   * @param {Object} attributes - Attributes to check for
   * @returns {boolean}
   */
  static nodeHasAttributes(node, attributes) {
    if (!node.attributes) return false;
    
    return Object.entries(attributes).every(([key, value]) => {
      const attr = node.attributes.find(a => a.name === key);
      return attr && attr.value === value;
    });
  }

  /**
   * Get text content from a node
   * @param {Object} node - AST node
   * @returns {string}
   */
  static getTextContent(node) {
    if (node.type === 'text') {
      return node.value;
    }
    
    if (node.children) {
      return node.children.map(child => this.getTextContent(child)).join('');
    }
    
    return '';
  }

  /**
   * Clone a node (deep copy)
   * @param {Object} node - Node to clone
   * @returns {Object} Cloned node
   */
  static cloneNode(node) {
    return JSON.parse(JSON.stringify(node));
  }

  /**
   * Check if tree contains nodes of a specific type
   * @param {Object} tree - AST tree
   * @param {string} nodeType - Type to check for
   * @returns {boolean}
   */
  static hasNodeType(tree, nodeType) {
    let found = false;
    visit(tree, nodeType, () => {
      found = true;
      return 'skip';
    });
    return found;
  }

  /**
   * Get parent node of a specific node
   * @param {Object} tree - AST tree
   * @param {Object} targetNode - Node to find parent for
   * @returns {Object|null} Parent node or null
   */
  static getParentNode(tree, targetNode) {
    let parentNode = null;
    
    visit(tree, (node, index, parent) => {
      if (node === targetNode) {
        parentNode = parent;
        return 'skip';
      }
    });
    
    return parentNode;
  }
}