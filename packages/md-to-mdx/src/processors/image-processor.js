/**
 * Image Processor - Handles image references and embedding in Markdown content
 */

const { promises: fs } = require('fs');
const path = require('path');
const { logger } = require('../logger');
const { ContentError, FileSystemError } = require('../errors');

/**
 * Image Processor class
 */
class ImageProcessor {
  constructor(options = {}) {
    this.name = 'image';
    this.priority = 15; // Process after mermaid but before final cleanup
    this.enabled = options.enabled !== false;
    
    this.options = {
      // Image folder naming convention
      imageFolderPattern: '{filename}', // folder name matches .md filename
      
      // Supported image extensions
      supportedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'],
      
      // Path resolution
      publicPath: '/public',
      assetsPath: '/src/assets',
      
      // Image optimization
      generateResponsive: false,
      optimizeImages: false,
      
      // Validation
      validateImageExists: true,
      warnMissingImages: true,
      
      ...options
    };
    
    this.logger = logger.child({ component: 'ImageProcessor' });
  }

  /**
   * Process content to handle image references
   */
  async process(content, context) {
    try {
      this.logger.debug('Processing image references', {
        file: context.sourceFile
      });
      
      // Find all image references in the content
      const imageReferences = this.findImageReferences(content);
      
      if (imageReferences.length === 0) {
        this.logger.debug('No image references found', { file: context.sourceFile });
        return content;
      }
      
      this.logger.debug(`Found ${imageReferences.length} image references`, {
        file: context.sourceFile
      });
      
      // Get the base filename for folder matching
      const baseFilename = this.getBaseFilename(context.sourceFile);
      const imageFolder = this.getImageFolderPath(context.sourceFile, baseFilename);
      
      // Process each image reference
      let processedContent = content;
      let offset = 0;
      
      for (const imageRef of imageReferences) {
        try {
          // Resolve image path
          const resolvedPath = await this.resolveImagePath(imageRef, imageFolder, context);
          
          if (resolvedPath) {
            // Generate new image syntax
            const newImageSyntax = this.generateImageSyntax(imageRef, resolvedPath);
            
            // Replace the image reference
            const startPos = imageRef.start + offset;
            const endPos = imageRef.end + offset;
            
            processedContent = processedContent.substring(0, startPos) + 
                             newImageSyntax + 
                             processedContent.substring(endPos);
            
            // Update offset for subsequent replacements
            offset += newImageSyntax.length - (imageRef.end - imageRef.start);
            
            this.logger.debug('Processed image reference', {
              file: context.sourceFile,
              original: imageRef.src,
              resolved: resolvedPath,
              alt: imageRef.alt
            });
          }
          
        } catch (error) {
          const imageError = new ContentError({
            message: `Failed to process image reference: ${error.message}`,
            file: context.sourceFile,
            line: imageRef.line,
            originalError: error
          });
          
          context.warnings.push(imageError);
          
          this.logger.warn('Image processing failed', {
            file: context.sourceFile,
            image: imageRef.src,
            error: error.message
          });
        }
      }
      
      this.logger.info('Image processing completed', {
        file: context.sourceFile,
        imagesProcessed: imageReferences.length,
        warnings: context.warnings.filter(w => w.processor === this.name).length
      });
      
      return processedContent;
      
    } catch (error) {
      throw new ContentError({
        message: `Image processing failed: ${error.message}`,
        file: context.sourceFile,
        processor: this.name,
        originalError: error
      });
    }
  }

  /**
   * Find all image references in content
   */
  findImageReferences(content) {
    const imageReferences = [];
    const lines = content.split('\n');
    let charPosition = 0;
    
    // Regex for Markdown image syntax: ![alt](src "title")
    const imageRegex = /!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      let match;
      while ((match = imageRegex.exec(line)) !== null) {
        const fullMatch = match[0];
        const alt = match[1] || '';
        const src = match[2].trim();
        const title = match[3] || '';
        
        imageReferences.push({
          start: charPosition + match.index,
          end: charPosition + match.index + fullMatch.length,
          line: lineNumber,
          fullMatch,
          alt,
          src,
          title,
          isRelative: this.isRelativePath(src),
          isLocal: this.isLocalPath(src)
        });
      }
      
      charPosition += line.length + 1; // +1 for newline
    }
    
    return imageReferences;
  }

  /**
   * Check if path is relative
   */
  isRelativePath(path) {
    return !path.startsWith('http://') && 
           !path.startsWith('https://') && 
           !path.startsWith('//') &&
           !path.startsWith('/');
  }

  /**
   * Check if path is local (not external URL)
   */
  isLocalPath(path) {
    return !path.startsWith('http://') && 
           !path.startsWith('https://') && 
           !path.startsWith('//');
  }

  /**
   * Get base filename without extension
   */
  getBaseFilename(filePath) {
    const basename = path.basename(filePath);
    return basename.replace(/\.[^/.]+$/, ''); // Remove extension
  }

  /**
   * Get the expected image folder path
   */
  getImageFolderPath(sourceFile, baseFilename) {
    const sourceDir = path.dirname(sourceFile);
    const folderName = this.options.imageFolderPattern.replace('{filename}', baseFilename);
    return path.join(sourceDir, folderName);
  }

  /**
   * Resolve image path to actual file location
   */
  async resolveImagePath(imageRef, imageFolder, context) {
    const { src } = imageRef;
    
    // Skip external URLs
    if (!imageRef.isLocal) {
      return null; // Don't modify external URLs
    }
    
    // Handle absolute paths (starting with /)
    if (src.startsWith('/')) {
      if (this.options.validateImageExists) {
        const publicPath = path.join(process.cwd(), 'public', src.substring(1));
        if (await this.fileExists(publicPath)) {
          return src; // Keep as-is if it exists in public
        } else if (this.options.warnMissingImages) {
          context.warnings.push(new ContentError({
            message: `Image not found: ${src}`,
            file: context.sourceFile,
            processor: this.name
          }));
        }
      }
      return src; // Return as-is for absolute paths
    }
    
    // Handle relative paths
    if (imageRef.isRelative) {
      // First, try to find in the dedicated image folder
      const imageInFolder = await this.findImageInFolder(src, imageFolder);
      if (imageInFolder) {
        return this.convertToPublicPath(imageInFolder, context.sourceFile);
      }
      
      // Then try relative to the markdown file
      const sourceDir = path.dirname(context.sourceFile);
      const relativePath = path.resolve(sourceDir, src);
      if (await this.fileExists(relativePath)) {
        return this.convertToPublicPath(relativePath, context.sourceFile);
      }
      
      // Warn about missing image
      if (this.options.warnMissingImages) {
        context.warnings.push(new ContentError({
          message: `Image not found: ${src} (searched in ${imageFolder} and relative to source file)`,
          file: context.sourceFile,
          processor: this.name
        }));
      }
    }
    
    return src; // Return original if not found or not processable
  }

  /**
   * Find image in the dedicated image folder
   */
  async findImageInFolder(imageName, imageFolder) {
    try {
      // Check if the image folder exists
      if (!(await this.fileExists(imageFolder))) {
        return null;
      }
      
      // Try exact match first
      const exactPath = path.join(imageFolder, imageName);
      if (await this.fileExists(exactPath)) {
        return exactPath;
      }
      
      // Try with different extensions if no extension provided
      const parsedPath = path.parse(imageName);
      if (!parsedPath.ext) {
        for (const ext of this.options.supportedExtensions) {
          const pathWithExt = path.join(imageFolder, parsedPath.name + ext);
          if (await this.fileExists(pathWithExt)) {
            return pathWithExt;
          }
        }
      }
      
      // Try case-insensitive search
      const files = await fs.readdir(imageFolder);
      const lowerImageName = imageName.toLowerCase();
      
      for (const file of files) {
        if (file.toLowerCase() === lowerImageName) {
          return path.join(imageFolder, file);
        }
      }
      
      return null;
    } catch (error) {
      this.logger.debug('Error searching image folder', {
        folder: imageFolder,
        image: imageName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Convert file system path to public URL path
   */
  convertToPublicPath(filePath, sourceFile) {
    // Get relative path from project root
    const projectRoot = process.cwd();
    const relativePath = path.relative(projectRoot, filePath);
    
    // Convert to URL path (forward slashes)
    const urlPath = '/' + relativePath.replace(/\\/g, '/');
    
    return urlPath;
  }

  /**
   * Generate new image syntax
   */
  generateImageSyntax(imageRef, resolvedPath) {
    const { alt, title } = imageRef;
    
    // Generate standard Markdown image syntax with resolved path
    let syntax = `![${alt}](${resolvedPath}`;
    
    if (title) {
      syntax += ` "${title}"`;
    }
    
    syntax += ')';
    
    return syntax;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all images in a folder
   */
  async getImagesInFolder(folderPath) {
    try {
      const files = await fs.readdir(folderPath);
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return this.options.supportedExtensions.includes(ext);
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Validate image folder structure
   */
  async validateImageFolder(sourceFile) {
    const baseFilename = this.getBaseFilename(sourceFile);
    const imageFolder = this.getImageFolderPath(sourceFile, baseFilename);
    
    const exists = await this.fileExists(imageFolder);
    if (!exists) {
      return {
        exists: false,
        path: imageFolder,
        images: []
      };
    }
    
    const images = await this.getImagesInFolder(imageFolder);
    
    return {
      exists: true,
      path: imageFolder,
      images,
      imageCount: images.length
    };
  }

  /**
   * Get processing statistics
   */
  getStats(content, context) {
    const imageReferences = this.findImageReferences(content);
    const localImages = imageReferences.filter(img => img.isLocal);
    const relativeImages = imageReferences.filter(img => img.isRelative);
    const externalImages = imageReferences.filter(img => !img.isLocal);
    
    return {
      totalImages: imageReferences.length,
      localImages: localImages.length,
      relativeImages: relativeImages.length,
      externalImages: externalImages.length,
      imageTypes: this.getImageTypes(imageReferences)
    };
  }

  /**
   * Get image types from references
   */
  getImageTypes(imageReferences) {
    const types = {};
    
    imageReferences.forEach(img => {
      const ext = path.extname(img.src).toLowerCase();
      if (ext) {
        types[ext] = (types[ext] || 0) + 1;
      } else {
        types['no-extension'] = (types['no-extension'] || 0) + 1;
      }
    });
    
    return types;
  }

  /**
   * Check if content has image references
   */
  hasImageReferences(content) {
    return /!\[([^\]]*)\]\(([^)]+)\)/.test(content);
  }
}

module.exports = {
  ImageProcessor
};
