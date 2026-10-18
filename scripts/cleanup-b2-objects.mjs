#!/usr/bin/env node
/**
 * Clean the `portfolio-elsrael` bucket of leftovers, without ever touching
 * something the database still points at.
 *
 * Every category below is derived from `b2_list_file_versions` (which, unlike
 * b2_list_file_names, also returns HIDE MARKERS — the 0 KB entries that show up
 * in the Backblaze console) cross-checked against every media URL stored in
 * Supabase.
 *
 * Categories
 *   hidden    a key with a hide marker; removing it clears the 0 KB entry and
 *             any version still sitting underneath it
 *   duplicate a blog-images/{id}/content/ file whose name also exists under
 *             .../thumbnail/ and isn't referenced by any post body — i.e. the
 *             old copy of a featured image that scripts/move-blog-thumbnails
 *             relocated
 *   junk      filenames left behind by ad-hoc probes (probe*, *-probe-*, …)
 *   orphan    referenced by nothing in the database but otherwise legitimate;
 *             REPORTED ONLY unless you pass --include-orphans
 *
 *   node scripts/cleanup-b2-objects.mjs                          # dry run
 *   node scripts/cleanup-b2-objects.mjs --apply                  # remove 1-3
 *   node scripts/cleanup-b2-objects.mjs --apply --include-orphans
 *
 * Deletion goes through src/utils/b2.ts, which hard-deletes each object version
 * via B2's S3 endpoint — so nothing is left behind as a 0 KB marker.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY, B2_KEY_ID and B2_APP_KEY in .env.local.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

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
const INCLUDE_ORPHANS = process.argv.includes('--include-orphans');

const SUPA = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const { B2_PUBLIC_BASE, deleteObject, listObjects } = await import(
  `file://${path.join(repoRoot, 'src', 'utils', 'b2.ts').replace(/\\/g, '/')}`
);

const basic = 'Basic ' +
  Buffer.from(`${process.env.B2_KEY_ID}:${process.env.B2_APP_KEY}`).toString('base64');
const auth = await (
  await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    headers: { Authorization: basic },
  })
).json();
const storage = auth.apiInfo?.storageApi ?? auth;

async function listVersions() {
  const out = [];
  let startFileName, startFileId;
  for (;;) {
    const body = { bucketId: storage.bucketId, maxFileCount: 1000 };
    if (startFileName) body.startFileName = startFileName;
    if (startFileId) body.startFileId = startFileId;
    const r = await fetch(`${storage.apiUrl}/b2api/v3/b2_list_file_versions`, {
      method: 'POST',
      headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`list_file_versions ${r.status}: ${JSON.stringify(data)}`);
    out.push(...(data.files || []));
    startFileName = data.nextFileName;
    startFileId = data.nextFileId;
    if (!startFileName && !startFileId) return out;
  }
}

const versions = await listVersions();
const uploads = versions.filter((v) => v.action === 'upload');
const hides = versions.filter((v) => v.action === 'hide');

// --- what the database actually references ---------------------------------
const q = async (p) =>
  (await fetch(`${SUPA}${p}`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } })).json();
const referenced = new Set();
const addUrl = (url) => {
  if (!url) return;
  if (url.startsWith(`${B2_PUBLIC_BASE}/`)) referenced.add(url.slice(B2_PUBLIC_BASE.length + 1));
};
for (const p of await q('/rest/v1/blog_posts?select=id,image_url,content')) {
  addUrl(p.image_url);
  for (const m of (p.content || '').matchAll(/<img[^>]*\ssrc=["']([^"']+)["']/gi)) addUrl(m[1]);
}
for (const p of await q('/rest/v1/projects?select=id,image_url,description')) {
  addUrl(p.image_url);
  for (const m of (p.description || '').matchAll(/<img[^>]*\ssrc=["']([^"']+)["']/gi)) addUrl(m[1]);
}
for (const p of await q('/rest/v1/profile?select=id,image_url')) addUrl(p.image_url);
// The gallery table (migration 20261011000000) holds a URL per gallery image.
// Missing this used to misclassify every live gallery file as an orphan.
for (const p of await q('/rest/v1/project_images?select=image_url')) addUrl(p.image_url);

// --- classify --------------------------------------------------------------
const uploadNames = new Set(uploads.map((u) => u.fileName));
const hiddenKeys = new Set(hides.map((h) => h.fileName));
const JUNK_RE = /\/(?:probe[\w.-]*|[\w.-]*-probe-[\w.-]+|lifecycle-probe[\w.-]*|s3-probe[\w.-]*|ver-probe[\w.-]*)$/i;

const category = new Map(); // key -> category

for (const key of uploadNames) {
  if (hiddenKeys.has(key)) { category.set(key, 'hidden'); continue; }
  if (JUNK_RE.test(key)) { category.set(key, 'junk'); continue; }
  const m = /^(blog-images\/[^/]+\/)content\/([^/]+)$/.exec(key);
  if (m && uploadNames.has(`${m[1]}thumbnail/${m[2]}`) && !referenced.has(key)) {
    category.set(key, 'duplicate'); continue;
  }
  if (!referenced.has(key)) category.set(key, 'orphan');
}
for (const key of hiddenKeys) if (!category.has(key)) category.set(key, 'hidden');

// --- report ----------------------------------------------------------------
const byCat = {};
for (const [key, cat] of category) (byCat[cat] = byCat[cat] || []).push(key);

console.log(`Bucket objects : ${uploads.length} uploads, ${hides.length} hide markers (0 KB)`);
console.log(`Referenced by DB: ${referenced.size}`);
console.log('');

for (const cat of ['hidden', 'duplicate', 'junk', 'orphan']) {
  const list = (byCat[cat] || []).sort();
  console.log(`${cat.toUpperCase()} (${list.length})`);
  for (const k of list) {
    const size = uploads.find((u) => u.fileName === k);
    console.log(`   ${(size ? `${(Number(size.contentLength) / 1024).toFixed(1)} KB` : '0 KB (marker)').padStart(11)}  ${k}`);
  }
  console.log('');
}

const removable = [...(byCat.hidden || []), ...(byCat.duplicate || []), ...(byCat.junk || [])]
  .concat(INCLUDE_ORPHANS ? byCat.orphan || [] : []);

if (!APPLY) {
  console.log(`Would remove ${removable.length} object(s).`);
  if (!INCLUDE_ORPHANS) {
    console.log(`(orphan: ${(byCat.orphan || []).length} — reported only; pass --include-orphans to remove)`);
  }
  console.log('Dry run. Re-run with --apply.');
  process.exit(0);
}

if (!removable.length) {
  console.log('Nothing to remove.');
  process.exit(0);
}

let done = 0;
for (const key of removable.sort()) {
  const result = await deleteObject(key);
  done += 1;
  console.log(`  [${done}/${removable.length}] ${result.method.padEnd(6)} ${key}`);
}

const after = await listVersions();
console.log(`\nRemaining: ${after.filter((v) => v.action === 'upload').length} objects, ${after.filter((v) => v.action === 'hide').length} hide markers`);
