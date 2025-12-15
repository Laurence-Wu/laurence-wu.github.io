# Detailed Refactoring Plan

This plan is divided into three parts: first, we'll fix the build and content rendering; second, we'll reorganize the code and file structure; and third, we'll refactor the components for better modularity.

---

### **Part 1: Build & Content Dependencies**

#### **1.1. Standardize Mermaid Diagram Rendering**

*   **Problem:** The current setup uses a combination of a custom `remark-typora-mermaid` plugin and a large, inefficient inline script in `BaseLayout.astro` to render Mermaid diagrams. This is complex and not standard.
*   **Proposed Solution:** We will adopt the official `astro-mermaid` integration for a simpler and more maintainable solution.
*   **Implementation Steps:**
    1.  Install the `astro-mermaid` package: `npm install astro-mermaid mermaid`.
    2.  Remove the `remark-typora-mermaid` plugin from `astro.config.mjs`.
    3.  Add the `astro-mermaid` integration to `astro.config.mjs`.
        ```javascript
        import mermaid from 'astro-mermaid';
        export default defineConfig({
          integrations: [
            mermaid({
              // Options can be configured here
            })
          ]
        });
        ```
    4.  Delete the custom Mermaid rendering script from `BaseLayout.astro`.
    5.  Verify that existing Mermaid diagrams in markdown files render correctly.

#### **1.2. Streamline KaTeX Math Formula Rendering**

*   **Problem:** `BaseLayout.astro` contains redundant scripts for loading and rendering KaTeX, while `astro.config.mjs` already correctly configures `rehype-katex`. This adds unnecessary client-side load.
*   **Proposed Solution:** Remove the redundant client-side scripts and rely on the server-side rendering provided by `rehype-katex`.
*   **Implementation Steps:**
    1.  In `BaseLayout.astro`, remove the `<script>` tags that load `katex.min.js` and `auto-render.min.js` from the CDN.
    2.  Remove the inline `<script>` that calls `renderMathInDocument()`.
    3.  Confirm that the `remark-math` and `rehype-katex` plugins in `astro.config.mjs` are correctly configured.
    4.  Test a page with math formulas to ensure they are still rendering correctly.

---

### **Part 2: Code & File Structure**

#### **2.1. Consolidate and Organize Styles**

*   **Problem:** Styles are scattered between global files, component-scoped styles, and a `custom-overrides.css` file.
*   **Proposed Solution:** Centralize the core design system and remove redundant or misplaced style rules.
*   **Implementation Steps:**
    1.  **Audit and Merge:** Review the rules in `src/styles/custom-overrides.css`. Move any truly global styles (e.g., typography, layout defaults) into `src/styles/global.css`. Move component-specific overrides into the `<style>` block of the relevant `.astro` component.
    2.  **Delete `custom-overrides.css`:** Once all its rules have been migrated, delete this file and remove its `@import` from `BaseLayout.astro`.
    3.  **Variable-Only Styles:** Ensure that all style blocks only use CSS variables for colors, fonts, and spacing, and do not contain hardcoded values.

#### **2.2. Organize Utility Functions**

*   **Problem:** Utility functions exist in both `/src/lib` and `/src/utils`. This is redundant.
*   **Proposed Solution:** Consolidate all utility functions into the `/src/utils` directory.
*   **Implementation Steps:**
    1.  Move the contents of `src/lib/utils.ts` to `src/utils/`.
    2.  Delete the `src/lib` directory.
    3.  Update any import paths that were pointing to `/src/lib`.

#### **2.3. Clean Up Asset and Script Duplication**

*   **Problem:** There are duplicate files, such as `mermaid-renderer.js` in both `public/scripts` and `src/scripts`.
*   **Proposed Solution:** Remove the duplicated files and rely on a single source of truth.
*   **Implementation Steps:**
    1.  After migrating to `astro-mermaid`, both `mermaid-renderer.js` files should be obsolete. I will delete both `public/scripts/mermaid-renderer.js` and `src/scripts/mermaid-renderer.js`.
    2.  Review the contents of the `public` directory and compare it with `src/assets` (if it exists) and `docs` to identify and remove any other unnecessary duplicates.

---

### **Part 3: Component Refactoring**

#### **3.1. Refactor Large Components**

*   **Problem:** Some components like `Navigation.astro` and `ProjectTimeline.astro` could be more modular.
*   **Proposed Solution:** Break them down where appropriate.
*   **Implementation Steps:**
    *   **`Navigation.astro`:** This component is relatively simple now. The main improvement will be to ensure all its styles are self-contained and use the global CSS variables.
    *   **`ProjectTimeline.astro`:** I will analyze this component to see if it can be broken into smaller pieces, for example, a `TimelineItem.astro` component.

#### **3.2. Create a UI Component Library**

*   **Problem:** Common UI elements like cards and buttons are styled within larger components, leading to code duplication.
*   **Proposed Solution:** Create a library of reusable UI components in `src/components/ui`.
*   **Implementation Steps:**
    1.  **Card Component:** Create a `Card.astro` component in `src/components/ui` that provides a consistent wrapper with props for `title`, `description`, etc.
    2.  **Button Component:** The project already has a `button.tsx` file. I will investigate its usage and see if it can be used more consistently, or if a simpler `.astro` button component would be better.
    3.  **Refactor existing pages:** Replace the ad-hoc card and button styles in pages like `blog/index.astro` and `projects/index.astro` with the new UI components.
