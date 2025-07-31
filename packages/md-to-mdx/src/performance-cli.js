#!/usr/bin/env node

/**
 * Performance CLI Tool for MD to MDX Compiler
 */

const { program } = require('commander');
const { promises: fs } = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { MDToMDXCompiler } = require('./md-to-mdx-compiler');
const { performanceMonitor, contentHashCache, memoryOptimizer } = require('./performance');

/**
 * Benchmark compilation performance
 */
async function benchmarkCompilation(options) {
  console.log('🚀 Starting MD to MDX compilation benchmark...\n');
  
  const compiler = new MDToMDXCompiler({
    contentDir: options.contentDir,
    performanceMonitoring: true,
    maxConcurrency: options.concurrency || 4
  });
  
  try {
    // Warm up
    console.log('⏳ Warming up...');
    await compiler.compileAll();
    
    // Clear performance data
    performanceMonitor.clear();
    contentHashCache.clear();
    
    // Run benchmark
    console.log(`🏃 Running benchmark with ${options.iterations} iterations...\n`);
    
    const results = [];
    const startTime = performance.now();
    
    for (let i = 0; i < options.iterations; i++) {
      const iterationStart = performance.now();
      const result = await compiler.compileAll();
      const iterationEnd = performance.now();
      
      results.push({
        iteration: i + 1,
        duration: iterationEnd - iterationStart,
        success: result.success,
        filesProcessed: result.summary.success,
        filesSkipped: result.summary.skipped,
        errors: result.summary.errors
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Completed ${i + 1}/${options.iterations} iterations`);
      }
    }
    
    const totalTime = performance.now() - startTime;
    
    // Generate report
    generateBenchmarkReport(results, totalTime, options);
    
  } finally {
    compiler.destroy();
  }
}

/**
 * Generate benchmark report
 */
function generateBenchmarkReport(results, totalTime, options) {
  const durations = results.map(r => r.duration);
  const successfulRuns = results.filter(r => r.success);
  
  const stats = {
    total: {
      iterations: results.length,
      duration: totalTime,
      avgDuration: totalTime / results.length
    },
    compilation: {
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
    },
    success: {
      rate: (successfulRuns.length / results.length) * 100,
      count: successfulRuns.length
    },
    files: {
      totalProcessed: results.reduce((sum, r) => sum + r.filesProcessed, 0),
      totalSkipped: results.reduce((sum, r) => sum + r.filesSkipped, 0),
      avgProcessed: results.reduce((sum, r) => sum + r.filesProcessed, 0) / results.length
    }
  };
  
  console.log('\n📊 Benchmark Results');
  console.log('='.repeat(50));
  console.log(`Total iterations: ${stats.total.iterations}`);
  console.log(`Total time: ${stats.total.duration.toFixed(2)}ms`);
  console.log(`Average time per iteration: ${stats.total.avgDuration.toFixed(2)}ms`);
  console.log(`Success rate: ${stats.success.rate.toFixed(1)}%`);
  console.log('');
  console.log('Compilation Performance:');
  console.log(`  Min: ${stats.compilation.min.toFixed(2)}ms`);
  console.log(`  Max: ${stats.compilation.max.toFixed(2)}ms`);
  console.log(`  Avg: ${stats.compilation.avg.toFixed(2)}ms`);
  console.log(`  Median: ${stats.compilation.median.toFixed(2)}ms`);
  console.log('');
  console.log('File Processing:');
  console.log(`  Total files processed: ${stats.files.totalProcessed}`);
  console.log(`  Total files skipped: ${stats.files.totalSkipped}`);
  console.log(`  Avg files per iteration: ${stats.files.avgProcessed.toFixed(1)}`);
  
  // Performance analysis
  console.log('\n🔍 Performance Analysis');
  console.log('='.repeat(50));
  
  if (stats.compilation.avg < 100) {
    console.log('✅ Excellent performance (< 100ms average)');
  } else if (stats.compilation.avg < 500) {
    console.log('✅ Good performance (< 500ms average)');
  } else if (stats.compilation.avg < 1000) {
    console.log('⚠️  Moderate performance (< 1s average)');
  } else {
    console.log('❌ Poor performance (> 1s average)');
  }
  
  const variability = (stats.compilation.max - stats.compilation.min) / stats.compilation.avg;
  if (variability < 0.2) {
    console.log('✅ Consistent performance (low variability)');
  } else if (variability < 0.5) {
    console.log('⚠️  Moderate variability');
  } else {
    console.log('❌ High variability (inconsistent performance)');
  }
  
  // Save detailed results if requested
  if (options.output) {
    const reportData = {
      timestamp: new Date().toISOString(),
      options,
      stats,
      results,
      performanceData: performanceMonitor.generateReport()
    };
    
    fs.writeFile(options.output, JSON.stringify(reportData, null, 2))
      .then(() => console.log(`\n📄 Detailed report saved to: ${options.output}`))
      .catch(err => console.error(`Failed to save report: ${err.message}`));
  }
}

/**
 * Monitor real-time performance
 */
async function monitorPerformance(options) {
  console.log('📈 Starting real-time performance monitoring...\n');
  
  const compiler = new MDToMDXCompiler({
    contentDir: options.contentDir,
    performanceMonitoring: true,
    watch: true
  });
  
  try {
    await compiler.initialize();
    
    // Start file watching
    const unwatch = await compiler.startWatching();
    
    // Monitor performance metrics
    const monitorInterval = setInterval(() => {
      const stats = compiler.getStats();
      const memoryStats = memoryOptimizer.getMemoryStats();
      const performanceStats = performanceMonitor.getAllStats();
      
      console.clear();
      console.log('📈 MD to MDX Performance Monitor');
      console.log('='.repeat(50));
      console.log(`Time: ${new Date().toLocaleTimeString()}`);
      console.log('');
      
      // Memory usage
      console.log('Memory Usage:');
      console.log(`  RSS: ${(memoryStats.rss / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Used: ${(memoryStats.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Total: ${(memoryStats.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log('');
      
      // File statistics
      if (stats.scanner) {
        console.log('File Statistics:');
        console.log(`  Total files: ${stats.scanner.fileCount}`);
        console.log('');
      }
      
      // Performance operations
      if (Object.keys(performanceStats).length > 0) {
        console.log('Recent Operations:');
        Object.entries(performanceStats).forEach(([name, stat]) => {
          if (stat && stat.count > 0) {
            console.log(`  ${name}: ${stat.count} ops, avg ${stat.duration.avg.toFixed(2)}ms`);
          }
        });
        console.log('');
      }
      
      // Cache statistics
      const cacheStats = contentHashCache.getStats();
      console.log('Cache Statistics:');
      console.log(`  Hash cache size: ${cacheStats.size}/${cacheStats.maxSize}`);
      console.log('');
      
      console.log('Press Ctrl+C to stop monitoring...');
    }, options.interval || 2000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping performance monitor...');
      clearInterval(monitorInterval);
      if (unwatch) unwatch();
      compiler.destroy();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error.message);
    compiler.destroy();
    process.exit(1);
  }
}

/**
 * Analyze existing performance data
 */
async function analyzePerformance(options) {
  console.log('🔍 Analyzing performance data...\n');
  
  try {
    const data = JSON.parse(await fs.readFile(options.file, 'utf-8'));
    
    console.log('📊 Performance Analysis Report');
    console.log('='.repeat(50));
    console.log(`Report generated: ${data.timestamp}`);
    console.log(`Content directory: ${data.options.contentDir}`);
    console.log(`Iterations: ${data.options.iterations}`);
    console.log('');
    
    // Overall statistics
    console.log('Overall Performance:');
    console.log(`  Success rate: ${data.stats.success.rate.toFixed(1)}%`);
    console.log(`  Average compilation time: ${data.stats.compilation.avg.toFixed(2)}ms`);
    console.log(`  Files processed per iteration: ${data.stats.files.avgProcessed.toFixed(1)}`);
    console.log('');
    
    // Performance trends
    if (data.results.length > 1) {
      const firstHalf = data.results.slice(0, Math.floor(data.results.length / 2));
      const secondHalf = data.results.slice(Math.floor(data.results.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.duration, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.duration, 0) / secondHalf.length;
      
      console.log('Performance Trends:');
      console.log(`  First half average: ${firstHalfAvg.toFixed(2)}ms`);
      console.log(`  Second half average: ${secondHalfAvg.toFixed(2)}ms`);
      
      const improvement = ((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100;
      if (improvement > 5) {
        console.log(`  ✅ Performance improved by ${improvement.toFixed(1)}%`);
      } else if (improvement < -5) {
        console.log(`  ❌ Performance degraded by ${Math.abs(improvement).toFixed(1)}%`);
      } else {
        console.log(`  ➡️  Performance remained stable`);
      }
      console.log('');
    }
    
    // Memory analysis
    if (data.performanceData && data.performanceData.memory) {
      console.log('Memory Analysis:');
      const memSnapshots = data.performanceData.memory.snapshots;
      if (memSnapshots.length > 1) {
        const startMem = memSnapshots[0].memory.heapUsed;
        const endMem = memSnapshots[memSnapshots.length - 1].memory.heapUsed;
        const memDelta = endMem - startMem;
        
        console.log(`  Memory delta: ${(memDelta / 1024 / 1024).toFixed(2)} MB`);
        if (memDelta > 50 * 1024 * 1024) { // 50MB
          console.log('  ⚠️  Potential memory leak detected');
        } else {
          console.log('  ✅ Memory usage stable');
        }
      }
      console.log('');
    }
    
    // Recommendations
    console.log('🎯 Recommendations:');
    if (data.stats.compilation.avg > 1000) {
      console.log('  • Consider increasing maxConcurrency for better parallel processing');
    }
    if (data.stats.files.totalSkipped / data.stats.files.totalProcessed < 0.5) {
      console.log('  • Incremental processing is working well');
    } else {
      console.log('  • Consider optimizing content hash cache for better incremental processing');
    }
    if (data.stats.compilation.max / data.stats.compilation.avg > 3) {
      console.log('  • High variability detected, investigate outlier cases');
    }
    
  } catch (error) {
    console.error('❌ Failed to analyze performance data:', error.message);
    process.exit(1);
  }
}

/**
 * Generate test data for benchmarking
 */
async function generateTestData(options) {
  console.log(`📝 Generating ${options.count} test files...`);
  
  const testDir = path.resolve(options.output);
  await fs.mkdir(testDir, { recursive: true });
  
  const templates = [
    {
      name: 'simple',
      content: (i) => `# Simple Test ${i}\n\nThis is a simple test file with basic content.\n\n- Item 1\n- Item 2\n- Item 3`
    },
    {
      name: 'mermaid',
      content: (i) => `# Mermaid Test ${i}\n\n\`\`\`mermaid\ngraph TD\n  A[Start] --> B[Process ${i}]\n  B --> C[End]\n\`\`\``
    },
    {
      name: 'math',
      content: (i) => `# Math Test ${i}\n\nInline math: $x^${i} + y = z$\n\nDisplay math:\n$$\\sum_{i=1}^{${i}} x_i = ${i}$$`
    },
    {
      name: 'table',
      content: (i) => `# Table Test ${i}\n\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data ${i} | Value ${i} | Result ${i} |`
    },
    {
      name: 'large',
      content: (i) => `# Large Test ${i}\n\n${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}\n\n${'## Section '.repeat(10)}`
    }
  ];
  
  for (let i = 0; i < options.count; i++) {
    const template = templates[i % templates.length];
    const fileName = `${template.name}-${i}.md`;
    const filePath = path.join(testDir, fileName);
    const content = template.content(i);
    
    await fs.writeFile(filePath, content);
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${options.count} files`);
    }
  }
  
  console.log(`✅ Generated ${options.count} test files in ${testDir}`);
}

// CLI setup
program
  .name('md-to-mdx-perf')
  .description('Performance monitoring and benchmarking tool for MD to MDX compiler')
  .version('1.0.0');

program
  .command('benchmark')
  .description('Run compilation benchmark')
  .option('-d, --content-dir <dir>', 'Content directory to benchmark', 'src/content')
  .option('-i, --iterations <num>', 'Number of iterations to run', '10')
  .option('-c, --concurrency <num>', 'Max concurrency level', '4')
  .option('-o, --output <file>', 'Output file for detailed results')
  .action(async (options) => {
    options.iterations = parseInt(options.iterations);
    options.concurrency = parseInt(options.concurrency);
    await benchmarkCompilation(options);
  });

program
  .command('monitor')
  .description('Monitor real-time performance')
  .option('-d, --content-dir <dir>', 'Content directory to monitor', 'src/content')
  .option('-i, --interval <ms>', 'Update interval in milliseconds', '2000')
  .action(async (options) => {
    options.interval = parseInt(options.interval);
    await monitorPerformance(options);
  });

program
  .command('analyze')
  .description('Analyze performance data from benchmark results')
  .requiredOption('-f, --file <file>', 'Performance data file to analyze')
  .action(analyzePerformance);

program
  .command('generate-test-data')
  .description('Generate test data for benchmarking')
  .option('-c, --count <num>', 'Number of test files to generate', '100')
  .option('-o, --output <dir>', 'Output directory for test files', './test-data')
  .action(async (options) => {
    options.count = parseInt(options.count);
    await generateTestData(options);
  });

// Parse command line arguments
program.parse();

module.exports = {
  generateBenchmarkReport
};
