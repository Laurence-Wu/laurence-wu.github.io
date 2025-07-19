/**
 * Test Infrastructure
 * Basic tests to verify the plugin infrastructure is working
 */

import { AutoImportManager } from './utils/auto-import-manager.js';
import { AstUtils } from './utils/ast-utils.js';
import { PathResolver } from './utils/path-resolver.js';

/**
 * Test the AutoImportManager
 */
function testAutoImportManager() {
  console.log('Testing AutoImportManager...');
  
  const manager = new AutoImportManager();
  
  // Test adding imports
  manager.addImport('Mermaid', '../../components/Mermaid.astro');
  manager.addImport('TestComponent', './TestComponent.jsx', 'named');
  
  console.log('✓ Added imports');
  
  // Test checking imports
  console.assert(manager.hasImport('Mermaid'), 'Should have Mermaid import');
  console.assert(!manager.hasImport('NonExistent'), 'Should not have NonExistent import');
  
  console.log('✓ Import checking works');
  
  // Test marking as used
  manager.markAsUsed('Mermaid');
  
  // Test generating import statements
  const statements = manager.generateImportStatements();
  console.assert(statements.length === 1, 'Should generate 1 import statement');
  console.assert(statements[0].includes('Mermaid'), 'Should include Mermaid import');
  
  console.log('✓ Import generation works');
  
  // Test stats
  const stats = manager.getStats();
  console.assert(stats.totalImports === 2, 'Should have 2 total imports');
  console.assert(stats.usedImports === 1, 'Should have 1 used import');
  
  console.log('✓ Stats generation works');
  console.log('AutoImportManager tests passed!\n');
}

/**
 * Test the AstUtils
 */
function testAstUtils() {
  console.log('Testing AstUtils...');
  
  // Test JSX element creation
  const jsxElement = AstUtils.createJsxElement('TestComponent', { prop: 'value' });
  console.assert(jsxElement.type === 'mdxJsxFlowElement', 'Should create JSX element');
  console.assert(jsxElement.name === 'TestComponent', 'Should have correct name');
  
  console.log('✓ JSX element creation works');
  
  // Test JSX expression attribute
  const exprAttr = AstUtils.createJsxExpressionAttribute('code', 'graph TD\\n    A --> B');
  console.assert(exprAttr.type === 'mdxJsxAttribute', 'Should create JSX attribute');
  console.assert(exprAttr.name === 'code', 'Should have correct name');
  
  console.log('✓ JSX expression attribute creation works');
  
  // Test node cloning
  const originalNode = { type: 'text', value: 'test' };
  const clonedNode = AstUtils.cloneNode(originalNode);
  console.assert(clonedNode.type === 'text', 'Should clone node type');
  console.assert(clonedNode.value === 'test', 'Should clone node value');
  console.assert(clonedNode !== originalNode, 'Should be different object');
  
  console.log('✓ Node cloning works');
  console.log('AstUtils tests passed!\n');
}

/**
 * Test the PathResolver
 */
function testPathResolver() {
  console.log('Testing PathResolver...');
  
  const resolver = new PathResolver();
  
  // Test processing context
  const context = resolver.getProcessingContext('src/content/blog/test-post.md');
  console.assert(context.fileName === 'test-post', 'Should extract correct file name');
  console.assert(context.assetDir.includes('test-post'), 'Should create correct asset dir');
  
  console.log('✓ Processing context creation works');
  
  // Test absolute URL detection
  console.assert(resolver.isAbsoluteUrl('https://example.com/image.png'), 'Should detect HTTPS URL');
  console.assert(resolver.isAbsoluteUrl('http://example.com/image.png'), 'Should detect HTTP URL');
  console.assert(!resolver.isAbsoluteUrl('image.png'), 'Should not detect relative path as absolute');
  
  console.log('✓ Absolute URL detection works');
  
  // Test Typora zoom parsing
  const zoomInfo = resolver.parseTyporaZoom('<img src="test.png" style="zoom:67%;" />');
  console.assert(zoomInfo.hasZoom === true, 'Should detect zoom');
  console.assert(zoomInfo.zoomPercentage === 67, 'Should extract correct zoom percentage');
  
  console.log('✓ Typora zoom parsing works');
  
  // Test image src extraction
  const imageSrc = resolver.extractImageSrc('<img src="test.png" alt="test" />');
  console.assert(imageSrc === 'test.png', 'Should extract correct image src');
  
  console.log('✓ Image src extraction works');
  
  // Test path sanitization
  const sanitized = resolver.sanitizePath('../../../etc/passwd');
  console.assert(!sanitized.includes('../'), 'Should remove directory traversal');
  
  console.log('✓ Path sanitization works');
  console.log('PathResolver tests passed!\n');
}

/**
 * Run all tests
 */
function runTests() {
  console.log('=== Testing Remark Typora Plugin Infrastructure ===\n');
  
  try {
    testAutoImportManager();
    testAstUtils();
    testPathResolver();
    
    console.log('🎉 All infrastructure tests passed!');
    console.log('The plugin infrastructure is ready for use.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };