/**
 * Demo processor to show mermaid plugin transformation
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { remarkTyporaMermaid } from './plugins/remark-typora-mermaid.js';
import { readFileSync } from 'fs';

async function processDemoFile() {
  console.log('=== Mermaid Plugin Demo ===\n');
  
  try {
    // Read the demo markdown file
    const demoContent = readFileSync('src/plugins/remark-typora/demo-mermaid.md', 'utf8');
    
    // Create processor with mermaid plugin
    const processor = unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkTyporaMermaid, {
        componentPath: '../../components/Mermaid.astro',
        componentName: 'Mermaid',
        autoImport: true
      });

    // Process the content
    const tree = processor.parse(demoContent);
    const transformed = await processor.run(tree);
    
    console.log('✓ Demo file processed successfully');
    
    // Show processing statistics
    const file = { data: {} };
    await processor.run(tree, file);
    
    if (file.data.typoraMermaid) {
      const stats = file.data.typoraMermaid;
      console.log(`✓ Found ${stats.processedBlocks} mermaid blocks`);
      console.log(`✓ Successfully transformed ${stats.validBlocks} blocks`);
      console.log(`✓ Error blocks: ${stats.errorBlocks}`);
      
      if (stats.errors.length > 0) {
        console.log('\nErrors encountered:');
        stats.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. Block ${error.block}: ${error.error}`);
        });
      }
    }
    
    // Show that imports were added
    const transformedStr = JSON.stringify(transformed, null, 2);
    const importCount = (transformedStr.match(/import Mermaid/g) || []).length;
    console.log(`✓ Auto-imports added: ${importCount}`);
    
    // Show JSX transformations
    const jsxCount = (transformedStr.match(/mdxJsxFlowElement/g) || []).length;
    console.log(`✓ JSX elements created: ${jsxCount}`);
    
    console.log('\n🎉 Demo processing completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo processing failed:', error);
    throw error;
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processDemoFile().catch(console.error);
}

export { processDemoFile };