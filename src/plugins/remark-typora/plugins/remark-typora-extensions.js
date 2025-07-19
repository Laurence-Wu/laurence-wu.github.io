/**
 * Remark Typora Extensions Plugin
 * Handles Typora-specific markdown extensions like highlights, underlines, etc.
 */

import { visit } from 'unist-util-visit';
import { AstUtils } from '../utils/ast-utils.js';

/**
 * Default options for the extensions plugin
 */
const defaultOptions = {
  enableHighlight: true,
  enableUnderline: true,
  enableTaskLists: true,
  enableFootnotes: true,
  enableMathBlocks: true,
  enableCodeAttributes: true,
  highlightClassName: 'typora-highlight'
};

/**
 * Remark plugin to handle Typora-specific extensions
 * @param {Object} options - Plugin options
 * @returns {Function} Remark plugin function
 */
export function remarkTyporaExtensions(options = {}) {
  const config = { ...defaultOptions, ...options };
  
  return function transformer(tree, file) {
    let processedFeatures = {
      highlights: 0,
      underlines: 0,
      taskLists: 0,
      footnotes: 0,
      mathBlocks: 0,
      codeAttributes: 0
    };

    // Process text nodes for highlight syntax ==text==
    if (config.enableHighlight) {
      visit(tree, 'text', (node, index, parent) => {
        if (node.value && node.value.includes('==')) {
          const highlightRegex = /==(.*?)==/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = highlightRegex.exec(node.value)) !== null) {
            // Add text before highlight
            if (match.index > lastIndex) {
              parts.push({
                type: 'text',
                value: node.value.slice(lastIndex, match.index)
              });
            }

            // Add highlight element
            parts.push({
              type: 'html',
              value: `<mark class="${config.highlightClassName}">${match[1]}</mark>`
            });

            lastIndex = match.index + match[0].length;
            processedFeatures.highlights++;
          }

          // Add remaining text
          if (lastIndex < node.value.length) {
            parts.push({
              type: 'text',
              value: node.value.slice(lastIndex)
            });
          }

          // Replace the node with the processed parts
          if (parts.length > 1 && parent && typeof index === 'number') {
            parent.children.splice(index, 1, ...parts);
          }
        }
      });
    }

    // Preserve HTML underline tags (they should pass through as-is)
    if (config.enableUnderline) {
      visit(tree, 'html', (node) => {
        if (node.value && (node.value.includes('<u>') || node.value.includes('</u>'))) {
          processedFeatures.underlines++;
          // HTML nodes are preserved by default, just count them
        }
      });
    }

    // Enhanced task list processing
    if (config.enableTaskLists) {
      visit(tree, 'listItem', (node) => {
        if (node.checked !== null && node.checked !== undefined) {
          processedFeatures.taskLists++;
          // Task lists are handled by remark-gfm, just count them
        }
      });
    }

    // Basic footnote detection (full implementation would be more complex)
    if (config.enableFootnotes) {
      visit(tree, 'text', (node) => {
        if (node.value && /\[\^[^\]]+\]/.test(node.value)) {
          processedFeatures.footnotes++;
        }
      });
    }

    // Math block detection
    if (config.enableMathBlocks) {
      visit(tree, 'math', (node) => {
        processedFeatures.mathBlocks++;
      });
    }

    // Code fence attribute detection
    if (config.enableCodeAttributes) {
      visit(tree, 'code', (node) => {
        if (node.meta && node.meta.includes('{')) {
          processedFeatures.codeAttributes++;
        }
      });
    }

    // Store processing info in file data
    if (!file.data) file.data = {};
    file.data.typoraExtensions = {
      processedFeatures,
      config: {
        enabledFeatures: Object.keys(config).filter(key => 
          key.startsWith('enable') && config[key]
        )
      }
    };
  };
}