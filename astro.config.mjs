// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit'; // used by remarkMermaid

/**
 * remarkMermaid — runs at the remark (mdast) stage, BEFORE Shiki highlights code blocks.
 * Transforms ```mermaid code nodes into raw HTML so Shiki never touches them.
 */
function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid') return;
      const diagram = node.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      parent.children[index] = {
        type: 'html',
        value: `<div class="mermaid-wrapper"><pre class="mermaid">${diagram}</pre></div>`,
      };
    });
  };
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
        remarkMermaid,    // Mermaid blocks → raw HTML before Shiki runs
      ],
      rehypePlugins: [
        rehypeKatex,      // LaTeX math rendering
      ],
      extendMarkdownConfig: false,
      gfm: true
    }),
    sitemap(),
  ],
  
  markdown: {
    remarkPlugins: [
      remarkGfm,          // GitHub Flavored Markdown (tables, strikethrough, etc.)
      remarkMath,         // Math notation parsing
      remarkMermaid,      // Mermaid blocks → raw HTML before Shiki runs
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
    plugins: [],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/global.css";`
        }
      }
    }
  }
});
