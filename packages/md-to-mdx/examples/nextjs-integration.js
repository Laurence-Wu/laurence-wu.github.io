/**
 * Next.js integration example for MD to MDX Compiler
 */

// next.config.js
export const nextConfig = `
const { createMDToMDXPlugin } = require('@kiro/md-to-mdx');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for MDX
  experimental: {
    mdxRs: true,
  },
  
  // Configure webpack to use MD to MDX compiler
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add MD to MDX compilation
    config.plugins.push(
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
          }
        },
        watch: dev, // Enable watching in development
        hotReload: dev
      })
    );
    
    return config;
  },
  
  // Configure page extensions to include MDX
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

module.exports = nextConfig;
`;

// Example Mermaid component for Next.js
export const mermaidComponent = `
'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  code: string;
  title?: string;
}

export default function Mermaid({ code, title }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diagramRef.current) return;

    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    // Render the diagram
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render('mermaid-' + Date.now(), code);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = \`<pre class="error">Error rendering diagram: \${error.message}</pre>\`;
        }
      }
    };

    renderDiagram();
  }, [code]);

  const handleZoomIn = () => {
    if (diagramRef.current) {
      const currentScale = parseFloat(diagramRef.current.style.transform.replace('scale(', '').replace(')', '') || '1');
      diagramRef.current.style.transform = \`scale(\${currentScale * 1.2})\`;
    }
  };

  const handleZoomOut = () => {
    if (diagramRef.current) {
      const currentScale = parseFloat(diagramRef.current.style.transform.replace('scale(', '').replace(')', '') || '1');
      diagramRef.current.style.transform = \`scale(\${currentScale / 1.2})\`;
    }
  };

  const handleReset = () => {
    if (diagramRef.current) {
      diagramRef.current.style.transform = 'scale(1)';
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.classList.contains('fullscreen')) {
        containerRef.current.classList.remove('fullscreen');
      } else {
        containerRef.current.classList.add('fullscreen');
      }
    }
  };

  return (
    <div ref={containerRef} className="mermaid-container">
      {title && <h3 className="mermaid-title">{title}</h3>}
      <div className="mermaid-diagram">
        <div ref={diagramRef} className="mermaid-content" />
        <div className="mermaid-controls">
          <button onClick={handleZoomIn} title="Zoom In">🔍+</button>
          <button onClick={handleZoomOut} title="Zoom Out">🔍-</button>
          <button onClick={handleReset} title="Reset">↻</button>
          <button onClick={handleFullscreen} title="Fullscreen">⛶</button>
        </div>
      </div>
    </div>
  );
}
`;

// CSS styles for Mermaid component
export const mermaidStyles = `
/* styles/mermaid.css */
.mermaid-container {
  margin: 1rem 0;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.mermaid-title {
  background: #f6f8fa;
  padding: 0.5rem 1rem;
  margin: 0;
  border-bottom: 1px solid #e1e5e9;
  font-size: 1rem;
  font-weight: 600;
}

.mermaid-diagram {
  position: relative;
  padding: 1rem;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mermaid-content {
  transition: transform 0.3s ease;
  max-width: 100%;
  overflow: auto;
}

.mermaid-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mermaid-diagram:hover .mermaid-controls {
  opacity: 1;
}

.mermaid-controls button {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s ease;
}

.mermaid-controls button:hover {
  background: rgba(0, 0, 0, 0.9);
}

.mermaid-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  border-radius: 0;
  margin: 0;
}

.mermaid-container.fullscreen .mermaid-diagram {
  height: 100vh;
  padding: 2rem;
}

.error {
  color: #d73a49;
  background: #ffeef0;
  padding: 1rem;
  border-radius: 4px;
  font-family: monospace;
}
`;

// Example blog layout component
export const blogLayout = `
// components/BlogLayout.tsx
import { ReactNode } from 'react';
import Head from 'next/head';

interface BlogLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  publishDate?: string;
  tags?: string[];
}

export default function BlogLayout({ 
  children, 
  title, 
  description, 
  publishDate, 
  tags 
}: BlogLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
      </Head>
      
      <article className="blog-post">
        <header className="blog-header">
          <h1>{title}</h1>
          {description && <p className="description">{description}</p>}
          {publishDate && (
            <time className="publish-date" dateTime={publishDate}>
              {new Date(publishDate).toLocaleDateString()}
            </time>
          )}
          {tags && tags.length > 0 && (
            <div className="tags">
              {tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </header>
        
        <div className="blog-content">
          {children}
        </div>
      </article>
    </>
  );
}
`;

// Example dynamic blog page
export const dynamicBlogPage = `
// pages/blog/[...slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import BlogLayout from '../../components/BlogLayout';
import Mermaid from '../../components/Mermaid';

// MDX components
const components = {
  Mermaid,
  // Add other custom components here
};

interface BlogPostProps {
  source: MDXRemoteSerializeResult;
  frontmatter: {
    title: string;
    description?: string;
    publishDate?: string;
    tags?: string[];
  };
}

export default function BlogPost({ source, frontmatter }: BlogPostProps) {
  return (
    <BlogLayout
      title={frontmatter.title}
      description={frontmatter.description}
      publishDate={frontmatter.publishDate}
      tags={frontmatter.tags}
    >
      <MDXRemote {...source} components={components} />
    </BlogLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const contentDir = path.join(process.cwd(), 'src/content/blog');
  const files = fs.readdirSync(contentDir);
  
  const paths = files
    .filter(file => file.endsWith('.mdx'))
    .map(file => ({
      params: {
        slug: [file.replace('.mdx', '')]
      }
    }));

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string[];
  const filePath = path.join(process.cwd(), 'src/content/blog', \`\${slug[0]}.mdx\`);
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(fileContent);
  
  const mdxSource = await serialize(content);

  return {
    props: {
      source: mdxSource,
      frontmatter: data
    }
  };
};
`;

// Package.json dependencies
export const packageDependencies = `
{
  "dependencies": {
    "@kiro/md-to-mdx": "^1.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next-mdx-remote": "^4.4.1",
    "gray-matter": "^4.0.3",
    "mermaid": "^10.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
`;

// Development workflow
export const developmentWorkflow = `
# Next.js Development Workflow

## 1. Setup
\`\`\`bash
npm install @kiro/md-to-mdx next-mdx-remote gray-matter mermaid
\`\`\`

## 2. Create content structure
\`\`\`
content/
├── blog/
│   ├── my-first-post.md
│   └── advanced-features.md
└── pages/
    └── about.md
\`\`\`

## 3. Configure Next.js
Add the configuration to \`next.config.js\` as shown above.

## 4. Create components
- Mermaid component for diagrams
- BlogLayout for consistent styling
- Any other custom MDX components

## 5. Development
\`\`\`bash
npm run dev
\`\`\`

The compiler will:
- Watch for changes to .md files
- Automatically compile them to .mdx
- Trigger Next.js hot reload
- Show compilation errors in the console

## 6. Build for production
\`\`\`bash
npm run build
\`\`\`

All .md files will be compiled to .mdx before the Next.js build process.
`;

console.log('Next.js Integration Examples:');
console.log('1. Configuration:', nextConfig);
console.log('2. Mermaid Component:', mermaidComponent);
console.log('3. Styles:', mermaidStyles);
console.log('4. Blog Layout:', blogLayout);
console.log('5. Dynamic Page:', dynamicBlogPage);
console.log('6. Dependencies:', packageDependencies);
console.log('7. Workflow:', developmentWorkflow);