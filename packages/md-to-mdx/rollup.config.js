const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const typescript = require('@rollup/plugin-typescript');

const external = [
  'fs',
  'path',
  'os',
  'util',
  'events',
  'stream',
  'crypto',
  'chokidar',
  'commander',
  'glob'
];

const plugins = [
  resolve({
    preferBuiltins: true,
    exportConditions: ['node']
  }),
  commonjs(),
  json(),
  typescript({
    declaration: true,
    declarationDir: 'dist',
    rootDir: 'src'
  })
];

module.exports = [
  // Main library build
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'es'
      }
    ],
    external,
    plugins
  },
  
  // CLI build
  {
    input: 'src/cli.js',
    output: {
      file: 'dist/cli.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node'
    },
    external,
    plugins
  }
];