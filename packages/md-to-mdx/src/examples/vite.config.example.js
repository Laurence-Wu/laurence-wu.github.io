/**
 * Example Vite configuration with MD to MDX integration
 */

import { defineConfig } from 'vite';
import { createViteMDToMDXPlugin } from '../md-to-mdx-plugin.js';

export default defineConfig({
  plugins: [
    // Add MD to MDX plugin
    createViteMDToMDXPlugin({
      contentDir: 'src/content',
      outputDir: 'src/content',
      
      processors: {
        standard: { enabled: true },
        mermaid: { 
          enabled: true,
          componentPath: './components/Mermaid.jsx',
          componentName: 'Mermaid'
        },
        math: { enabled: true },
        image: { enabled: true },
        tables: { enabled: true }
      }
    })
  ],
  
  // Watch .md files for changes
  server: {
    watch: {
      include: ['src/**/*.md']
    }
  }
});