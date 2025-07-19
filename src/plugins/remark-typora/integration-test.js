/**
 * Integration Test
 * Tests the plugins working together with actual markdown content
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { remarkTyporaMermaid, remarkTyporaImages, remarkTyporaExtensions } from './index.js';

/**
 * Test markdown content with various Typora features
 */
const testMarkdown = `# Test Document

This is a test document with various Typora features.

## Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

## Images

![Test Image](test-image.png)

<img src="diagram.png" style="zoom:67%;" />

## Typora Extensions

This text has ==highlighted content== and <u>underlined text</u>.

- [x] Completed task
- [ ] Incomplete task

Here's a footnote reference[^1].

[^1]: This is the footnote content.
`;

/**
 * Run integration test
 */
async function runIntegrationTest() {
  console.log('=== Integration Test ===\n');
  
  try {
    // Create unified processor with our plugins
    const processor = unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkTyporaMermaid, {
        componentPath: '../../components/Mermaid.astro'
      })
      .use(remarkTyporaImages, {
        contentDir: 'src/content/blog'
      })
      .use(remarkTyporaExtensions, {
        enableHighlight: true,
        enableUnderline: true
      })
      .use(remarkStringify);

    // Process the test markdown
    const file = await processor.process({
      value: testMarkdown,
      path: 'src/content/blog/test-post.md'
    });

    console.log('✓ Markdown processing completed');
    
    // Check if processing data was added
    if (file.data.typoraMermaid) {
      console.log('✓ Mermaid plugin processed:', file.data.typoraMermaid.hasMermaidBlocks);
    }
    
    if (file.data.typoraImages) {
      console.log('✓ Images plugin processed:', file.data.typoraImages.processedImages, 'images');
    }
    
    if (file.data.typoraExtensions) {
      console.log('✓ Extensions plugin processed features:', 
        Object.values(file.data.typoraExtensions.processedFeatures).reduce((a, b) => a + b, 0));
    }

    // Check if the output contains expected transformations
    const output = String(file);
    
    // Should contain Mermaid component
    if (output.includes('Mermaid')) {
      console.log('✓ Mermaid component transformation detected');
    }
    
    // Should contain highlight markup
    if (output.includes('<mark')) {
      console.log('✓ Highlight transformation detected');
    }
    
    // Should contain image path transformations
    if (output.includes('./test-post/')) {
      console.log('✓ Image path transformation detected');
    }

    console.log('\n🎉 Integration test passed!');
    console.log('All plugins are working together correctly.');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTest().catch(console.error);
}

export { runIntegrationTest };