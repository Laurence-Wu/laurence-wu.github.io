/**
 * Type definitions and interfaces for MD to MDX compilation system
 */

/**
 * File metadata for tracking processing state
 * @typedef {Object} FileMetadata
 * @property {string} filePath - Original .md file path
 * @property {string} outputPath - Target .mdx file path
 * @property {Date} lastModified - File modification time
 * @property {Object} frontmatter - Parsed frontmatter
 * @property {string} contentHash - Content hash for change detection
 * @property {'pending'|'processing'|'complete'|'error'} processingStatus - Processing status
 */

/**
 * Transformation context passed between processors
 * @typedef {Object} TransformationContext
 * @property {string} sourceFile - Original file path
 * @property {string} content - File content
 * @property {Object} frontmatter - Parsed frontmatter
 * @property {FileMetadata} metadata - File metadata
 * @property {Object} options - Processing options
 * @property {Array<string>} errors - Processing errors
 * @property {Array<string>} warnings - Processing warnings
 */

/**
 * Processor configuration
 * @typedef {Object} ProcessorConfig
 * @property {string} name - Processor identifier
 * @property {boolean} enabled - Whether processor is active
 * @property {number} priority - Processing order (lower = earlier)
 * @property {Object} options - Processor-specific options
 * @property {Array<RegExp>} patterns - Content patterns to match
 */

/**
 * Build configuration
 * @typedef {Object} BuildConfig
 * @property {string} contentDir - Input directory for .md files
 * @property {string} outputDir - Output directory for .mdx files
 * @property {Array<string>} include - File patterns to include
 * @property {Array<string>} exclude - File patterns to exclude
 * @property {Object} processors - Processor configurations
 * @property {boolean} watch - Enable file watching
 * @property {boolean} hotReload - Enable hot reload
 * @property {boolean} cleanOutput - Clean output directory
 * @property {boolean} preserveTimestamps - Preserve file timestamps
 */

export {
  // Type definitions are exported as JSDoc comments for JavaScript usage
};