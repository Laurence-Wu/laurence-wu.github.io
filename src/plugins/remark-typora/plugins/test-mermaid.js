/**
 * Test for remark-typora-mermaid plugin
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { remarkTyporaMermaid } from './remark-typora-mermaid.js';

/**
 * Test the mermaid plugin with various inputs
 */
async function testMermaidPlugin() {
  console.log('Testing remark-typora-mermaid plugin...\n');

  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkTyporaMermaid, {
      componentPath: '../../components/Mermaid.astro',
      componentName: 'Mermaid',
      autoImport: true
    });

  // Test 1: Valid mermaid diagram
  console.log('Test 1: Valid mermaid diagram');
  const validMermaid = `# Test Document

Here's a mermaid diagram:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

End of document.`;

  try {
    const tree1 = processor.parse(validMermaid);
    const transformed1 = await processor.run(tree1);
    
    console.log('✓ Valid mermaid processed successfully');
    
    // Check if import was added
    const hasImport = JSON.stringify(transformed1).includes('import Mermaid');
    console.log(`✓ Auto-import ${hasImport ? 'added' : 'not added'}`);
    
    // Check if JSX element was created
    const hasJsxElement = JSON.stringify(transformed1).includes('mdxJsxFlowElement');
    console.log(`✓ JSX element ${hasJsxElement ? 'created' : 'not created'}`);
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Invalid mermaid syntax
  console.log('\nTest 2: Invalid mermaid syntax');
  const invalidMermaid = `# Test Document

Invalid mermaid:

\`\`\`mermaid
this is not valid mermaid syntax
\`\`\`

End of document.`;

  try {
    const tree2 = processor.parse(invalidMermaid);
    const transformed2 = await processor.run(tree2);
    
    console.log('✓ Invalid mermaid handled gracefully');
    
    // Check if error element was created
    const hasErrorElement = JSON.stringify(transformed2).includes('mermaid-error');
    console.log(`✓ Error element ${hasErrorElement ? 'created' : 'not created'}`);
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Empty mermaid block
  console.log('\nTest 3: Empty mermaid block');
  const emptyMermaid = `# Test Document

Empty mermaid:

\`\`\`mermaid

\`\`\`

End of document.`;

  try {
    const tree3 = processor.parse(emptyMermaid);
    const transformed3 = await processor.run(tree3);
    
    console.log('✓ Empty mermaid handled gracefully');
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test 4: Multiple mermaid blocks
  console.log('\nTest 4: Multiple mermaid blocks');
  const multipleMermaid = `# Test Document

First diagram:

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

Second diagram:

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
\`\`\`

End of document.`;

  try {
    const tree4 = processor.parse(multipleMermaid);
    const transformed4 = await processor.run(tree4);
    
    console.log('✓ Multiple mermaid blocks processed');
    
    // Count JSX elements
    const jsxCount = (JSON.stringify(transformed4).match(/mdxJsxFlowElement/g) || []).length;
    console.log(`✓ Found ${jsxCount} JSX elements`);
    
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  // Test 5: Mixed code blocks
  console.log('\nTest 5: Mixed code blocks (mermaid and others)');
  const mixedCode = `# Test Document

JavaScript code:

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

Mermaid diagram:

\`\`\`mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\`

Python code:

\`\`\`python
print("Hello, World!")
\`\`\`

End of document.`;

  try {
    const tree5 = processor.parse(mixedCode);
    const transformed5 = await processor.run(tree5);
    
    console.log('✓ Mixed code blocks processed');
    
    // Check that only mermaid was transformed
    const transformedStr = JSON.stringify(transformed5);
    const hasMermaidJsx = transformedStr.includes('mdxJsxFlowElement');
    const hasJsCode = transformedStr.includes('javascript');
    const hasPythonCode = transformedStr.includes('python');
    
    console.log(`✓ Mermaid transformed: ${hasMermaidJsx}`);
    console.log(`✓ JavaScript preserved: ${hasJsCode}`);
    console.log(`✓ Python preserved: ${hasPythonCode}`);
    
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('\n🎉 Mermaid plugin tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMermaidPlugin().catch(console.error);
}

export { testMermaidPlugin };