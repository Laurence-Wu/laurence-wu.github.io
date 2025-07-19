/**
 * Remark Typora Images Plugin
 * Resolves image paths using Typora's asset management conventions
 */

import { visit } from 'unist-util-visit';
import { AstUtils } from '../utils/ast-utils.js';
import { PathResolver } from '../utils/path-resolver.js';

/**
 * Default options for the images plugin
 */
const defaultOptions = {
  contentDir: 'src/content/blog',
  preserveZoom: true,
  createAssetFolders: false
};

/**
 * Remark plugin to resolve image paths using Typora conventions
 * @param {Object} options - Plugin options
 * @returns {Function} Remark plugin function
 */
export function remarkTyporaImages(options = {}) {
  const config = { ...defaultOptions, ...options };
  const pathResolver = new PathResolver(config);
  
  return function transformer(tree, file) {
    // Get processing context from file path
    const context = pathResolver.getProcessingContext(file.path || 'unknown.md');
    
    let processedImages = 0;
    const resolutionResults = [];

    // Process markdown image nodes
    visit(tree, 'image', (node) => {
      const resolution = pathResolver.resolveImagePath(node.url, context);
      
      // Update the image URL if resolution was successful
      if (resolution.exists || !resolution.fallbackUsed) {
        node.url = resolution.resolvedSrc;
        processedImages++;
      }
      
      resolutionResults.push(resolution);
    });

    // Process HTML img tags
    visit(tree, 'html', (node) => {
      if (node.value && node.value.includes('<img')) {
        const imageSrc = pathResolver.extractImageSrc(node.value);
        
        if (imageSrc) {
          const resolution = pathResolver.resolveImagePath(imageSrc, context);
          const zoomInfo = pathResolver.parseTyporaZoom(node.value);
          
          // Update the HTML if resolution was successful
          if (resolution.exists || !resolution.fallbackUsed) {
            node.value = node.value.replace(
              /src=["']([^"']+)["']/i,
              `src="${resolution.resolvedSrc}"`
            );
            processedImages++;
          }
          
          resolutionResults.push({
            ...resolution,
            ...zoomInfo
          });
        }
      }
    });

    // Store processing info in file data
    if (!file.data) file.data = {};
    file.data.typoraImages = {
      processedImages,
      resolutionResults,
      context
    };
  };
}