#!/usr/bin/env node
/**
 * update-thumbnails.mjs
 *
 * Replaces placeholder thumbnails in blog frontmatter with semantically
 * matched images from public AI/image APIs.
 *
 * API priority:
 *   1. OpenVerse  — free, no key, Creative Commons, works reliably
 *   2. Lexica.art — free, no key, Stable Diffusion AI images
 *   3. Unsplash   — requires free UNSPLASH_ACCESS_KEY in .env for API mode
 *
 * Usage:
 *   npm run update-thumbnails              # update all placeholder thumbnails
 *   npm run update-thumbnails:dry          # preview without writing
 *   npm run update-thumbnails:force        # overwrite all thumbnails
 *   node scripts/update-thumbnails.mjs --slug QAT-Implementation
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOGS_DIR  = join(__dirname, '../src/content/blogs');
const RATE_MS    = 600;

// ─── CLI ───────────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const FORCE     = args.includes('--force');
const slugIdx   = args.indexOf('--slug');
const ONLY_SLUG = slugIdx !== -1 ? args[slugIdx + 1] : null;

// ─── Frontmatter ───────────────────────────────────────────────────────────────
const normalize = s => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const FM_RE     = /^---\n([\s\S]*?)\n---/;

function parseMd(raw) {
  const src = normalize(raw);
  const m   = src.match(FM_RE);
  if (!m) return { fm: {}, body: src };
  return { fm: yaml.load(m[1]) ?? {}, body: src.slice(m[0].length) };
}

function serializeMd(fm, body) {
  const fmStr = yaml.dump(fm, { lineWidth: 160, quotingType: '"', noRefs: true });
  return `---\n${fmStr.trimEnd()}\n---${body}`;
}

// ─── Query builder ─────────────────────────────────────────────────────────────
const STOP = new Set([
  'with','from','this','that','for','and','the','are','how','why','what','into',
  'over','when','then','also','been','have','will','your','our','guide','part',
  'post','blog','notes','week','using','about','through','approach','make','some',
  'than','its','not','all','can','use','per','intro','review','journal','report',
  'ultimate','implementation','progress','evaluation','strategy','preparation',
  'systems','method','methods','based','analysis','design','learning',
]);

/**
 * Map narrow technical terms to broader visual concepts that image databases
 * actually have photos of.
 */
const VISUAL_MAP = {
  'quantization':      'computer chip silicon wafer',
  'neural network':    'artificial intelligence brain visualization',
  'machine learning':  'data science abstract visualization',
  'diffusion':         'abstract generative art gradient',
  'transformer':       'neural network architecture diagram',
  'gpu':               'graphics card computer hardware',
  'llm':               'artificial intelligence language',
  'inference':         'computing server datacenter',
  'algorithm':         'mathematics code abstract',
  'systemverilog':     'circuit board chip electronics',
  'verilog':           'circuit board chip electronics',
  'fpga':              'circuit board chip electronics',
  'hardware':          'electronics circuit board technology',
  'matrix':            'mathematics grid pattern abstract',
  'triton':            'gpu computing parallel processing',
  'interview':         'person whiteboard coding',
  'mamba':             'deep learning sequence model',
  'attention':         'neural network diagram abstract',
  'pytorch':           'deep learning training visualization',
  'python':            'code programming screen',
  'rick morty':        'science fiction animation characters',
  'positional encoding':'waveform signal pattern',
};

function buildQuery(fm) {
  const stripSpecial = (s = '') =>
    s.replace(/[&":?,()\[\]{}\/#]/g, ' ').replace(/\s+/g, ' ').trim();

  const title = stripSpecial(fm.title ?? '').toLowerCase();
  const tags  = (Array.isArray(fm.tags) ? fm.tags : [])
    .map(t => stripSpecial(t).toLowerCase())
    .join(' ');

  // Check for visual map matches first (most reliable for image search)
  for (const [term, visual] of Object.entries(VISUAL_MAP)) {
    if (title.includes(term) || tags.includes(term)) {
      return visual;
    }
  }

  // Fall back to title keyword extraction
  const titleKws = stripSpecial(fm.title ?? '')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP.has(w.toLowerCase()))
    .slice(0, 4);

  const tagKws = (Array.isArray(fm.tags) ? fm.tags : [])
    .map(t => stripSpecial(t))
    .filter(t => t.length >= 3)
    .slice(0, 2);

  const combined = [...new Set([...titleKws, ...tagKws])];
  return combined.join(' ').trim() ||
    stripSpecial(fm.title ?? '').split(/\s+/).slice(0, 4).join(' ');
}

// ─── Deduplication registry ────────────────────────────────────────────────────
const usedUrls = new Set();

// ─── OpenVerse API (primary — free, no key) ────────────────────────────────────
async function openverseSearch(query, pageOffset = 1) {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('license_type', 'commercial');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('page', String(pageOffset));
  url.searchParams.set('mature', 'false');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'thumbnail-updater/2.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`OpenVerse HTTP ${res.status}`);

  const { results = [] } = await res.json();
  if (!results.length) return null;

  // Pick best landscape image not already used
  const candidates = results
    .filter(r => r.url && r.width && r.height && !usedUrls.has(r.url))
    .map(r => ({ url: r.url, score: Math.abs(r.width / r.height - 1.78) }))
    .sort((a, b) => a.score - b.score);

  return candidates[0]?.url ?? null;
}

// ─── Lexica.art (secondary — free, AI images) ──────────────────────────────────
async function lexicaSearch(query) {
  const res = await fetch(
    `https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}&n=20`,
    { headers: { 'User-Agent': 'thumbnail-updater/2.0' }, signal: AbortSignal.timeout(12000) }
  );
  if (!res.ok) throw new Error(`Lexica HTTP ${res.status}`);

  const { images = [] } = await res.json();
  const safe = images.filter(i => !i.nsfw);
  if (!safe.length) return null;

  const best = safe
    .map(i => ({ url: i.srcSmall ?? i.src, score: Math.abs(i.width / (i.height || 1) - 1.78) }))
    .sort((a, b) => a.score - b.score)[0];

  return best?.url ?? null;
}

// ─── Unsplash API (tertiary — free key required) ───────────────────────────────
async function unsplashSearch(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const url = new URL('https://api.unsplash.com/photos/random');
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('client_id', key);

  const res = await fetch(url.toString(), {
    headers: { 'Accept-Version': 'v1' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.urls?.regular ?? null;
}

// ─── Orchestrator ──────────────────────────────────────────────────────────────
async function findImage(query) {
  const simpleQuery = query.split(' ').slice(0, 2).join(' ');

  // OpenVerse: try pages 1–3 to find a fresh (unused) image
  for (let page = 1; page <= 3; page++) {
    try {
      const url = await openverseSearch(query, page);
      if (url) { usedUrls.add(url); return { url, source: 'openverse' }; }
    } catch (e) {
      if (page === 1) console.warn(`      ⚠ openverse: ${e.message}`);
      break;
    }
  }

  // Retry openverse with a simpler query if needed
  if (simpleQuery !== query) {
    for (let page = 1; page <= 2; page++) {
      try {
        const url = await openverseSearch(simpleQuery, page);
        if (url) { usedUrls.add(url); return { url, source: 'openverse-broad' }; }
      } catch (_) { break; }
    }
  }

  // Lexica fallback
  try {
    const url = await lexicaSearch(query);
    if (url && !usedUrls.has(url)) { usedUrls.add(url); return { url, source: 'lexica' }; }
  } catch (e) {
    console.warn(`      ⚠ lexica: ${e.message}`);
  }

  // Unsplash fallback (requires key)
  try {
    const url = await unsplashSearch(query);
    if (url && !usedUrls.has(url)) { usedUrls.add(url); return { url, source: 'unsplash' }; }
  } catch (e) {
    console.warn(`      ⚠ unsplash: ${e.message}`);
  }

  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const sleep        = ms => new Promise(r => setTimeout(r, ms));
const isPlaceholder = url =>
  !url || url.includes('picsum.photos') || url.includes('source.unsplash.com');
const short = (s, n = 74) => s.length > n ? s.slice(0, n) + '…' : s;

// ─── Main ──────────────────────────────────────────────────────────────────────
const pattern = ONLY_SLUG
  ? `${BLOGS_DIR}/**/${ONLY_SLUG}/index.md`
  : `${BLOGS_DIR}/**/index.md`;

const files = (await glob(pattern, { windowsPathsNoEscape: true })).sort();

console.log('\n🖼  Blog Thumbnail Updater');
console.log(`   Mode   : ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
console.log(`   APIs   : OpenVerse → Lexica.art → Unsplash`);
console.log(`   Posts  : ${files.length}\n`);

let updated = 0, skipped = 0, failed = 0;

for (const file of files) {
  const { fm, body } = parseMd(readFileSync(file, 'utf-8'));
  const slug = file.split(/[\\/]/).slice(-2, -1)[0];

  if (!FORCE && !isPlaceholder(fm.thumbnail ?? '')) {
    console.log(`  ─ SKIP  [${slug}]`);
    skipped++;
    continue;
  }

  const query = buildQuery(fm);
  console.log(`  → [${slug}]  "${fm.title ?? ''}"`);
  console.log(`    query  : ${query}`);

  const result = await findImage(query);

  if (!result) {
    console.log(`    ✗ no image found\n`);
    failed++;
    await sleep(RATE_MS);
    continue;
  }

  console.log(`    ✓ [${result.source}] ${short(result.url)}\n`);

  if (!DRY_RUN) {
    fm.thumbnail = result.url;
    writeFileSync(file, serializeMd(fm, body), 'utf-8');
  }

  updated++;
  await sleep(RATE_MS);
}

console.log(`Done — updated: ${updated}  skipped: ${skipped}  failed: ${failed}`);
if (DRY_RUN) console.log('(dry run — no files written)');
if (!process.env.UNSPLASH_ACCESS_KEY)
  console.log('Tip: add UNSPLASH_ACCESS_KEY=<key> to .env for Unsplash fallback.');
