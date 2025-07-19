/**
 * Remark Typora Mermaid Plugin
 * Transforms ```mermaid code blocks into Mermaid component JSX elements
 */

import { visit } from 'unist-util-visit';
import { AstUtils } from '../utils/ast-utils.js';
import { AutoImportManager } from '../utils/auto-import-manager.js';

/**
 * Default options for the mermaid plugin
 */
const defaultOptions = {
  componentPath: '../../components/Mermaid.astro',
  componentName: 'Mermaid',
  preserveCodeBlock: false,
  autoImport: true,
  wrapInFigure: false
};

/**
 * Validate mermaid syntax (basic validation)
 * @param {string} code - Mermaid code to validate
 * @returns {Object} Validation result
 */
function validateMermaidSyntax(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Empty or invalid mermaid code' };
  }

  const trimmedCode = code.trim();
  if (trimmedCode.length === 0) {
    return { valid: false, error: 'Empty mermaid code block' };
  }

  // Basic syntax validation - check for common mermaid diagram types
  const mermaidKeywords = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
    'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline'
  ];

  const hasValidKeyword = mermaidKeywords.some(keyword => 
    trimmedCode.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasValidKeyword) {
    return { 
      valid: false, 
      error: 'Mermaid code does not contain recognized diagram type keywords' 
    };
  }

  return { valid: true };
}

/**
 * Create error element for invalid mermaid syntax
 * @param {string} originalCode - Original mermaid code
 * @param {string} error - Error message
 * @returns {Object} Error element node
 */
function createMermaidErrorElement(originalCode, error) {
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['mermaid-error'],
      style: 'border: 1px solid #ff6b6b; background: #ffe0e0; padding: 1rem; border-radius: 4px; margin: 1rem 0;'
    },
    children: [
      {
        type: 'element',
        tagName: 'strong',
        children: [{ type: 'text', value: 'Mermaid Error: ' }]
      },
      { type: 'text', value: error },
      {
        type: 'element',
        tagName: 'details',
        properties: { style: 'margin-top: 0.5rem;' },
        children: [
          {
            type: 'element',
            tagName: 'summary',
            children: [{ type: 'text', value: 'Show original code' }]
          },
          {
            type: 'element',
            tagName: 'pre',
            properties: { style: 'background: #f5f5f5; padding: 0.5rem; margin-top: 0.5rem; overflow-x: auto;' },
            children: [
              {
                type: 'element',
                tagName: 'code',
                children: [{ type: 'text', value: originalCode }]
              }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Remark plugin to transform mermaid code blocks
 * @param {Object} options - Plugin options
 * @returns {Function} Remark plugin function
 */
export function remarkTyporaMermaid(options = {}) {
  const config = { ...defaultOptions, ...options };
  
  return function transformer(tree, file) {
    const importManager = new AutoImportManager();
    let hasMermaidBlocks = false;
    let processedBlocks = 0;
    let errorBlocks = 0;
    const errors = [];

    // Find all mermaid code blocks
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        hasMermaidBlocks = true;
        processedBlocks++;
        
        try {
          // Validate mermaid syntax
          const validation = validateMermaidSyntax(node.value);
          
          if (!validation.valid) {
            errorBlocks++;
            errors.push({
              block: processedBlocks,
              error: validation.error,
              code: node.value
            });

            // Create error element instead of mermaid component
            const errorElement = createMermaidErrorElement(node.value, validation.error);
            
            if (parent && typeof index === 'number') {
              parent.children[index] = errorElement;
            }
            
            // Log warning to file
            if (file.message) {
              file.message(`Mermaid syntax error in block ${processedBlocks}: ${validation.error}`);
            }
            
            return;
          }

          // Detect if this is an MDX file or regular markdown file
          const isMdxFile = file.path && file.path.endsWith('.mdx');
          
          let mermaidElement;
          
          if (isMdxFile) {
            // Create JSX element for MDX files
            mermaidElement = {
              type: 'mdxJsxFlowElement',
              name: config.componentName,
              attributes: [
                {
                  type: 'mdxJsxAttribute',
                  name: 'code',
                  value: {
                    type: 'mdxJsxAttributeValueExpression',
                    value: `\`${node.value.replace(/`/g, '\\`')}\``,
                    data: {
                      estree: {
                        type: 'Program',
                        body: [{
                          type: 'ExpressionStatement',
                          expression: {
                            type: 'TemplateLiteral',
                            quasis: [{
                              type: 'TemplateElement',
                              value: { 
                                raw: node.value.replace(/`/g, '\\`'), 
                                cooked: node.value 
                              },
                              tail: true
                            }],
                            expressions: []
                          }
                        }]
                      }
                    }
                  }
                }
              ],
              children: []
            };
          } else {
            // Create HTML string for regular markdown files
            const escapedCode = node.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const htmlString = `<figure class="mermaid-diagram">
  <div class="mermaid-container">
    Loading diagram...
  </div>
  <details class="mermaid-source">
    <summary>Source</summary>
    <pre class="mermaid-code"><code>${escapedCode}</code></pre>
  </details>
</figure>`;
            
            mermaidElement = {
              type: 'html',
              value: htmlString
            };
          }

          // Wrap in figure if requested
          let elementToInsert = mermaidElement;
          if (config.wrapInFigure) {
            elementToInsert = {
              type: 'mdxJsxFlowElement',
              name: 'figure',
              attributes: [
                {
                  type: 'mdxJsxAttribute',
                  name: 'className',
                  value: 'mermaid-figure'
                }
              ],
              children: [mermaidElement]
            };
          }

          // Replace the code block with the JSX element
          if (parent && typeof index === 'number') {
            parent.children[index] = elementToInsert;
          }

          // Mark component as used for import management (only for MDX files)
          if (config.autoImport && isMdxFile) {
            importManager.addImport(config.componentName, config.componentPath);
            importManager.markAsUsed(config.componentName);
          }
          
        } catch (error) {
          errorBlocks++;
          errors.push({
            block: processedBlocks,
            error: `Processing error: ${error.message}`,
            code: node.value
          });

          // Create error element
          const errorElement = createMermaidErrorElement(
            node.value, 
            `Processing error: ${error.message}`
          );
          
          if (parent && typeof index === 'number') {
            parent.children[index] = errorElement;
          }

          // Log error to file
          if (file.message) {
            file.message(`Mermaid processing error in block ${processedBlocks}: ${error.message}`);
          }
        }
      }
    });

    // Add imports if any valid mermaid blocks were found (only for MDX files)
    const isMdxFile = file.path && file.path.endsWith('.mdx');
    if (hasMermaidBlocks && config.autoImport && isMdxFile && (processedBlocks - errorBlocks) > 0) {
      const importStatements = importManager.generateImportStatements();
      AstUtils.insertImports(tree, importStatements);
    }

    // Store processing info in file data for debugging
    if (!file.data) file.data = {};
    file.data.typoraMermaid = {
      hasMermaidBlocks,
      processedBlocks,
      errorBlocks,
      validBlocks: processedBlocks - errorBlocks,
      errors,
      importStats: importManager.getStats()
    };
  };
}