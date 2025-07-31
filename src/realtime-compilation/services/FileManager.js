import { promises as fs } from 'fs';
import path from 'path';

/**
 * FileManager handles file operations, path resolution, and cleanup for MD to MDX compilation
 */
export class FileManager {
  constructor(config = {}) {
    this.config = {
      contentRoot: config.contentRoot || 'src/content',
      outputExtension: config.outputExtension || '.mdx',
      inputExtensions: config.inputExtensions || ['.md'],
      ...config
    };
  }

  /**
   * Maps an input .md file path to its corresponding .mdx output path
   * @param {string} inputPath - The path to the .md file
   * @returns {string} The corresponding .mdx file path
   */
  getOutputPath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Input path must be a non-empty string');
    }

    // Normalize the path to handle different path separators
    const normalizedPath = path.normalize(inputPath);
    
    // Check if the file has a supported input extension
    const ext = path.extname(normalizedPath);
    if (!this.config.inputExtensions.includes(ext)) {
      throw new Error(`Unsupported file extension: ${ext}. Supported extensions: ${this.config.inputExtensions.join(', ')}`);
    }

    // Replace the extension with the output extension
    const outputPath = normalizedPath.replace(ext, this.config.outputExtension);
    
    return outputPath;
  }

  /**
   * Ensures that the directory for the given file path exists
   * @param {string} filePath - The file path whose directory should be created
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a non-empty string');
    }

    const directory = path.dirname(filePath);
    
    try {
      await fs.access(directory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(directory, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  /**
   * Performs an atomic file write operation
   * @param {string} filePath - The path where the file should be written
   * @param {string} content - The content to write to the file
   * @returns {Promise<void>}
   */
  async writeFileAtomic(filePath, content) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a non-empty string');
    }

    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }

    // Ensure the directory exists
    await this.ensureDirectoryExists(filePath);

    // Create a temporary file path
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 11)}`;

    try {
      // Write to temporary file first
      await fs.writeFile(tempPath, content, 'utf8');
      
      // Atomically move the temporary file to the target location
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temporary file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Deletes the corresponding MDX file for a given MD file path
   * @param {string} mdPath - The path to the .md file
   * @returns {Promise<boolean>} True if file was deleted, false if it didn't exist
   */
  async deleteCorrespondingMdx(mdPath) {
    if (!mdPath || typeof mdPath !== 'string') {
      throw new Error('MD path must be a non-empty string');
    }

    try {
      const mdxPath = this.getOutputPath(mdPath);
      await fs.unlink(mdxPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, which is fine
        return false;
      }
      throw error;
    }
  }

  /**
   * Finds and cleans up orphaned MDX files that don't have corresponding MD files
   * @param {string} contentDirectory - The content directory to scan
   * @returns {Promise<string[]>} Array of cleaned up file paths
   */
  async cleanupOrphanedFiles(contentDirectory) {
    if (!contentDirectory || typeof contentDirectory !== 'string') {
      throw new Error('Content directory must be a non-empty string');
    }

    const cleanedFiles = [];

    try {
      const mdxFiles = await this._findFilesByExtension(contentDirectory, this.config.outputExtension);
      
      for (const mdxFile of mdxFiles) {
        const correspondingMdPath = this._getCorrespondingMdPath(mdxFile);
        
        try {
          await fs.access(correspondingMdPath);
          // MD file exists, keep the MDX file
        } catch (error) {
          if (error.code === 'ENOENT') {
            // MD file doesn't exist, delete the orphaned MDX file
            await fs.unlink(mdxFile);
            cleanedFiles.push(mdxFile);
          }
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist, nothing to clean up
        return cleanedFiles;
      }
      throw error;
    }

    return cleanedFiles;
  }

  /**
   * Gets the corresponding MD file path for an MDX file
   * @param {string} mdxPath - The path to the .mdx file
   * @returns {string} The corresponding .md file path
   * @private
   */
  _getCorrespondingMdPath(mdxPath) {
    const ext = path.extname(mdxPath);
    if (ext !== this.config.outputExtension) {
      throw new Error(`Expected ${this.config.outputExtension} file, got ${ext}`);
    }

    // Use the first input extension as the default
    const inputExtension = this.config.inputExtensions[0];
    return mdxPath.replace(ext, inputExtension);
  }

  /**
   * Recursively finds all files with a specific extension in a directory
   * @param {string} directory - The directory to search
   * @param {string} extension - The file extension to look for
   * @returns {Promise<string[]>} Array of file paths
   * @private
   */
  async _findFilesByExtension(directory, extension) {
    const files = [];
    
    async function scanDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && path.extname(entry.name) === extension) {
          files.push(fullPath);
        }
      }
    }

    await scanDirectory(directory);
    return files;
  }

  /**
   * Checks if a file exists
   * @param {string} filePath - The file path to check
   * @returns {Promise<boolean>} True if file exists, false otherwise
   */
  async fileExists(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets file stats for a given path
   * @param {string} filePath - The file path
   * @returns {Promise<fs.Stats|null>} File stats or null if file doesn't exist
   */
  async getFileStats(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return null;
    }

    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }

  /**
   * Validates that a path is within the content directory (security check)
   * @param {string} filePath - The file path to validate
   * @returns {boolean} True if path is safe, false otherwise
   */
  isPathSafe(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    const normalizedPath = path.normalize(filePath);
    const contentRoot = path.resolve(this.config.contentRoot);
    
    // Handle both absolute and relative paths
    let resolvedPath;
    if (path.isAbsolute(normalizedPath)) {
      resolvedPath = normalizedPath;
    } else {
      // For relative paths, resolve them relative to the current working directory
      resolvedPath = path.resolve(normalizedPath);
    }

    return resolvedPath.startsWith(contentRoot);
  }
}

export default FileManager;