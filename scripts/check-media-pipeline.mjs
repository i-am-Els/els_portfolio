#!/usr/bin/env node
/**
 * Static guard: media goes to Backblaze B2, and only to Backblaze B2.
 *
 * This app used to write images to Supabase Storage (1 GB free tier) and now
 * writes them to the `portfolio-elsrael` bucket through /api/b2/upload. That
 * swap is only safe while nothing can reach Supabase Storage any more, so this
 * scans the source tree for anything that would put bytes back there and fails
 * the build if it finds any.
 *
 * It is deliberately static — no network, no credentials, safe to run anywhere:
 *
 *   supabase.storage / .storage.from(   the Supabase Storage client itself
 *   getPublicUrl(                       resolving a Supabase Storage URL
 *   from '.../supabaseUpload'           the pre-B2 helper (deleted in 7aeadcb)
 *
 * `storage/v1/object/public` is legal in exactly one place — src/utils/mediaUrl.ts,
 * which is what rewrites those legacy URLs to B2 when reading them back out of
 * the database.
 *
 *   node scripts/check-media-pipeline.mjs      (npm run media:check)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(repoRoot, 'src');

/** The one file allowed to speak Supabase Storage, because it un-does it. */
const LEGACY_REWRITER = path.join('src', 'utils', 'mediaUrl.ts');

const FORBIDDEN = [
  { re: /supabase\s*\.\s*storage\b/, why: 'uses the Supabase Storage client' },
  { re: /\.storage\s*\.\s*from\s*\(/, why: 'opens a Supabase Storage bucket' },
  { re: /\bgetPublicUrl\s*\(/, why: 'resolves a Supabase Storage public URL' },
  { re: /from\s+['"][^'"]*supabaseUpload['"]/, why: 'imports the pre-B2 upload helper' },
  { re: /storage\/v1\/object\/public/, why: 'hard-codes a Supabase Storage URL path' },
];

/** Files that must exist — their absence means the B2 pipeline lost a piece. */
const REQUIRED = [
  path.join('src', 'utils', 'b2.ts'),
  path.join('src', 'utils', 'mediaPaths.ts'),
  path.join('src', 'utils', 'mediaUpload.ts'),
  path.join('src', 'utils', 'mediaUrl.ts'),
  path.join('src', 'app', 'api', 'b2', 'upload', 'route.ts'),
  path.join('src', 'app', 'api', 'b2', 'delete', 'route.ts'),
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) yield full;
  }
}

const problems = [];

for (const file of walk(srcRoot)) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
  const source = fs.readFileSync(file, 'utf8');

  for (const rule of FORBIDDEN) {
    // mediaUrl.ts is the sanctioned exception: it recognises those URLs in
    // order to rewrite them onto B2, and never writes to Supabase Storage.
    if (rel === LEGACY_REWRITER.replace(/\\/g, '/')) continue;
    const match = rule.re.exec(source);
    if (!match) continue;

    const line = source.slice(0, match.index).split('\n').length;
    problems.push(`${rel}:${line}  ${rule.why}`);
  }
}

for (const rel of REQUIRED) {
  if (!fs.existsSync(path.join(repoRoot, rel))) problems.push(`missing required file: ${rel}`);
}

// The public base must be the B2 bucket, not something left over.
const mediaUrl = fs.readFileSync(path.join(repoRoot, LEGACY_REWRITER), 'utf8');
if (!mediaUrl.includes('backblazeb2.com')) {
  problems.push('src/utils/mediaUrl.ts no longer points at backblazeb2.com');
}

if (problems.length) {
  console.error('Media pipeline is no longer B2-only:\n');
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\nAll image uploads must go through /api/b2/upload (src/utils/mediaUpload.ts).');
  process.exit(1);
}

console.log('OK — B2-only. No Supabase Storage usage anywhere in src/.');
