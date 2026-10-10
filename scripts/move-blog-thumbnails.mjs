#!/usr/bin/env node
/**
 * Move each blog post's FEATURED image out of .../content/ and into .../thumbnail/.
 *
 * The folder convention is:
 *   blog-images/{blogId}/thumbnail/   featured image   (blog_posts.image_url)
 *   blog-images/{blogId}/content/     images embedded in blog_posts.content
 *
 * The blog form used to upload featured images into content/ as well, so only
 * one post ended up laid out correctly. This straightens that out without
 * breaking anything:
 *
 *   - before moving, it checks the filename isn't ALSO referenced by any post's
 *     HTML (an image can be both the featured image and an inline image);
 *   - B2 has no rename, so a move is "upload a copy to the new key, then hide
 *     the original" — the original stops being reachable immediately.
 *
 *   node scripts/move-blog-thumbnails.mjs            # dry run (default)
 *   node scripts/move-blog-thumbnails.mjs --apply    # write changes
 *
 * Writes a backup of the old image_url values before changing anything.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and B2_KEY_ID/B2_APP_KEY in .env.local.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_BACKUP_DIR = path.join(repoRoot, 'migration');

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full)) continue;
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(full);
      } else {
        for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
          if (!m || m[1] in process.env) continue;
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* ignore malformed env files */
    }
  }
}
loadEnv();

const APPLY = process.argv.includes('--apply');

const SUPA = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const { B2_PUBLIC_BASE, uploadObject, deleteObject, listObjects } = await import(
  `file://${path.join(repoRoot, 'src', 'utils', 'b2.ts').replace(/\\/g, '/')}`
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Any media URL (legacy Supabase or B2) -> `bucket/key.webp` */
function keyOf(url) {
  if (!url) return null;
  let m = /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/(.+)$/.exec(url);
  let rest = m ? m[1] : null;
  if (!rest && url.startsWith(`${B2_PUBLIC_BASE}/`)) rest = url.slice(B2_PUBLIC_BASE.length + 1);
  if (!rest) return null;
  rest = decodeURIComponent(rest);
  const i = rest.indexOf('/');
  if (i === -1) return null;
  const bucket = rest.slice(0, i);
  let key = rest.slice(i + 1);
  if (key.startsWith(`${bucket}/`)) key = key.slice(bucket.length + 1); // dup prefix
  return `${bucket}/${key}`;
}

async function supabase(pathAndQuery, init = {}) {
  const res = await fetch(`${SUPA}${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${res.status} ${pathAndQuery}: ${text}`);
  return data;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

const posts = await supabase('/rest/v1/blog_posts?select=id,title,image_url,content');

// Every filename that ANY post's body references, so we never break an inline
// image that happens to double as a featured image.
const filenamesInContent = new Set();
for (const post of posts) {
  for (const m of (post.content || '').matchAll(/<img[^>]*\ssrc=["']([^"']+)["']/gi)) {
    const k = keyOf(m[1]);
    if (k) filenamesInContent.add(k.split('/').pop());
  }
}

const bucketFiles = await listObjects('blog-images/');
const existing = new Set(bucketFiles.map((o) => o.key));

const moves = [];
const skipped = [];

for (const post of posts) {
  const key = keyOf(post.image_url);
  if (!key) {
    skipped.push({ id: post.id, reason: 'no featured image' });
    continue;
  }
  if (!key.startsWith('blog-images/')) {
    skipped.push({ id: post.id, reason: `not a blog image: ${key}` });
    continue;
  }
  if (key.includes('/thumbnail/')) {
    skipped.push({ id: post.id, reason: `already correct: ${key}` });
    continue;
  }
  if (!key.includes('/content/')) {
    skipped.push({ id: post.id, reason: `unexpected folder: ${key}` });
    continue;
  }

  const target = key.replace('/content/', '/thumbnail/');
  const fileName = key.split('/').pop();

  if (filenamesInContent.has(fileName)) {
    skipped.push({ id: post.id, reason: `CONFLICT — ${fileName} is also used inline in a post body` });
    continue;
  }
  if (existing.has(target)) {
    skipped.push({ id: post.id, reason: `target already exists: ${target}` });
    continue;
  }

  moves.push({ id: post.id, title: post.title, from: key, to: target });
}

console.log(`\nBlog posts: ${posts.length}`);
console.log(`Moves planned: ${moves.length}`);
for (const m of moves) {
  console.log(`\n  ${m.title || '(untitled)'}`);
  console.log(`    from ${m.from}`);
  console.log(`    to   ${m.to}`);
}

if (skipped.length) {
  console.log(`\nSkipped (${skipped.length}):`);
  for (const s of skipped) console.log(`  ${String(s.id).slice(0, 8)}  ${s.reason}`);
}

// Projects were audited separately: all 5 already live under .../thumbnail/.
const projectFiles = await listObjects('project-images/');
console.log(`\nproject-images files: ${projectFiles.length}`);
for (const p of projectFiles) console.log(`  ${p.key}`);
const misplacedProjects = projectFiles.filter((o) => !o.key.includes('/thumbnail/'));
console.log(
  `project images NOT under thumbnail/: ${misplacedProjects.length}` +
    (misplacedProjects.length ? ` -> ${misplacedProjects.map((o) => o.key).join(', ')}` : '')
);

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to move these.');
  process.exit(0);
}

if (!moves.length) {
  console.log('\nNothing to move.');
  process.exit(0);
}

fs.mkdirSync(DEFAULT_BACKUP_DIR, { recursive: true });
const backupFile = path.join(
  DEFAULT_BACKUP_DIR,
  `blog-thumbnail-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
);
fs.writeFileSync(
  backupFile,
  JSON.stringify(
    moves.map((m) => ({ id: m.id, title: m.title, image_url: `${B2_PUBLIC_BASE}/${m.from}` })),
    null,
    2
  )
);
console.log(`\nBackup written: ${backupFile}`);

let done = 0;
for (const move of moves) {
  const res = await fetch(`${B2_PUBLIC_BASE}/${move.from}`);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${move.from}`);
  const body = Buffer.from(await res.arrayBuffer());

  await uploadObject(move.to, body, 'image/webp');
  await supabase(`/rest/v1/blog_posts?id=eq.${move.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ image_url: `${B2_PUBLIC_BASE}/${move.to}` }),
  });
  const hidden = await deleteObject(move.from);

  done += 1;
  console.log(`  [${done}/${moves.length}] moved -> ${move.to} (original ${hidden.method})`);
}

console.log('\nDone.');
