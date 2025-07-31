/**
 * Example Webpack configuration with MD to MDX integration
 */

const { WebpackMDToMDXPlugin } = require('../md-to-mdx-plugin.js');

module.exports = {
  // ... other webpack config
  
  plugins: [
    // Add MD to MDX plugin
    new WebpackMDToMDXPlugin({
      contentDir: 'src/content',
      outputDir: 'src/content',
      
      processors: {
        standard: { enabled: true },
        mermaid: { 
          enabled: true,
          componentPath: './components/Mermaid.jsx',
          componentName: 'Mermaid'
        },
        math: { enabled: true },
        image: { enabled: true },
        tables: { enabled: true }
      }
    })
  ],
  
  // Watch .md files
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000
  }
};