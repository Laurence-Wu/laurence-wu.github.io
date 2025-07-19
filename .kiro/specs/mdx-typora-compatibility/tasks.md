# Implementation Plan

- [x] 1. Create core remark plugin infrastructure
  - Set up plugin directory structure and base utilities
  - Create shared utilities for AST manipulation and file path resolution
  - Implement auto-import manager for component imports
  - _Requirements: 1.1, 3.1_

- [x] 2. Implement remark-typora-mermaid plugin
  - Create plugin to detect ```mermaid code blocks in markdown AST
  - Transform mermaid code blocks to Mermaid component JSX elements
  - Implement auto-import functionality to add Mermaid component import
  - Add error handling for invalid mermaid syntax
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Implement remark-typora-images plugin
  - Create plugin to detect image nodes in markdown AST
  - Resolve image paths to blog post folder structure (./post-name/image.png)
  - Handle both ![](image.png) and <img> tag formats
  - Preserve Typora zoom styling in <img> tags
  - Implement fallback strategy for missing images
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Implement remark-typora-extensions plugin
  - Add support for ==highlight== syntax transformation to <mark> tags
  - Preserve <u>underline</u> HTML tags
  - Enhance task list processing for - [x] and - [ ] syntax
  - Add footnote processing for [^1] syntax
  - Implement code fence attribute parsing for ```lang {.attr}
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5. Update Astro configuration
  - Modify astro.config.mjs to include new remark plugins
  - Configure plugin options for component paths and directories
  - Ensure plugins work with both .md and .mdx files
  - Test plugin order and compatibility with existing plugins
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Create comprehensive test suite
  - Write unit tests for each remark plugin transformation
  - Test mermaid block detection and component generation
  - Test image path resolution with various folder structures
  - Test Typora extension syntax transformations
  - Create integration tests for full markdown compilation pipeline
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Add error handling and validation
  - Implement graceful error handling for malformed syntax
  - Add validation for image file existence
  - Create fallback mechanisms for missing components or assets
  - Add logging and debugging utilities for plugin development
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [-] 8. Create example content and documentation
  - Create sample markdown files demonstrating Typora features
  - Test with actual Typora-created content
  - Document plugin configuration options
  - Create migration guide for existing content
  - _Requirements: 3.1, 3.2, 3.3, 3.4_