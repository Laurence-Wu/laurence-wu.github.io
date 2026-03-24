# Scratch — Draft Markdown Staging Area

Drop rough draft blog posts here before publishing. Each draft gets its own folder:

```
src/scratch/
└── my-new-post/
    ├── index.md        ← Your draft markdown
    └── images/         ← Drop images here
        ├── diagram.png
        └── photo.jpg
```

## How to Publish

Ask the agent to run `/publish-post` — it will automatically:

1. **Add Table of Contents** from your headings
2. **Fix Mermaid diagrams** — ensure proper sizing/wrapping
3. **Convert raw URLs** to proper `[text](url)` hyperlinks
4. **Grammar check** the prose
5. **Validate frontmatter** — fill in missing fields, set `draft: false`
6. **Move** the finalized post + images into `src/content/blogs/{year}/{slug}/`

## Frontmatter Template

```yaml
---
title: "Your Post Title"
description: "One-line summary"
pubDate: 2025-03-23
author: "Xiaoyou Wu"
tags: ["tag1", "tag2"]
draft: true
---
```

> **Tip:** You can leave `thumbnail`, `category`, `image` blank — the publish workflow will handle defaults.
