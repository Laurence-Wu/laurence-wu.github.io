#!/usr/bin/env node

/**
 * CLI tool for MD to MDX Compiler
 */

const { Command } = require('commander');
const { MDToMDXCompiler } = require('./md-to-mdx-compiler');
const { loadConfig } = require('./config');
const { logger } = require('./logger');
const { promises: fs } = require('fs');
const path = require('path');

const program = new Command();

program
  .name('md-to-mdx')
  .description('Convert Markdown files to MDX format with enhanced features')
  .version('1.0.0');

// Compile command
program
  .command('compile')
  .description('Compile all .md files to .mdx format')
  .option('-i, --input <dir>', 'Input directory containing .md files', '.')
  .option('-o, --output <dir>', 'Output directory for .mdx files')
  .option('-c, --config <file>', 'Configuration file path')
  .option('--parallel <num>', 'Number of parallel processes', '4')
  .option('--verbose', 'Enable verbose logging')
  .option('--dry-run', 'Show what would be compiled without actually compiling')
  .action(async (options) => {
    try {
      // Set log level
      if (options.verbose) {
        logger.level = 'debug';
      }
      
      logger.info('Starting MD to MDX compilation');
      
      // Load configuration
      const config = await loadConfig({
        contentDir: options.input,
        outputDir: options.output || options.input,
        maxConcurrency: parseInt(options.parallel),
        configFile: options.config
      });
      
      // Create compiler
      const compiler = new MDToMDXCompiler(config);
      
      if (options.dryRun) {
        logger.info('Dry run mode - scanning files only');
        await compiler.initialize();
        const files = await compiler.scanner.scanFiles();
        
        console.log(`\nFound ${files.length} .md files:`);
        files.forEach(file => {
          console.log(`  ${file.filePath} -> ${file.outputPath}`);
        });
        
        compiler.destroy();
        return;
      }
      
      // Compile files
      const result = await compiler.compileAll();
      
      // Display results
      console.log('\n📊 Compilation Results:');
      console.log(`✅ Success: ${result.summary.success} files`);
      console.log(`❌ Errors: ${result.summary.errors} files`);
      console.log(`⚠️  Warnings: ${result.summary.warnings} total`);
      console.log(`⏭️  Skipped: ${result.summary.skipped} files`);
      console.log(`⏱️  Total time: ${result.performance.totalTime}ms`);
      
      if (result.summary.errors > 0) {
        console.log('\n❌ Files with errors:');
        result.files
          .filter(f => f.status === 'error')
          .forEach(f => {
            console.log(`  ${f.file}: ${f.error}`);
          });
      }
      
      compiler.destroy();
      
      // Exit with error code if compilation failed
      if (!result.success) {
        process.exit(1);
      }
      
    } catch (error) {
      logger.error('Compilation failed', { error: error.message });
      process.exit(1);
    }
  });

// Watch command
program
  .command('watch')
  .description('Watch for file changes and compile automatically')
  .option('-i, --input <dir>', 'Input directory to watch', '.')
  .option('-o, --output <dir>', 'Output directory for .mdx files')
  .option('-c, --config <file>', 'Configuration file path')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '300')
  .option('--verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      // Set log level
      if (options.verbose) {
        logger.level = 'debug';
      }
      
      logger.info('Starting file watcher');
      
      // Load configuration
      const config = await loadConfig({
        contentDir: options.input,
        outputDir: options.output || options.input,
        watch: true,
        hotReload: true,
        configFile: options.config,
        debounceDelay: parseInt(options.debounce)
      });
      
      // Create compiler
      const compiler = new MDToMDXCompiler(config);
      
      // Start watching
      const unwatch = await compiler.startWatching();
      
      console.log(`👀 Watching ${options.input} for changes...`);
      console.log('Press Ctrl+C to stop');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n⏹️  Stopping file watcher...');
        unwatch();
        compiler.destroy();
        process.exit(0);
      });
      
      // Keep process alive
      await new Promise(() => {});
      
    } catch (error) {
      logger.error('Watch setup failed', { error: error.message });
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new project with example configuration')
  .option('--framework <name>', 'Target framework (astro, nextjs, vite)', 'astro')
  .option('--typescript', 'Generate TypeScript configuration')
  .action(async (options) => {
    try {
      logger.info('Initializing new MD to MDX project');
      
      const framework = options.framework.toLowerCase();
      const useTypeScript = options.typescript;
      
      // Create directories
      await fs.mkdir('content/blog', { recursive: true });
      await fs.mkdir('src/components', { recursive: true });
      
      // Create example configuration
      let configContent = '';
      let configFile = '';
      
      switch (framework) {
        case 'astro':
          configContent = generateAstroConfig(useTypeScript);
          configFile = useTypeScript ? 'astro.config.ts' : 'astro.config.mjs';
          break;
          
        case 'nextjs':
          configContent = generateNextConfig(useTypeScript);
          configFile = useTypeScript ? 'next.config.ts' : 'next.config.js';
          break;
          
        case 'vite':
          configContent = generateViteConfig(useTypeScript);
          configFile = useTypeScript ? 'vite.config.ts' : 'vite.config.js';
          break;
          
        default:
          throw new Error(`Unsupported framework: ${framework}`);
      }
      
      await fs.writeFile(configFile, configContent);
      
      // Create example content
      const examplePost = generateExamplePost();
      await fs.writeFile('content/blog/example-post.md', examplePost);
      
      // Create example component
      const mermaidComponent = generateMermaidComponent(framework, useTypeScript);
      const componentExt = useTypeScript ? '.tsx' : (framework === 'astro' ? '.astro' : '.jsx');
      await fs.writeFile(`src/components/Mermaid${componentExt}`, mermaidComponent);
      
      // Create package.json scripts
      const packageJsonPath = 'package.json';
      let packageJson = {};
      
      try {
        const existingPackageJson = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(existingPackageJson);
      } catch (error) {
        // File doesn't exist, create new one
        packageJson = {
          name: 'md-to-mdx-project',
          version: '1.0.0',
          scripts: {}
        };
      }
      
      packageJson.scripts = {
        ...packageJson.scripts,
        'compile-md': 'md-to-mdx compile --input ./content --output ./src/content',
        'watch-md': 'md-to-mdx watch --input ./content --output ./src/content'
      };
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      console.log('✅ Project initialized successfully!');
      console.log('\n📁 Created files:');
      console.log(`  ${configFile}`);
      console.log('  content/blog/example-post.md');
      console.log(`  src/components/Mermaid${componentExt}`);
      console.log('  package.json (updated)');
      
      console.log('\n🚀 Next steps:');
      console.log('  1. Install dependencies: npm install @kiro/md-to-mdx');
      console.log('  2. Compile markdown: npm run compile-md');
      console.log('  3. Start development: npm run dev');
      
    } catch (error) {
      logger.error('Initialization failed', { error: error.message });
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show statistics about .md files in the project')
  .option('-i, --input <dir>', 'Input directory to analyze', '.')
  .option('-c, --config <file>', 'Configuration file path')
  .action(async (options) => {
    try {
      logger.info('Analyzing project statistics');
      
      // Load configuration
      const config = await loadConfig({
        contentDir: options.input,
        configFile: options.config
      });
      
      // Create compiler
      const compiler = new MDToMDXCompiler(config);
      await compiler.initialize();
      
      // Scan files
      const files = await compiler.scanner.scanFiles();
      
      // Analyze files
      let totalSize = 0;
      let totalLines = 0;
      const extensions = new Map();
      const processors = new Map();
      
      for (const file of files) {
        totalSize += file.content.length;
        totalLines += file.content.split('\n').length;
        
        const ext = path.extname(file.filePath);
        extensions.set(ext, (extensions.get(ext) || 0) + 1);
        
        // Check for special content
        if (file.content.includes('```mermaid')) {
          processors.set('mermaid', (processors.get('mermaid') || 0) + 1);
        }
        if (file.content.includes('$') && file.content.match(/\$[^$]+\$/)) {
          processors.set('math', (processors.get('math') || 0) + 1);
        }
        if (file.content.includes('|') && file.content.includes('---')) {
          processors.set('tables', (processors.get('tables') || 0) + 1);
        }
      }
      
      // Display statistics
      console.log('\n📊 Project Statistics:');
      console.log(`📁 Total files: ${files.length}`);
      console.log(`📏 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`📄 Total lines: ${totalLines.toLocaleString()}`);
      console.log(`📊 Average file size: ${(totalSize / files.length / 1024).toFixed(2)} KB`);
      
      console.log('\n📋 File Extensions:');
      for (const [ext, count] of extensions.entries()) {
        console.log(`  ${ext}: ${count} files`);
      }
      
      console.log('\n🔧 Content Features:');
      for (const [processor, count] of processors.entries()) {
        console.log(`  ${processor}: ${count} files`);
      }
      
      compiler.destroy();
      
    } catch (error) {
      logger.error('Statistics analysis failed', { error: error.message });
      process.exit(1);
    }
  });

// Helper functions for generating configurations
function generateAstroConfig(useTypeScript) {
  return `import { defineConfig } from 'astro/config';
import { createMDToMDXPlugin } from '@kiro/md-to-mdx';

export default defineConfig({
  integrations: [
    createMDToMDXPlugin({
      contentDir: 'src/content',
      processors: {
        mermaid: { enabled: true },
        math: { enabled: true },
        tables: { enabled: true },
        images: { enabled: true }
      }
    })
  ]
});`;
}

function generateNextConfig(useTypeScript) {
  return `const { createMDToMDXPlugin } = require('@kiro/md-to-mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      createMDToMDXPlugin({
        contentDir: './content',
        outputDir: './src/content'
      })
    );
    return config;
  }
};

module.exports = nextConfig;`;
}

function generateViteConfig(useTypeScript) {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createMDToMDXPlugin } from '@kiro/md-to-mdx';

export default defineConfig({
  plugins: [
    react(),
    createMDToMDXPlugin({
      contentDir: './content',
      outputDir: './src/content'
    })
  ]
});`;
}

function generateExamplePost() {
  return `---
title: "Welcome to MD to MDX"
description: "An example post showing all the features"
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ["markdown", "mdx", "example"]
---

# Welcome to MD to MDX

This is an example post that demonstrates all the features of the MD to MDX compiler.

## Standard Markdown

All standard Markdown elements work perfectly:

- **Bold text** and *italic text*
- [Links](https://example.com)
- \`inline code\`
- > Blockquotes

### Code Blocks

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

## Mermaid Diagrams

Interactive diagrams with zoom and fullscreen:

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Check docs]
    C --> E[Keep coding]
    D --> E
\`\`\`

## Math Expressions

Inline math: $E = mc^2$

Display math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Mermaid | ✅ | Interactive |
| Math | ✅ | LaTeX support |
| Tables | ✅ | Responsive |

Enjoy writing in Markdown with enhanced MDX features!`;
}

function generateMermaidComponent(framework, useTypeScript) {
  if (framework === 'astro') {
    return `---
export interface Props {
  code: string;
  title?: string;
}

const { code, title } = Astro.props;
---

<div class="mermaid-container">
  {title && <h3 class="mermaid-title">{title}</h3>}
  <div class="mermaid-diagram">
    <pre class="mermaid">{code}</pre>
  </div>
</div>

<script>
  import mermaid from 'mermaid';
  mermaid.initialize({ startOnLoad: true });
</script>

<style>
  .mermaid-container {
    margin: 1rem 0;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .mermaid-diagram {
    padding: 1rem;
    text-align: center;
  }
</style>`;
  } else {
    const props = useTypeScript ? 
      'interface MermaidProps {\n  code: string;\n  title?: string;\n}\n\nconst Mermaid: React.FC<MermaidProps> = ({ code, title })' :
      'const Mermaid = ({ code, title })';
    
    return `import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

${props} => {
  const diagramRef = useRef(null);

  useEffect(() => {
    if (diagramRef.current) {
      mermaid.initialize({ startOnLoad: false });
      mermaid.render('mermaid-' + Date.now(), code).then(({ svg }) => {
        diagramRef.current.innerHTML = svg;
      });
    }
  }, [code]);

  return (
    <div className="mermaid-container">
      {title && <h3 className="mermaid-title">{title}</h3>}
      <div ref={diagramRef} className="mermaid-diagram" />
    </div>
  );
};

export default Mermaid;`;
  }
}

if (require.main === module) {
  program.parse();
}

module.exports = { program };