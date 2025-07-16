# Personal Website Project Structure & Feature Guide

## 🏗️ Project Overview

This is a modern personal website built with **Astro 5**, featuring a blog system, project showcase, and mathematical content rendering. The site prioritizes performance, maintainability, and excellent developer experience.

### Key Technologies
- **Astro 5**: Static site generator with component islands
- **TypeScript**: Type safety and better developer experience  
- **Markdown/MDX**: Content authoring with frontmatter
- **KaTeX**: Mathematical equation rendering
- **Mermaid**: Diagram and flowchart generation
- **GitHub Actions**: Automated deployment to GitHub Pages

---

## 📁 Project Structure

```
PersonalWebsite/
├── 🚀 Core Application
│   ├── astro.config.mjs           # Astro configuration
│   ├── package.json               # Dependencies and scripts
│   ├── tsconfig.json              # TypeScript configuration
│   └── .github/workflows/         # CI/CD pipeline
│
├── 📝 Source Code (src/)
│   ├── components/                # Reusable UI components
│   │   ├── Layout.astro          # Page layout wrapper  
│   │   ├── Navigation.astro      # Site navigation
│   │   ├── MathBlock.astro       # Mathematical content
│   │   └── Mermaid.astro         # Diagram rendering
│   │
│   ├── content/                   # Content collections
│   │   ├── config.ts             # Content schema definitions
│   │   ├── blog/                 # Blog posts (Markdown/MDX)
│   │   └── projects/             # Project documentation
│   │
│   ├── layouts/                   # Page layout templates
│   │   ├── BaseLayout.astro      # Base HTML structure
│   │   └── BlogPost.astro        # Blog post template
│   │
│   ├── pages/                     # Site pages (file-based routing)
│   │   ├── index.astro           # Homepage
│   │   ├── about.astro           # About page
│   │   ├── contact.astro         # Contact page
│   │   ├── profile.astro         # Profile page
│   │   ├── blog/                 # Blog system
│   │   │   ├── index.astro       # Blog listing page
│   │   │   └── [...slug].astro   # Dynamic blog post pages
│   │   └── projects/             # Project system
│   │       ├── index.astro       # Projects listing
│   │       └── [...slug].astro   # Dynamic project pages
│   │
│   ├── styles/                    # Global styling
│   │   └── global.css            # Design system & variables
│   │
│   └── utils/                     # Utility functions
│       └── date.ts               # Date formatting helpers
│
├── 📦 Generated Output
│   ├── docs/                     # Built site (GitHub Pages)
│   └── public/                   # Static assets
│
└── 🗃️ Legacy Code
    ├── legacy/                   # Previous React/Flask implementation
    └── my-react-app/            # Legacy React components
```

---

## 🎯 How to Add Features

### ✍️ Adding Blog Posts

1. **Create a new markdown file** in `src/content/blog/`:
   ```bash
   touch src/content/blog/my-new-post.md
   ```

2. **Add frontmatter and content**:
   ```markdown
   ---
   title: "My Awesome Blog Post"
   description: "A brief description of what this post covers"
   pubDate: 2025-01-16
   author: "Your Name"
   tags: ["technology", "engineering", "tutorial"]
   draft: false
   ---

   # My Awesome Blog Post

   Your content here with full Markdown support!

   ## Mathematical Equations
   You can include math: $E = mc^2$

   ## Code Blocks
   ```javascript
   console.log("Hello, world!");
   ```

   ## Mermaid Diagrams
   ```mermaid
   graph TD
       A[Start] --> B[Process]
       B --> C[End]
   ```
   ```

3. **The post will automatically appear** on the blog page and be accessible via `/blog/my-new-post/`

### 🚀 Adding Projects

1. **Create a project file** in `src/content/projects/`:
   ```bash
   touch src/content/projects/my-cool-project.md
   ```

2. **Add project details**:
   ```markdown
   ---
   title: "My Cool Project"
   description: "An innovative solution to an engineering problem"
   pubDate: 2025-01-16
   tags: ["React", "TypeScript", "Hardware"]
   image: "/assets/project-image.jpg"
   ---

   # Project Overview
   
   Detailed description of your project...
   ```

3. **Project will appear** on `/projects/` and be accessible via `/projects/my-cool-project/`

### 📄 Adding New Pages

1. **Create an `.astro` file** in `src/pages/`:
   ```bash
   touch src/pages/my-new-page.astro
   ```

2. **Use the base layout**:
   ```astro
   ---
   import BaseLayout from '../layouts/BaseLayout.astro';
   ---

   <BaseLayout title="My New Page" description="Description for SEO">
     <div class="container">
       <h1>My New Page</h1>
       <p>Page content goes here</p>
     </div>
   </BaseLayout>

   <style>
     /* Page-specific styles */
   </style>
   ```

3. **Add navigation link** in `src/components/Navigation.astro`:
   ```astro
   <a href={getUrl('/my-new-page')} class={`navbar-link ${isActive('/my-new-page', currentPath) ? 'active' : ''}`}>
     My Page
   </a>
   ```

### 🧩 Creating Components

1. **Create component file** in `src/components/`:
   ```bash
   touch src/components/MyComponent.astro
   ```

2. **Define the component**:
   ```astro
   ---
   export interface Props {
     title: string;
     content?: string;
   }

   const { title, content = "Default content" } = Astro.props;
   ---

   <div class="my-component">
     <h2>{title}</h2>
     <p>{content}</p>
     <slot />
   </div>

   <style>
     .my-component {
       /* Component styles */
     }
   </style>
   ```

3. **Use in any page**:
   ```astro
   ---
   import MyComponent from '../components/MyComponent.astro';
   ---

   <MyComponent title="Hello" content="World" />
   ```

### 🎨 Adding Custom Styling

**The design system uses CSS custom properties defined in `src/styles/global.css`:**

```css
:root {
  /* Your color palette */
  --sage-green: #8A9A7E;
  --warm-neutral: #F4E9D8;
  --deep-navy: #2E3A59;
  --gold-accent: #FFD700;
  
  /* Typography */
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Montserrat', sans-serif;
  --font-accent: 'Cormorant Garamond', serif;
}
```

**To add new styles:**
1. Use existing CSS variables for consistency
2. Add component-specific styles in `<style>` blocks
3. Follow the established naming conventions

---

## 🛠️ Development Workflow

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev                 # Opens http://localhost:4321

# Build for production
npm run build              # Outputs to ./docs/

# Preview production build
npm run preview

# Run Astro CLI commands
npm run astro -- --help
```

### Adding Dependencies

```bash
# Add a new package
npm install package-name

# Add development dependency
npm install -D package-name

# Add Astro integration
npm run astro add integration-name
```

### Content Collections Schema

**Modify content types in `src/content/config.ts`:**

```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    // Add new fields here
    featured: z.boolean().optional(),
    series: z.string().optional(),
  }),
});
```

---

## 🚀 Deployment Process

### Automated Deployment (Current Setup)

1. **Push to main branch** triggers GitHub Actions
2. **Astro builds** the site to `./docs/`
3. **GitHub Pages** serves from the `docs/` folder
4. **Site is live** at your GitHub Pages URL

### Manual Deployment

```bash
# Build the site
npm run build

# Commit and push the docs/ folder
git add docs/
git commit -m "Deploy: Update site"
git push origin main
```

### Deployment Configuration

**Key files:**
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `astro.config.mjs` - Site and base URL configuration

---

## 🧪 Advanced Features

### Mathematical Content
- **KaTeX integration** for LaTeX math rendering
- **Inline math**: `$E = mc^2$`
- **Block math**: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`

### Diagram Support
- **Mermaid diagrams** with custom theming
- **Flowcharts, sequences, class diagrams**, etc.
- **Styled to match** your site's color scheme

### Content Features
- **Frontmatter validation** with Zod schemas
- **Draft posts** (won't appear in production)
- **Tag-based organization**
- **SEO-optimized** meta tags and structured data

### Performance Features
- **Zero JavaScript by default**
- **Optimized images and assets**
- **Static site generation**
- **Excellent Lighthouse scores**

---

## 🔧 Configuration Files

### `astro.config.mjs`
```javascript
export default defineConfig({
  site: 'https://username.github.io',
  base: '/',
  outDir: './docs',
  
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    sitemap()
  ]
});
```

### `package.json` Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build locally

---

## 📚 Best Practices

### Content Organization
- Use **descriptive filenames** for blog posts and projects
- Add **comprehensive frontmatter** for better SEO
- Organize **related content** with consistent tags

### Component Design
- Keep **components focused** and reusable
- Use **TypeScript interfaces** for props
- Follow **Astro's component patterns**

### Performance
- **Optimize images** before adding to public/
- **Minimize JavaScript** usage
- **Use Astro's static generation** for best performance

### SEO & Accessibility
- Add **descriptive meta tags** to all pages
- Use **semantic HTML** structure
- Include **alt text** for images
- Test with **screen readers**

---

## 🆘 Troubleshooting

### Common Issues

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf node_modules/ package-lock.json
npm install
npm run build
```

**Navigation not updating:**
- Check `baseUrl` configuration in `astro.config.mjs`
- Verify URL helper functions in components

**Content not appearing:**
- Verify frontmatter schema matches `config.ts`
- Check file is in correct content collection folder
- Ensure `draft: false` for published content

---

This structure provides a solid foundation for building and extending your personal website. The modular architecture makes it easy to add new features while maintaining performance and developer experience. 