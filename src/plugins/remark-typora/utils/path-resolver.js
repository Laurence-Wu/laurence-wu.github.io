/**
 * Path Resolver
 * Utilities for resolving file paths in Typora-compatible way
 */

import path from 'path';
import fs from 'fs';

export class PathResolver {
  constructor(options = {}) {
    this.contentDir = options.contentDir || 'src/content/blog';
    this.publicDir = options.publicDir || 'public';
    this.baseUrl = options.baseUrl || '';
  }

  /**
   * Get the processing context for a markdown file
   * @param {string} filePath - Path to the markdown file
   * @returns {Object} Processing context
   */
  getProcessingContext(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const fileDir = path.dirname(filePath);
    const assetDir = path.join(fileDir, fileName);
    
    return {
      filePath,
      fileName,
      fileDir,
      contentDir: this.contentDir,
      assetDir,
      hasAssetDir: this.directoryExists(assetDir)
    };
  }

  /**
   * Resolve image path using Typora conventions
   * @param {string} imageSrc - Original image source
   * @param {Object} context - Processing context
   * @returns {Object} Resolution result
   */
  resolveImagePath(imageSrc, context) {
    // Skip if already absolute URL or data URI
    if (this.isAbsoluteUrl(imageSrc) || imageSrc.startsWith('data:')) {
      return {
        originalSrc: imageSrc,
        resolvedSrc: imageSrc,
        exists: true,
        fallbackUsed: false,
        resolutionStrategy: 'absolute-url'
      };
    }

    // Skip if already relative to content directory
    if (imageSrc.startsWith('./') || imageSrc.startsWith('../')) {
      return {
        originalSrc: imageSrc,
        resolvedSrc: imageSrc,
        exists: this.fileExists(path.resolve(context.fileDir, imageSrc)),
        fallbackUsed: false,
        resolutionStrategy: 'relative-path'
      };
    }

    // Try Typora asset folder convention first
    const typoraPath = `./${context.fileName}/${imageSrc}`;
    const typoraFullPath = path.resolve(context.fileDir, typoraPath);
    
    if (this.fileExists(typoraFullPath)) {
      return {
        originalSrc: imageSrc,
        resolvedSrc: typoraPath,
        exists: true,
        fallbackUsed: false,
        resolutionStrategy: 'typora-asset-folder'
      };
    }

    // Try relative to file directory
    const relativePath = path.resolve(context.fileDir, imageSrc);
    if (this.fileExists(relativePath)) {
      return {
        originalSrc: imageSrc,
        resolvedSrc: `./${imageSrc}`,
        exists: true,
        fallbackUsed: false,
        resolutionStrategy: 'file-relative'
      };
    }

    // Try public directory
    const publicPath = path.resolve(this.publicDir, imageSrc);
    if (this.fileExists(publicPath)) {
      return {
        originalSrc: imageSrc,
        resolvedSrc: `/${imageSrc}`,
        exists: true,
        fallbackUsed: false,
        resolutionStrategy: 'public-directory'
      };
    }

    // Fallback: use original path but mark as potentially missing
    return {
      originalSrc: imageSrc,
      resolvedSrc: imageSrc,
      exists: false,
      fallbackUsed: true,
      resolutionStrategy: 'fallback'
    };
  }

  /**
   * Parse Typora zoom syntax from img tag
   * @param {string} htmlString - HTML string containing img tag
   * @returns {Object} Parsed zoom information
   */
  parseTyporaZoom(htmlString) {
    const zoomMatch = htmlString.match(/style=["']([^"']*zoom:\s*(\d+(?:\.\d+)?)%[^"']*)["']/i);
    
    if (zoomMatch) {
      return {
        hasZoom: true,
        zoomPercentage: parseFloat(zoomMatch[2]),
        fullStyle: zoomMatch[1],
        isTyporaZoom: true
      };
    }

    return {
      hasZoom: false,
      zoomPercentage: 100,
      fullStyle: '',
      isTyporaZoom: false
    };
  }

  /**
   * Extract image source from HTML img tag
   * @param {string} htmlString - HTML string
   * @returns {string|null} Image source or null
   */
  extractImageSrc(htmlString) {
    const srcMatch = htmlString.match(/src=["']([^"']+)["']/i);
    return srcMatch ? srcMatch[1] : null;
  }

  /**
   * Check if a path is an absolute URL
   * @param {string} path - Path to check
   * @returns {boolean}
   */
  isAbsoluteUrl(path) {
    return /^https?:\/\//.test(path) || /^\/\//.test(path);
  }

  /**
   * Check if a file exists
   * @param {string} filePath - Path to check
   * @returns {boolean}
   */
  fileExists(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists
   * @param {string} dirPath - Directory path to check
   * @returns {boolean}
   */
  directoryExists(dirPath) {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Sanitize file path to prevent directory traversal
   * @param {string} filePath - Path to sanitize
   * @returns {string} Sanitized path
   */
  sanitizePath(filePath) {
    // Remove any ../ sequences and normalize
    const normalized = path.normalize(filePath);
    
    // Ensure path doesn't escape the content directory
    if (normalized.startsWith('../')) {
      return path.basename(normalized);
    }
    
    return normalized;
  }

  /**
   * Get relative path from one file to another
   * @param {string} from - Source file path
   * @param {string} to - Target file path
   * @returns {string} Relative path
   */
  getRelativePath(from, to) {
    return path.relative(path.dirname(from), to);
  }

  /**
   * Create asset directory if it doesn't exist
   * @param {Object} context - Processing context
   * @returns {boolean} True if directory was created or already exists
   */
  ensureAssetDirectory(context) {
    try {
      if (!this.directoryExists(context.assetDir)) {
        fs.mkdirSync(context.assetDir, { recursive: true });
        return true;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all image files in a directory
   * @param {string} dirPath - Directory path
   * @returns {Array<string>} Array of image file names
   */
  getImageFiles(dirPath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    
    try {
      if (!this.directoryExists(dirPath)) {
        return [];
      }
      
      return fs.readdirSync(dirPath)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        });
    } catch {
      return [];
    }
  }

  /**
   * Validate file extension against allowed types
   * @param {string} filePath - File path to validate
   * @param {Array<string>} allowedExtensions - Allowed extensions
   * @returns {boolean}
   */
  isValidFileType(filePath, allowedExtensions) {
    const ext = path.extname(filePath).toLowerCase();
    return allowedExtensions.includes(ext);
  }
}