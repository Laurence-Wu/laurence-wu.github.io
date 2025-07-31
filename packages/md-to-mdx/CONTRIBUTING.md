# Contributing to MD to MDX Compiler

Thank you for your interest in contributing to the MD to MDX Compiler! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/md-to-mdx.git
   cd md-to-mdx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── index.js                 # Main entry point
├── cli.js                   # CLI tool
├── md-to-mdx-compiler.js    # Core compiler
├── md-scanner.js            # File scanner
├── content-transformer.js   # Content transformation
├── mdx-generator.js         # MDX file generation
├── config.js                # Configuration management
├── logger.js                # Logging utilities
├── errors.js                # Error classes
├── performance.js           # Performance monitoring
├── hot-reload.js            # Hot reload functionality
├── processors/              # Content processors
│   ├── standard-processor.js
│   ├── mermaid-processor.js
│   ├── math-processor.js
│   ├── table-processor.js
│   └── image-processor.js
├── __tests__/               # Test files
└── examples/                # Usage examples
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(mermaid): add zoom controls to diagrams
fix(scanner): handle symlinks correctly
docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/__tests__/md-scanner.test.js
```

### Writing Tests

- Place test files in `src/__tests__/`
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both success and error cases

Example test:
```javascript
describe('MermaidProcessor', () => {
  test('should transform mermaid code blocks', async () => {
    // Arrange
    const processor = new MermaidProcessor();
    const content = '```mermaid\ngraph TD\nA --> B\n```';
    
    // Act
    const result = await processor.process(content, {});
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.content).toContain('<Mermaid');
  });
});
```

### Test Categories

1. **Unit Tests**: Test individual functions/classes
2. **Integration Tests**: Test component interactions
3. **Performance Tests**: Test performance characteristics
4. **CLI Tests**: Test command-line interface

## Code Style

### JavaScript Style

- Use ES6+ features where appropriate
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Follow existing code patterns

### Formatting

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Documentation

- Add JSDoc comments for all public methods
- Include parameter types and return types
- Provide usage examples for complex functions
- Update README.md for user-facing changes

Example JSDoc:
```javascript
/**
 * Transform markdown content to MDX format
 * @param {string} content - The markdown content to transform
 * @param {Object} context - Transformation context
 * @param {string} context.filePath - Source file path
 * @returns {Promise<{content: string, success: boolean}>} Transformation result
 */
async transform(content, context) {
  // Implementation
}
```

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following our style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a descriptive title
   - Explain what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Adding New Processors

To add a new content processor:

1. **Create processor file**
   ```javascript
   // src/processors/my-processor.js
   class MyProcessor {
     constructor(config = {}) {
       this.name = 'my-processor';
       this.priority = 100;
       this.enabled = config.enabled !== false;
     }

     async process(content, context) {
       // Your processing logic
       return {
         content: processedContent,
         success: true
       };
     }
   }

   module.exports = { MyProcessor };
   ```

2. **Add to main exports**
   ```javascript
   // src/index.js
   const { MyProcessor } = require('./processors/my-processor');
   
   module.exports = {
     // ... other exports
     MyProcessor
   };
   ```

3. **Add to compiler**
   ```javascript
   // src/md-to-mdx-compiler.js
   case 'my-processor':
     processor = new MyProcessor(processorConfig);
     break;
   ```

4. **Add tests**
   ```javascript
   // src/__tests__/my-processor.test.js
   describe('MyProcessor', () => {
     // Your tests
   });
   ```

5. **Update documentation**
   - Add to README.md
   - Add example usage
   - Update TypeScript definitions

## Performance Guidelines

- Profile code changes with performance tests
- Avoid blocking operations in hot paths
- Use streaming for large files
- Implement proper error handling
- Monitor memory usage

## Release Process

1. **Version Bump**
   ```bash
   npm version patch|minor|major
   ```

2. **Update Changelog**
   - Add new version section
   - List all changes
   - Follow Keep a Changelog format

3. **Create Release**
   - Push tags to GitHub
   - Create GitHub release
   - CI/CD will handle NPM publishing

## Getting Help

- **Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Discord**: Join our community chat
- **Email**: Contact maintainers directly

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page
- Annual contributor highlights

Thank you for contributing to MD to MDX Compiler! 🎉