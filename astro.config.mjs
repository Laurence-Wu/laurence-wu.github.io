// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

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
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/global.css";`
        }
      }
    }
  }
});
