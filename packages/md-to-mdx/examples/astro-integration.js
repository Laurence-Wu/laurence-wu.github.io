/**
 * Astro integration example for MD to MDX Compiler
 */

// astro.config.mjs
export const astroConfig = `
import { defineConfig } from 'astro/config';
import { createMDToMDXPlugin } from '@kiro/md-to-mdx';

export default defineConfig({
  integrations: [
    createMDToMDXPlugin({
      // Input directory containing .md files
      contentDir: 'src/content',
      
      // Output directory for .mdx files (usually same as input)
      outputDir: 'src/content',
      
      // File patterns to include/exclude
      include: ['**/*.md'],
      exclude: ['**/node_modules/**', '**/.git/**', '**/README.md'],
      
      // Processor configuration
      processors: {
        // Standard Markdown elements (always enabled)
        standard: {
          enabled: true,
          preserveAllElements: true
        },
        
        // Mermaid diagrams
        mermaid: {
          enabled: true,
          componentPath: '../../components/Mermaid.astro',
          validateSyntax: true
        },
        
        // Math expressions
        math: {
          enabled: true,
          inlineDelimiters: ['$', '$'],
          displayDelimiters: ['$$', '$$'],
          validateLatex: true
        },
        
        // Enhanced tables
        tables: {
          enabled: true,
          addResponsiveClasses: true,
          enhancedStyling: true
        },
        
        // Image processing
        images: {
          enabled: true,
          autoDetect: true,
          optimizeImages: true
        }
      },
      
      // Performance settings
      maxConcurrency: 4,
      batchSize: 10,
      
      // Development settings
      watch: true,
      hotReload: true,
      
      // Logging
      debug: false,
      logLevel: 'info'
    })
  ],
  
  // Ensure MDX files are processed by Astro
  markdown: {
    // Your existing markdown config
  }
});
`;

// Example Mermaid component (Mermaid.astro)
export const mermaidComponent = `
---
// Mermaid.astro
export interface Props {
  code: string;
  title?: string;
}

const { code, title } = Astro.props;
---

<div class="mermaid-container">
  {title && <h3 class="mermaid-title">{title}</h3>}
  <div class="mermaid-diagram" data-mermaid={code}>
    <pre class="mermaid">{code}</pre>
  </div>
</div>

<script>
  import mermaid from 'mermaid';
  
  // Initialize mermaid
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose'
  });
  
  // Add zoom and fullscreen functionality
  document.addEventListener('DOMContentLoaded', () => {
    const diagrams = document.querySelectorAll('.mermaid-diagram');
    
    diagrams.forEach(diagram => {
      // Add control buttons
      const controls = document.createElement('div');
      controls.className = 'mermaid-controls';
      controls.innerHTML = \`
        <button class="mermaid-zoom-in">🔍+</button>
        <button class="mermaid-zoom-out">🔍-</button>
        <button class="mermaid-reset">↻</button>
        <button class="mermaid-fullscreen">⛶</button>
      \`;
      
      diagram.appendChild(controls);
      
      // Add event listeners
      controls.querySelector('.mermaid-zoom-in').addEventListener('click', () => {
        diagram.style.transform = \`scale(\${parseFloat(diagram.style.transform.replace('scale(', '').replace(')', '') || 1) * 1.2})\`;
      });
      
      controls.querySelector('.mermaid-zoom-out').addEventListener('click', () => {
        diagram.style.transform = \`scale(\${parseFloat(diagram.style.transform.replace('scale(', '').replace(')', '') || 1) / 1.2})\`;
      });
      
      controls.querySelector('.mermaid-reset').addEventListener('click', () => {
        diagram.style.transform = 'scale(1)';
      });
      
      controls.querySelector('.mermaid-fullscreen').addEventListener('click', () => {
        if (diagram.classList.contains('fullscreen')) {
          diagram.classList.remove('fullscreen');
        } else {
          diagram.classList.add('fullscreen');
        }
      });
    });
  });
</script>

<style>
  .mermaid-container {
    margin: 1rem 0;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .mermaid-title {
    background: #f6f8fa;
    padding: 0.5rem 1rem;
    margin: 0;
    border-bottom: 1px solid #e1e5e9;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .mermaid-diagram {
    position: relative;
    padding: 1rem;
    text-align: center;
    background: white;
    transition: transform 0.3s ease;
  }
  
  .mermaid-diagram.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    background: white;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .mermaid-controls {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .mermaid-diagram:hover .mermaid-controls {
    opacity: 1;
  }
  
  .mermaid-controls button {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .mermaid-controls button:hover {
    background: rgba(0, 0, 0, 0.9);
  }
</style>
`;

// Example content structure
export const contentStructure = `
src/
├── content/
│   ├── blog/
│   │   ├── my-post.md          # Source Markdown file
│   │   └── my-post.mdx         # Generated MDX file
│   └── config.ts               # Astro content config
├── components/
│   └── Mermaid.astro          # Mermaid component
└── pages/
    └── blog/
        └── [...slug].astro     # Blog post pages
`;

// Example blog post with all features
export const exampleBlogPost = `
---
title: "My Awesome Blog Post"
description: "A comprehensive example showing all MD to MDX features"
publishDate: 2024-01-15
tags: ["markdown", "mdx", "mermaid", "math"]
---

# My Awesome Blog Post

This post demonstrates all the features of the MD to MDX compiler.

## Standard Markdown

All standard Markdown elements are preserved:

- **Bold text** and *italic text*
- [Links](https://example.com)
- \`inline code\`
- > Blockquotes

### Code Blocks

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Mermaid Diagrams

Interactive diagrams with zoom and fullscreen:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

## Math Expressions

Inline math: $E = mc^2$

Display math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Enhanced Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Mermaid | ✅ | Interactive diagrams |
| Math | ✅ | LaTeX/KaTeX support |
| Tables | ✅ | Responsive styling |
| Images | ✅ | Auto-optimization |

## Images

![Architecture Diagram](./my-post/architecture.png)

The compiler automatically detects and processes images in folders matching the post name.
`;

console.log('Astro Integration Examples:');
console.log('1. Configuration:', astroConfig);
console.log('2. Mermaid Component:', mermaidComponent);
console.log('3. Content Structure:', contentStructure);
console.log('4. Example Blog Post:', exampleBlogPost);