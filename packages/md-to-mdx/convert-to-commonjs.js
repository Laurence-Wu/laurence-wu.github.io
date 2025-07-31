#!/usr/bin/env node

/**
 * Script to convert ES modules to CommonJS format
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function convertFile(filePath) {
  console.log(`Converting ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Convert imports
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?/g, (match, imports, module) => {
    return `const { ${imports} } = require('${module.replace(/\.js$/, '')}');`;
  });
  
  content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g, (match, name, module) => {
    return `const ${name} = require('${module.replace(/\.js$/, '')}');`;
  });
  
  content = content.replace(/import\s+(['"][^'"]+['"])\s+from\s+['"]([^'"]+)['"];?/g, (match, name, module) => {
    return `const ${name} = require('${module.replace(/\.js$/, '')}');`;
  });
  
  // Convert export class
  content = content.replace(/export\s+class\s+(\w+)/g, 'class $1');
  
  // Convert export function
  content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
  
  // Convert export const
  content = content.replace(/export\s+const\s+(\w+)/g, 'const $1');
  
  // Add module.exports at the end if not present
  if (!content.includes('module.exports') && (content.includes('class ') || content.includes('function '))) {
    // Extract class and function names
    const classMatches = content.match(/class\s+(\w+)/g) || [];
    const functionMatches = content.match(/^function\s+(\w+)/gm) || [];
    const constMatches = content.match(/^const\s+(\w+)/gm) || [];
    
    const exports = [];
    
    classMatches.forEach(match => {
      const name = match.replace('class ', '');
      exports.push(name);
    });
    
    functionMatches.forEach(match => {
      const name = match.replace('function ', '');
      exports.push(name);
    });
    
    constMatches.forEach(match => {
      const name = match.replace('const ', '');
      if (!name.includes('=')) {
        exports.push(name);
      }
    });
    
    if (exports.length > 0) {
      const exportObj = exports.map(name => `  ${name}`).join(',\n');
      content += `\n\nmodule.exports = {\n${exportObj}\n};\n`;
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Converted ${filePath}`);
}

// Convert all JS files in src directory
const files = glob.sync('src/**/*.js', { 
  ignore: ['src/__tests__/**', 'src/examples/**', 'src/index.js', 'src/cli.js'] 
});

files.forEach(convertFile);

console.log('✅ All files converted to CommonJS format!');