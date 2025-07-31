/**
 * Example Astro configuration with MD to MDX integration
 */

import { defineConfig } from 'astro/config';
import mdToMdx from '../astro-integration.js';

export default defineConfig({
  integrations: [
    // Add MD to MDX integration
    mdToMdx({
      // Content directory containing .md files
      contentDir: 'src/content',
      
      // Output directory for .mdx files
      outputDir: 'src/content',
      
      // Processor configurations
      processors: {
        // Standard Markdown processor (always enabled)
        standard: {
          enabled: true,
          preserveAllElements: true,
          validateSyntax: true
        },
        
        // Mermaid diagram processor
        mermaid: {
          enabled: true,
          componentPath: '../../components/Mermaid.astro',
          componentName: 'Mermaid',
          validateSyntax: true
        },
        
        // Math expression processor
        math: {
          enabled: true,
          inlineDelimiters: ['$', '$'],
          displayDelimiters: ['$$', '$$'],
          validateLatex: true
        },
        
        // Image processor
        image: {
          enabled: true,
          imageFolderPattern: '{filename}',
          validateImageExists: true,
          warnMissingImages: true
        },
        
        // Table processor
        tables: {
          enabled: true,
          addResponsiveClasses: true,
          enhancedStyling: true
        }
      },
      
      // Development options
      watch: true,
      hotReload: true,
      
      // Build options
      continueOnError: true,
      logErrors: true
    })
  ]
});