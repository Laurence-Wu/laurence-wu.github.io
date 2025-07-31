// TypeScript definitions for MD to MDX Compiler

export interface FileMetadata {
  filePath: string;
  outputPath: string;
  relativePath: string;
  lastModified: Date;
  content: string;
  frontmatter: Record<string, any>;
  contentHash: string;
  processingStatus: 'pending' | 'processing' | 'complete' | 'error';
  hasChanged?: boolean;
}

export interface TransformationContext {
  sourceFile: string;
  content: string;
  frontmatter: Record<string, any>;
  metadata: FileMetadata;
  options: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface ProcessorConfig {
  name: string;
  enabled: boolean;
  priority: number;
  options: Record<string, any>;
  patterns?: RegExp[];
}

export interface CompilerConfig {
  contentDir: string;
  outputDir: string;
  include: string[];
  exclude: string[];
  processors: {
    standard: ProcessorConfig;
    mermaid: ProcessorConfig;
    math: ProcessorConfig;
    tables: ProcessorConfig;
    images: ProcessorConfig;
  };
  maxConcurrency: number;
  batchSize: number;
  watch: boolean;
  hotReload: boolean;
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface CompilationResult {
  file: string;
  outputFile: string;
  status: 'success' | 'error' | 'skipped';
  errors?: Error[];
  warnings?: string[];
  stats?: {
    originalSize: number;
    outputSize: number;
    processingTime: number;
    memoryUsed: number;
  };
}

export interface CompilationSummary {
  total: number;
  success: number;
  errors: number;
  warnings: number;
  skipped: number;
}

export interface PerformanceReport {
  totalTime: number;
  filesProcessed: number;
  averageTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export interface CompileAllResult {
  success: boolean;
  files: CompilationResult[];
  summary: CompilationSummary;
  performance: PerformanceReport;
}

// Processor interfaces
export interface Processor {
  name: string;
  priority: number;
  enabled: boolean;
  process(content: string, context: TransformationContext): Promise<{
    content: string;
    success: boolean;
    errors?: Error[];
    warnings?: string[];
  }>;
}

// Main compiler class
export class MDToMDXCompiler {
  constructor(userConfig?: Partial<CompilerConfig>);
  
  initialize(): Promise<void>;
  compileAll(): Promise<CompileAllResult>;
  compileFile(fileData: FileMetadata): Promise<CompilationResult>;
  startWatching(): Promise<() => void>;
  getStats(): Record<string, any>;
  getHotReloadManager(): any;
  destroy(): void;
}

// Core components
export class MDScanner {
  constructor(contentDir: string, options?: {
    include?: string[];
    exclude?: string[];
  });
  
  scanFiles(): Promise<FileMetadata[]>;
  watchFiles(callback: (event: string, filePath: string, fileData?: FileMetadata) => void): () => void;
  getFileList(): FileMetadata[];
  updateFileStatus(filePath: string, status: string, error?: Error): void;
  destroy(): void;
}

export class ContentTransformer {
  constructor(options?: {
    continueOnError?: boolean;
    validateOutput?: boolean;
  });
  
  addProcessor(processor: Processor): void;
  removeProcessor(processorName: string): void;
  transform(filePath: string, content: string, metadata: FileMetadata): Promise<{
    content: string;
    success: boolean;
    context: TransformationContext;
  }>;
  getStats(): Record<string, any>;
}

export class MDXGenerator {
  constructor(outputDir: string, options?: Record<string, any>);
  
  generate(filePath: string, frontmatter: Record<string, any>, content: string): Promise<void>;
  ensureOutputDirectory(filePath: string): Promise<void>;
  writeFile(outputPath: string, mdxContent: string): Promise<void>;
}

// Processors
export class StandardProcessor implements Processor {
  name: string;
  priority: number;
  enabled: boolean;
  
  constructor(config?: ProcessorConfig);
  process(content: string, context: TransformationContext): Promise<{
    content: string;
    success: boolean;
    errors?: Error[];
    warnings?: string[];
  }>;
}

export class MermaidProcessor implements Processor {
  name: string;
  priority: number;
  enabled: boolean;
  
  constructor(config?: ProcessorConfig);
  process(content: string, context: TransformationContext): Promise<{
    content: string;
    success: boolean;
    errors?: Error[];
    warnings?: string[];
  }>;
}

export class MathProcessor implements Processor {
  name: string;
  priority: number;
  enabled: boolean;
  
  constructor(config?: ProcessorConfig);
  process(content: string, context: TransformationContext): Promise<{
    content: string;
    success: boolean;
    errors?: Error[];
    warnings?: string[];
  }>;
}

export class TableProcessor implements Processor {
  name: string;
  priority: number;
  enabled: boolean;
  
  constructor(config?: ProcessorConfig);
  process(content: string, context: TransformationContext): Promise<{
    content: string;
    success: boolean;
    errors?: Error[];
    warnings?: string[];
  }>;
}

export class ImageProcessor implements Processor {
  name: string;
  priority: number;
  enabled: boolean;
  
  constructor(config?: ProcessorConfig);
  process(content: string, context: TransformationContext): Promise<{
    content: string;
    success: boolean;
    errors?: Error[];
    warnings?: string[];
  }>;
}

// Error classes
export class ProcessingError extends Error {
  file?: string;
  line?: number;
  column?: number;
  processor?: string;
  originalError?: Error;
  
  constructor(options: {
    message: string;
    file?: string;
    line?: number;
    column?: number;
    processor?: string;
    originalError?: Error;
  });
}

export class ValidationError extends Error {
  field?: string;
  value?: any;
  
  constructor(options: {
    message: string;
    field?: string;
    value?: any;
  });
}

export class FileSystemError extends Error {
  file?: string;
  operation?: string;
  originalError?: Error;
  
  constructor(options: {
    message: string;
    file?: string;
    operation?: string;
    originalError?: Error;
  });
}

// Utility functions
export function createCompiler(userConfig?: Partial<CompilerConfig>): MDToMDXCompiler;
export function compileAll(userConfig?: Partial<CompilerConfig>): Promise<CompileAllResult>;
export function loadConfig(userConfig?: Partial<CompilerConfig>): Promise<CompilerConfig>;
export function validateConfig(config: Partial<CompilerConfig>): CompilerConfig;

// Plugin for build systems
export function createMDToMDXPlugin(options?: Partial<CompilerConfig>): any;

// Logger
export interface Logger {
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  child(meta: Record<string, any>): Logger;
}

export const logger: Logger;

// Default configuration
export const defaultConfig: CompilerConfig;

// Default export
declare const _default: {
  MDToMDXCompiler: typeof MDToMDXCompiler;
  createCompiler: typeof createCompiler;
  compileAll: typeof compileAll;
  MDScanner: typeof MDScanner;
  ContentTransformer: typeof ContentTransformer;
  MDXGenerator: typeof MDXGenerator;
  createMDToMDXPlugin: typeof createMDToMDXPlugin;
  StandardProcessor: typeof StandardProcessor;
  MermaidProcessor: typeof MermaidProcessor;
  MathProcessor: typeof MathProcessor;
  TableProcessor: typeof TableProcessor;
  ImageProcessor: typeof ImageProcessor;
  ProcessingError: typeof ProcessingError;
  ValidationError: typeof ValidationError;
  FileSystemError: typeof FileSystemError;
  logger: Logger;
  loadConfig: typeof loadConfig;
  validateConfig: typeof validateConfig;
  defaultConfig: CompilerConfig;
};

export default _default;