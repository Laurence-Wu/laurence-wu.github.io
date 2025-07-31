#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');

function cleanFile(filePath) {
  console.log(`Cleaning ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find and fix problematic exports
  const lines = content.split('\n');
  let inExports = false;
  let exportStart = -1;
  let exportEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('module.exports = {')) {
      inExports = true;
      exportStart = i;
    } else if (inExports && lines[i].includes('};')) {
      exportEnd = i;
      break;
    }
  }
  
  if (exportStart >= 0 && exportEnd >= 0) {
    // Extract export lines
    const exportLines = lines.slice(exportStart + 1, exportEnd);
    const validExports = [];
    
    for (const line of exportLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        const exportName = trimmed.replace(',', '').trim();
        // Skip reserved keywords and built-in modules
        if (!['for', 'if', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'function', 'var', 'let', 'const', 'class', 'extends', 'import', 'export', 'from', 'as', 'path', 'fs', 'crypto', 'os', 'util', 'events', 'stream', 'chokidar', 'glob', 'commander'].includes(exportName)) {
          validExports.push(exportName);
        }
      }
    }
    
    if (validExports.length > 0) {
      const newExportSection = [
        'module.exports = {',
        ...validExports.map(name => `  ${name}`),
        '};'
      ];
      
      const newLines = [
        ...lines.slice(0, exportStart),
        ...newExportSection,
        ...lines.slice(exportEnd + 1)
      ];
      
      content = newLines.join('\n');
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Cleaned ${filePath}`);
}

// Clean all JS files in src directory
const files = glob.sync('src/**/*.js', { 
  ignore: ['src/__tests__/**', 'src/examples/**', 'src/index.js', 'src/cli.js'] 
});

files.forEach(cleanFile);

console.log('✅ All exports cleaned!');