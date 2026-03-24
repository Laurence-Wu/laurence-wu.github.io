---
description: Polish a draft markdown post from src/scratch and publish it to src/content/blogs
---

# Publish Post Workflow

Automate the full pipeline: polish a draft in `src/scratch/{post-name}/` and move it to `src/content/blogs/{year}/{slug}/`.

// turbo-all

## Prerequisites

- The draft must be in `src/scratch/{post-name}/index.md`
- Images (if any) should be in `src/scratch/{post-name}/images/`

---

## Step 1: Identify the Draft

1. List `src/scratch/` to find the draft folder (ignore `README.md`)
2. Read the draft's `index.md`
3. If multiple drafts exist, ask the user which one to publish

---

## Step 2: Add Table of Contents

1. Scan all `##` and `###` headings in the markdown body (after frontmatter)
2. Generate a TOC section using this format and insert it right after the frontmatter `---`:

```markdown
## Table of Contents
- [Heading Text](#heading-anchor)
  - [Sub Heading](#sub-heading-anchor)
```

3. Anchors: lowercase the heading, replace spaces with `-`, strip special characters
4. **Skip** if a `## Table of Contents` section already exists

---

## Step 3: Fix Mermaid Diagram Sizing

1. Find all ` ```mermaid ` code blocks
2. Check if they are already wrapped in a `<div class="mermaid-wrapper">`
3. If NOT wrapped, the Astro config's `remarkMermaid` plugin handles this at build time — **no manual wrapping needed**
4. **Do check** that the mermaid syntax is valid:
   - Ensure node labels with special characters are quoted: `id["Label (info)"]`
   - Ensure no raw HTML tags in labels
   - Ensure subgraph labels are quoted if they contain spaces

---

## Step 4: Convert Raw URLs to Hyperlinks

1. Scan the markdown body (skip code blocks and frontmatter)
2. Find bare URLs matching pattern: `https?://[^\s)>\]]+` that are NOT already inside `[text](url)` or `<url>` syntax
3. Convert each to: `[domain.com/path](full-url)`
   - Extract a readable label: use the domain + first path segment
   - Example: `https://stanfordasl.github.io/projects/` → `[stanfordasl.github.io/projects](https://stanfordasl.github.io/projects/)`
4. Also fix malformed link syntax like `(text)[url]` → `[text](url)`

---

## Step 5: Grammar and Spelling Check

1. Read through all prose sections (skip code blocks, frontmatter, tables)
2. Fix obvious issues:
   - Spelling errors
   - Missing articles (a/an/the)
   - Subject-verb agreement
   - Sentence fragments
   - Double spaces, trailing whitespace
3. **Preserve** the author's voice and technical terminology
4. **Flag** (as markdown comments `<!-- REVIEW: ... -->`) any changes you're unsure about
5. Do NOT modify:
   - Code blocks
   - Math expressions (`$...$` or `$$...$$`)
   - Frontmatter values
   - Table data cells

---

## Step 6: Validate and Complete Frontmatter

1. Check required fields exist in the YAML frontmatter:

| Field | Required | Default if missing |
|-------|----------|--------------------|
| `title` | ✅ Yes | ❌ Error — ask user |
| `description` | ✅ Yes | ❌ Error — ask user |
| `pubDate` | ✅ Yes | Today's date |
| `author` | ✅ Yes | `"Xiaoyou Wu"` |
| `tags` | ✅ Yes | `[]` |
| `thumbnail` | Optional | `"https://picsum.photos/seed/{slug}/400/300"` |
| `category` | Optional | Leave absent |
| `draft` | ✅ Set | **Set to `false`** (publish) |

2. Validate `tags` values are from known tags (check existing posts), warn if new tag
3. Validate `pubDate` is a valid date

---

## Step 7: Move to Content Folder

1. Determine the target path:
   - Year = `pubDate`'s year
   - Slug = folder name from scratch (or slugify the title)
   - Target: `src/content/blogs/{year}/{slug}/`

2. Create the target directory: `src/content/blogs/{year}/{slug}/`

3. Move files:
   - `index.md` → `src/content/blogs/{year}/{slug}/index.md`
   - `images/*` → `src/content/blogs/{year}/{slug}/images/`

4. Update image references in `index.md`:
   - Any absolute paths → relative `./images/filename.ext`
   - Any `../../` paths → relative `./images/filename.ext`
   - If `image:` field in frontmatter points to an image in `images/`, update to relative

5. Delete the empty scratch folder: `src/scratch/{post-name}/`

---

## Step 8: Verify

1. Run `npm run build` to ensure no broken references
2. Check the blog listing page loads the new post
3. Report the published URL path to the user: `/blog/{year}/{slug}/`
