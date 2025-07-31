#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix destructuring with 'as' keyword
  content = content.replace(/const\s*{\s*([^}]*)\s+as\s+([^}]*)\s*}\s*=\s*require\(/g, (match, original, alias, rest) => {
    return `const { ${original.trim()}: ${alias.trim()} } = require(`;
  });
  
  // Fix extra spaces in destructuring
  content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*require\(/g, (match, imports) => {
    const cleanImports = imports.split(',').map(imp => imp.trim()).join(', ');
    return `const { ${cleanImports} } = require(`;
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed ${filePath}`);
}

// Fix all JS files in src directory
const files = glob.sync('src/**/*.js', { 
  ignore: ['src/__tests__/**', 'src/examples/**'] 
});

files.forEach(fixFile);

console.log('✅ All destructuring issues fixed!');