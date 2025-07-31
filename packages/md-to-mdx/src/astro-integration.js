/**
 * Astro Integration for MD to MDX compilation
 */

const { createMDToMDXPlugin } = require('./md-to-mdx-plugin');
const { logger } = require('./logger');

/**
 * Create Astro integration for MD to MDX compilation
 */
function mdToMdx(userConfig = {}) {
  return {
    name: 'md-to-mdx',
    
    hooks: {
      'astro:config:setup': ({ config, updateConfig, addWatchFile, command }) => {
        logger.info('Setting up MD to MDX integration for Astro');
        
        // Add the Vite plugin to handle compilation
        const plugin = createMDToMDXPlugin({
          contentDir: userConfig.contentDir || 'src/content',
          outputDir: userConfig.outputDir || 'src/content',
          watch: command === 'dev',
          hotReload: command === 'dev',
          ...userConfig
        });
        
        updateConfig({
          vite: {
            plugins: [plugin]
          }
        });
        
        // Watch .md files for changes in development
        if (command === 'dev') {
          const contentDir = userConfig.contentDir || 'src/content';
          addWatchFile(`${contentDir}/**/*.md`);
        }
        
        logger.info('MD to MDX integration configured successfully');
      },
      
      'astro:config:done': ({ config }) => {
        logger.debug('Astro configuration completed', {
          contentDir: userConfig.contentDir || 'src/content',
          outputDir: userConfig.outputDir || 'src/content'
        });
      },
      
      'astro:build:start': () => {
        logger.info('Starting Astro build with MD to MDX compilation');
      },
      
      'astro:build:done': ({ dir }) => {
        logger.info('Astro build completed with MD to MDX compilation', {
          outputDir: dir.pathname
        });
      }
    }
  };
}

/**
 * Default export for easier importing
 */
export default mdToMdx;

module.exports = {
  mdToMdx
};
