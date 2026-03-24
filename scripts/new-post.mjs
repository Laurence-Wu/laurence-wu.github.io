#!/usr/bin/env node
/**
 * new-post — scaffold a new blog post
 * Usage: npm run new-post
 */

import { createInterface } from 'readline';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const CONTENT_DIR = new URL('../src/scratch', import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, '$1'); // Fix Windows path

const CATEGORIES = ['Research', 'Engineering', 'Learning Journal', 'Review', 'Personal'];

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

async function main() {
  console.log('\n📝  New Blog Post\n');

  const title = (await ask('Title: ')).trim();
  if (!title) { console.error('Title is required.'); process.exit(1); }

  const description = (await ask('Description (one line): ')).trim();

  console.log('\nCategories:');
  CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  const catIdx = parseInt(await ask('Category (number, or Enter to skip): '), 10);
  const category = CATEGORIES[catIdx - 1] ?? null;

  const tagsRaw = (await ask('Tags (comma-separated, e.g. research,AI-ML): ')).trim();
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const series = (await ask('Series name (Enter to skip): ')).trim() || null;
  let seriesOrder = null;
  if (series) {
    const ord = await ask('Part number in series: ');
    seriesOrder = parseInt(ord, 10) || 1;
  }

  rl.close();

  const slug = slugify(title);
  const dir = join(CONTENT_DIR, slug);

  if (existsSync(dir)) {
    console.error(`\n❌  Directory already exists: ${dir}`);
    process.exit(1);
  }

  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, 'images'), { recursive: true });

  const frontmatter = [
    '---',
    `title: "${title}"`,
    `description: "${description}"`,
    `pubDate: ${today()}`,
    `author: "Xiaoyou Wu"`,
    category ? `category: "${category}"` : null,
    tags.length ? `tags: [${tags.map(t => `"${t}"`).join(', ')}]` : 'tags: []',
    series ? `series: "${series}"` : null,
    seriesOrder !== null ? `seriesOrder: ${seriesOrder}` : null,
    `draft: true`,
    `thumbnail: "https://picsum.photos/seed/${slug}/400/300"`,
    '---',
  ].filter(l => l !== null).join('\n');

  const content = `${frontmatter}\n\n<!-- Write your post here -->\n`;
  const filePath = join(dir, 'index.md');
  writeFileSync(filePath, content, 'utf8');

  console.log(`\n✅  Created draft: ${filePath}`);
  console.log(`📁  Images folder: ${join(dir, 'images')}`);
  console.log(`\n💡  When ready to publish, ask the agent to run /publish-post`);

  // Try to open in VS Code
  try {
    execSync(`code "${filePath}"`, { stdio: 'ignore' });
  } catch {
    // VS Code not in PATH — that's fine
  }
}

main().catch(err => { console.error(err); process.exit(1); });
