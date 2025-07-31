/**
 * Example of programmatic usage of MD to MDX compiler
 */

import { createAPI, GenericMDToMDXIntegration } from '../md-to-mdx-plugin.js';

// Example 1: Using the Programmatic API
async function example1() {
  console.log('Example 1: Programmatic API');
  
  try {
    // Create and initialize API
    const api = await createAPI({
      contentDir: 'src/content',
      outputDir: 'dist/content',
      processors: {
        standard: { enabled: true },
        mermaid: { enabled: true },
        math: { enabled: true },
        image: { enabled: true },
        tables: { enabled: true }
      }
    });
    
    // Compile all files
    const result = await api.compileAll();
    console.log('Compilation result:', result.summary);
    
    // Get statistics
    const stats = api.getStats();
    console.log('Compiler stats:', stats);
    
    // Cleanup
    api.destroy();
    
  } catch (error) {
    console.error('Compilation failed:', error.message);
  }
}

// Example 2: Using Generic Integration
async function example2() {
  console.log('Example 2: Generic Integration');
  
  const integration = new GenericMDToMDXIntegration({
    contentDir: 'docs',
    outputDir: 'dist/docs'
  });
  
  try {
    // Initialize
    await integration.initialize();
    
    // Compile once
    const result = await integration.compile();
    console.log('Compilation completed:', result.success);
    
    // Or start watching for changes
    const unwatch = await integration.watch();
    console.log('Watching for changes...');
    
    // Stop watching after 30 seconds (for demo)
    setTimeout(() => {
      unwatch();
      integration.destroy();
      console.log('Stopped watching');
    }, 30000);
    
  } catch (error) {
    console.error('Integration failed:', error.message);
    integration.destroy();
  }
}

// Example 3: Custom Build Script
async function customBuildScript() {
  console.log('Example 3: Custom Build Script');
  
  const { createCompiler } = await import('../md-to-mdx-compiler.js');
  
  const compiler = createCompiler({
    contentDir: process.argv[2] || 'content',
    outputDir: process.argv[3] || 'output',
    processors: {
      standard: { enabled: true },
      mermaid: { 
        enabled: true,
        componentPath: './components/Mermaid.jsx'
      }
    }
  });
  
  try {
    await compiler.initialize();
    
    console.log('Starting compilation...');
    const result = await compiler.compileAll();
    
    if (result.success) {
      console.log(`✅ Successfully compiled ${result.summary.success} files`);
      if (result.summary.warnings > 0) {
        console.log(`⚠️  ${result.summary.warnings} warnings`);
      }
    } else {
      console.log(`❌ Compilation failed with ${result.summary.errors} errors`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Build script failed:', error.message);
    process.exit(1);
  } finally {
    compiler.destroy();
  }
}

// Example 4: Express.js Integration
async function expressExample() {
  console.log('Example 4: Express.js Integration');
  
  const express = require('express');
  const { createExpressMiddleware } = await import('../md-to-mdx-plugin.js');
  
  const app = express();
  
  // Add MD to MDX middleware
  app.use(createExpressMiddleware({
    contentDir: 'content',
    outputDir: 'public/content'
  }));
  
  // Serve static files
  app.use(express.static('public'));
  
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('MD files will be automatically compiled to MDX');
  });
}

// Run examples based on command line argument
const example = process.argv[2];

switch (example) {
  case '1':
    example1();
    break;
  case '2':
    example2();
    break;
  case '3':
    customBuildScript();
    break;
  case '4':
    expressExample();
    break;
  default:
    console.log('Usage: node programmatic-usage.js [1|2|3|4]');
    console.log('1: Programmatic API');
    console.log('2: Generic Integration');
    console.log('3: Custom Build Script');
    console.log('4: Express.js Integration');
}