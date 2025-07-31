#!/usr/bin/env node

/**
 * Basic usage example for MD to MDX Compiler
 */

const { MDToMDXCompiler, createCompiler, compileAll } = require('../src/index');

async function basicExample() {
  console.log('🚀 MD to MDX Compiler - Basic Usage Example\n');

  // Example 1: Simple one-shot compilation
  console.log('1. Simple compilation with default settings:');
  try {
    const result = await compileAll({
      contentDir: './content',
      outputDir: './output'
    });
    
    console.log(`✅ Compiled ${result.summary.success} files successfully`);
    console.log(`⚠️  ${result.summary.warnings} warnings`);
    console.log(`❌ ${result.summary.errors} errors`);
    console.log(`⏭️  ${result.summary.skipped} files skipped\n`);
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
  }

  // Example 2: Using compiler instance with custom configuration
  console.log('2. Using compiler instance with custom configuration:');
  const compiler = createCompiler({
    contentDir: './content',
    outputDir: './output',
    processors: {
      mermaid: {
        enabled: true,
        componentPath: './components/CustomMermaid.jsx'
      },
      math: {
        enabled: true,
        inlineDelimiters: ['\\(', '\\)'],
        displayDelimiters: ['\\[', '\\]']
      },
      tables: {
        enabled: true,
        addResponsiveClasses: true
      }
    },
    maxConcurrency: 2,
    debug: true
  });

  try {
    await compiler.initialize();
    const result = await compiler.compileAll();
    
    console.log('📊 Compilation Statistics:');
    console.log(`   Total files: ${result.summary.total}`);
    console.log(`   Successful: ${result.summary.success}`);
    console.log(`   Errors: ${result.summary.errors}`);
    console.log(`   Processing time: ${result.performance.totalTime}ms`);
    console.log(`   Average per file: ${result.performance.averageTime}ms\n`);
    
    // Get detailed stats
    const stats = compiler.getStats();
    console.log('🔍 Detailed Statistics:');
    console.log(`   Files discovered: ${stats.scanner?.fileCount || 0}`);
    console.log(`   Memory usage: ${Math.round(stats.memory?.heapUsed / 1024 / 1024)}MB`);
    
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
  } finally {
    compiler.destroy();
  }

  // Example 3: File watching for development
  console.log('\n3. File watching example (press Ctrl+C to stop):');
  const watchCompiler = createCompiler({
    contentDir: './content',
    outputDir: './output',
    watch: true,
    hotReload: true
  });

  try {
    await watchCompiler.initialize();
    
    console.log('👀 Watching for file changes...');
    const unwatch = await watchCompiler.startWatching();
    
    // Stop watching after 10 seconds for demo purposes
    setTimeout(() => {
      console.log('⏹️  Stopping file watcher...');
      unwatch();
      watchCompiler.destroy();
      console.log('✅ Example completed!');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Watch setup failed:', error.message);
    watchCompiler.destroy();
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

module.exports = { basicExample };