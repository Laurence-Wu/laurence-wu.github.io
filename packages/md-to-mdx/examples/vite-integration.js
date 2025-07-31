/**
 * Vite integration example for MD to MDX Compiler
 */

// vite.config.js
export const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createMDToMDXPlugin } from '@kiro/md-to-mdx';

export default defineConfig({
  plugins: [
    react(),
    createMDToMDXPlugin({
      contentDir: './content',
      outputDir: './src/content',
      processors: {
        mermaid: {
          enabled: true,
          componentPath: '../components/Mermaid'
        },
        math: {
          enabled: true,
          inlineDelimiters: ['$', '$'],
          displayDelimiters: ['$$', '$$']
        },
        tables: {
          enabled: true,
          addResponsiveClasses: true
        },
        images: {
          enabled: true,
          autoDetect: true
        }
      },
      watch: true,
      hotReload: true,
      debug: process.env.NODE_ENV === 'development'
    })
  ],
  
  // Configure file handling
  assetsInclude: ['**/*.md', '**/*.mdx'],
  
  // Development server configuration
  server: {
    watch: {
      // Watch content directory for changes
      ignored: ['!**/content/**']
    }
  },
  
  // Build configuration
  build: {
    // Ensure MDX files are processed
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
`;

// Example React Mermaid component
export const reactMermaidComponent = `
// components/Mermaid.tsx
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  code: string;
  title?: string;
  className?: string;
}

const Mermaid: React.FC<MermaidProps> = ({ code, title, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, []);

  useEffect(() => {
    if (!diagramRef.current || !code) return;

    const renderDiagram = async () => {
      try {
        setError(null);
        const diagramId = \`mermaid-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
        
        // Validate and render the diagram
        const { svg } = await mermaid.render(diagramId, code);
        
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          
          // Add click handlers to SVG elements if needed
          const svgElement = diagramRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Mermaid rendering error:', err);
      }
    };

    renderDiagram();
  }, [code]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isFullscreen && event.key === 'Escape') {
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={\`mermaid-container \${className} \${isFullscreen ? 'fullscreen' : ''}\`}
      onKeyDown={handleKeyDown}
      tabIndex={isFullscreen ? 0 : -1}
    >
      {title && <h3 className="mermaid-title">{title}</h3>}
      
      <div className="mermaid-diagram">
        {error ? (
          <div className="mermaid-error">
            <h4>Diagram Rendering Error</h4>
            <pre>{error}</pre>
            <details>
              <summary>Original Code</summary>
              <pre>{code}</pre>
            </details>
          </div>
        ) : (
          <div 
            ref={diagramRef} 
            className="mermaid-content"
            style={{ transform: \`scale(\${scale})\` }}
          />
        )}
        
        <div className="mermaid-controls">
          <button 
            onClick={handleZoomIn} 
            title="Zoom In"
            disabled={scale >= 3}
          >
            🔍+
          </button>
          <button 
            onClick={handleZoomOut} 
            title="Zoom Out"
            disabled={scale <= 0.5}
          >
            🔍-
          </button>
          <button onClick={handleReset} title="Reset Zoom">
            ↻
          </button>
          <button onClick={handleFullscreen} title="Toggle Fullscreen">
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Mermaid;
`;

// CSS styles for Vite/React
export const mermaidStyles = `
/* styles/mermaid.css */
.mermaid-container {
  margin: 1rem 0;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mermaid-title {
  background: linear-gradient(135deg, #f6f8fa 0%, #e1e5e9 100%);
  padding: 0.75rem 1rem;
  margin: 0;
  border-bottom: 1px solid #e1e5e9;
  font-size: 1rem;
  font-weight: 600;
  color: #24292e;
}

.mermaid-diagram {
  position: relative;
  padding: 1.5rem;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
}

.mermaid-content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 100%;
  overflow: visible;
  transform-origin: center;
}

.mermaid-error {
  background: #ffeef0;
  border: 1px solid #fdaeb7;
  border-radius: 6px;
  padding: 1rem;
  text-align: left;
  max-width: 100%;
}

.mermaid-error h4 {
  color: #d73a49;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.mermaid-error pre {
  background: #f6f8fa;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.mermaid-error details {
  margin-top: 0.5rem;
}

.mermaid-error summary {
  cursor: pointer;
  font-weight: 600;
  color: #586069;
}

.mermaid-controls {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mermaid-diagram:hover .mermaid-controls,
.mermaid-diagram:focus-within .mermaid-controls {
  opacity: 1;
}

.mermaid-controls button {
  background: #f6f8fa;
  color: #24292e;
  border: 1px solid #d1d5da;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mermaid-controls button:hover:not(:disabled) {
  background: #e1e4e8;
  border-color: #c6cbd1;
  transform: translateY(-1px);
}

.mermaid-controls button:active {
  transform: translateY(0);
}

.mermaid-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mermaid-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border-radius: 0;
  margin: 0;
  border: none;
}

.mermaid-container.fullscreen .mermaid-diagram {
  height: 100vh;
  padding: 2rem;
  background: white;
}

.mermaid-container.fullscreen .mermaid-controls {
  top: 1rem;
  right: 1rem;
  opacity: 1;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .mermaid-container {
    background: #0d1117;
    border-color: #30363d;
  }
  
  .mermaid-title {
    background: linear-gradient(135deg, #161b22 0%, #21262d 100%);
    color: #f0f6fc;
    border-color: #30363d;
  }
  
  .mermaid-diagram {
    background: #0d1117;
  }
  
  .mermaid-controls {
    background: rgba(13, 17, 23, 0.9);
  }
  
  .mermaid-controls button {
    background: #21262d;
    color: #f0f6fc;
    border-color: #30363d;
  }
  
  .mermaid-controls button:hover:not(:disabled) {
    background: #30363d;
    border-color: #484f58;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .mermaid-diagram {
    padding: 1rem;
  }
  
  .mermaid-controls {
    position: static;
    opacity: 1;
    justify-content: center;
    margin-top: 1rem;
    background: transparent;
    box-shadow: none;
  }
  
  .mermaid-controls button {
    padding: 0.5rem;
    min-width: 2.5rem;
  }
}
`;

// Example App component
export const appComponent = `
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BlogPost from './components/BlogPost';
import BlogList from './components/BlogList';
import './styles/mermaid.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>My Blog</h1>
          <nav>
            <a href="/">Home</a>
            <a href="/blog">Blog</a>
          </nav>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
`;

// Example blog post component
export const blogPostComponent = `
// src/components/BlogPost.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Mermaid from './Mermaid';

// MDX components
const components = {
  Mermaid,
  // Add other custom components here
};

interface BlogPostData {
  source: MDXRemoteSerializeResult;
  frontmatter: {
    title: string;
    description?: string;
    publishDate?: string;
    tags?: string[];
  };
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [postData, setPostData] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, you'd fetch this from an API or import dynamically
        const response = await fetch(\`/content/blog/\${slug}.mdx\`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        
        const content = await response.text();
        
        // Parse frontmatter (you'd use gray-matter in a real app)
        const frontmatterMatch = content.match(/^---\\n([\\s\\S]*?)\\n---/);
        const frontmatter = frontmatterMatch 
          ? JSON.parse(frontmatterMatch[1]) 
          : {};
        
        const mdxContent = content.replace(/^---\\n[\\s\\S]*?\\n---\\n/, '');
        
        const mdxSource = await serialize(mdxContent);
        
        setPostData({
          source: mdxSource,
          frontmatter
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!postData) {
    return <div className="error">Post not found</div>;
  }

  return (
    <article className="blog-post">
      <header className="blog-header">
        <h1>{postData.frontmatter.title}</h1>
        {postData.frontmatter.description && (
          <p className="description">{postData.frontmatter.description}</p>
        )}
        {postData.frontmatter.publishDate && (
          <time className="publish-date" dateTime={postData.frontmatter.publishDate}>
            {new Date(postData.frontmatter.publishDate).toLocaleDateString()}
          </time>
        )}
        {postData.frontmatter.tags && postData.frontmatter.tags.length > 0 && (
          <div className="tags">
            {postData.frontmatter.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </header>
      
      <div className="blog-content">
        <MDXRemote {...postData.source} components={components} />
      </div>
    </article>
  );
};

export default BlogPost;
`;

// Package.json for Vite project
export const packageJson = `
{
  "name": "vite-mdx-blog",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "compile-md": "md-to-mdx compile --input ./content --output ./src/content"
  },
  "dependencies": {
    "@kiro/md-to-mdx": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "next-mdx-remote": "^4.4.1",
    "mermaid": "^10.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.27",
    "@types/react-dom": "^18.0.10",
    "@vitejs/plugin-react": "^3.1.0",
    "typescript": "^4.9.3",
    "vite": "^4.1.0"
  }
}
`;

// Development workflow
export const developmentWorkflow = `
# Vite Development Workflow

## 1. Project Setup
\`\`\`bash
npm create vite@latest my-mdx-blog -- --template react-ts
cd my-mdx-blog
npm install @kiro/md-to-mdx next-mdx-remote mermaid react-router-dom
\`\`\`

## 2. Configure Vite
Update \`vite.config.ts\` with the MD to MDX plugin configuration.

## 3. Create Content Structure
\`\`\`
content/
├── blog/
│   ├── getting-started.md
│   ├── advanced-features.md
│   └── mermaid-examples.md
└── pages/
    └── about.md
\`\`\`

## 4. Create Components
- Mermaid component for interactive diagrams
- BlogPost component for rendering MDX content
- BlogList component for listing posts

## 5. Development
\`\`\`bash
npm run dev
\`\`\`

The development server will:
- Watch for changes to .md files in the content directory
- Automatically compile them to .mdx in src/content
- Hot reload the browser when files change
- Show compilation errors in the console

## 6. Manual Compilation (if needed)
\`\`\`bash
npm run compile-md
\`\`\`

## 7. Build for Production
\`\`\`bash
npm run build
\`\`\`

All .md files will be compiled before the Vite build process.

## 8. Preview Production Build
\`\`\`bash
npm run preview
\`\`\`
`;

console.log('Vite Integration Examples:');
console.log('1. Configuration:', viteConfig);
console.log('2. React Mermaid Component:', reactMermaidComponent);
console.log('3. Styles:', mermaidStyles);
console.log('4. App Component:', appComponent);
console.log('5. Blog Post Component:', blogPostComponent);
console.log('6. Package.json:', packageJson);
console.log('7. Development Workflow:', developmentWorkflow);