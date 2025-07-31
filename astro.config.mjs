// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

// Import MD to MDX compilation plugin with error handling
let createMDToMDXPlugin = null;
try {
  const plugin = await import('./src/build/md-to-mdx-plugin.js');
  createMDToMDXPlugin = plugin.createMDToMDXPlugin;
  console.log('[Astro Config] MD to MDX plugin loaded successfully');
} catch (error) {
  console.warn('[Astro Config] Failed to load MD to MDX plugin, continuing without it:', error.message);
}

// Import Typora-compatible remark plugins with error handling
let remarkTyporaMermaid = null;
let remarkTyporaImages = null;
let remarkTyporaExtensions = null;

try {
  const typoraPlugins = await import('./src/plugins/remark-typora/index.js');
  remarkTyporaMermaid = typoraPlugins.remarkTyporaMermaid;
  remarkTyporaImages = typoraPlugins.remarkTyporaImages;
  remarkTyporaExtensions = typoraPlugins.remarkTyporaExtensions;
  console.log('[Astro Config] Typora plugins loaded successfully');
} catch (error) {
  console.warn('[Astro Config] Failed to load Typora plugins, using basic configuration:', error.message);
}

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
        // Typora-compatible plugins (order matters) - only if available
        ...(remarkTyporaMermaid ? [[remarkTyporaMermaid, { 
          componentPath: '../../components/Mermaid.astro',
          componentName: 'Mermaid',
          preserveCodeBlock: false,
          autoImport: true
        }]] : []),
        ...(remarkTyporaImages ? [[remarkTyporaImages, { 
          contentDir: 'src/content/blog',
          preserveZoom: true,
          createAssetFolders: false
        }]] : []),
        ...(remarkTyporaExtensions ? [[remarkTyporaExtensions, {
          enableHighlight: true,
          enableUnderline: true,
          enableTaskLists: true,
          enableFootnotes: true,
          enableMathBlocks: true,
          enableCodeAttributes: true,
          highlightClassName: 'typora-highlight'
        }]] : [])
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
      // Typora-compatible plugins (same configuration as MDX) - only if available
      ...(remarkTyporaMermaid ? [[remarkTyporaMermaid, { 
        componentPath: '../../components/Mermaid.astro',
        componentName: 'Mermaid',
        preserveCodeBlock: false,
        autoImport: true
      }]] : []),
      ...(remarkTyporaImages ? [[remarkTyporaImages, { 
        contentDir: 'src/content/blog',
        preserveZoom: true,
        createAssetFolders: false
      }]] : []),
      ...(remarkTyporaExtensions ? [[remarkTyporaExtensions, {
        enableHighlight: true,
        enableUnderline: true,
        enableTaskLists: true,
        enableFootnotes: true,
        enableMathBlocks: true,
        enableCodeAttributes: true,
        highlightClassName: 'typora-highlight'
      }]] : [])
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
      // Add MD to MDX compilation plugin if available
      ...(createMDToMDXPlugin ? [createMDToMDXPlugin({
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
      })] : [])
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
