// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

// Import MD to MDX compilation plugin
import { createMDToMDXPlugin } from './src/build/md-to-mdx-plugin.js';

// Import Typora-compatible remark plugins
import { 
  remarkTyporaMermaid, 
  remarkTyporaImages, 
  remarkTyporaExtensions 
} from './src/plugins/remark-typora/index.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://laurence-wu.github.io', // Your GitHub Pages root domain
  base: '/',
  outDir: './docs',
  
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // Keep your existing styles
    }),
    mdx({
      remarkPlugins: [
        remarkGfm,        // GitHub Flavored Markdown
        remarkMath,       // Math notation support
        // Typora-compatible plugins (order matters)
        [remarkTyporaMermaid, { 
          componentPath: '../../components/Mermaid.astro',
          componentName: 'Mermaid',
          preserveCodeBlock: false,
          autoImport: true
        }],
        [remarkTyporaImages, { 
          contentDir: 'src/content/blog',
          preserveZoom: true,
          createAssetFolders: false
        }],
        [remarkTyporaExtensions, {
          enableHighlight: true,
          enableUnderline: true,
          enableTaskLists: true,
          enableFootnotes: true,
          enableMathBlocks: true,
          enableCodeAttributes: true,
          highlightClassName: 'typora-highlight'
        }]
      ],
      rehypePlugins: [
        rehypeKatex,      // LaTeX math rendering
      ],
      extendMarkdownConfig: false,
      gfm: true
    }),
    sitemap()
  ],
  
  markdown: {
    remarkPlugins: [
      remarkGfm,          // GitHub Flavored Markdown (tables, strikethrough, etc.)
      remarkMath,         // Math notation parsing
      // Typora-compatible plugins (same configuration as MDX)
      [remarkTyporaMermaid, { 
        componentPath: '../../components/Mermaid.astro',
        componentName: 'Mermaid',
        preserveCodeBlock: false,
        autoImport: true
      }],
      [remarkTyporaImages, { 
        contentDir: 'src/content/blog',
        preserveZoom: true,
        createAssetFolders: false
      }],
      [remarkTyporaExtensions, {
        enableHighlight: true,
        enableUnderline: true,
        enableTaskLists: true,
        enableFootnotes: true,
        enableMathBlocks: true,
        enableCodeAttributes: true,
        highlightClassName: 'typora-highlight'
      }]
    ],
    rehypePlugins: [
      rehypeKatex,        // LaTeX math rendering with KaTeX
    ],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  
  vite: {
    plugins: [
      // Add MD to MDX compilation plugin
      createMDToMDXPlugin({
        contentDir: 'src/content',
        outputDir: 'src/content',
        processors: {
          mermaid: {
            enabled: true,
            componentPath: '../../components/Mermaid.astro'
          },
          math: {
            enabled: true
          },
          tables: {
            enabled: true
          }
        }
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/global.css";`
        }
      }
    }
  }
});
