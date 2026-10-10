#!/usr/bin/env node
/**
 * Upload the locally-converted WebP image export to Backblaze B2.
 *
 * Zero external dependencies (Node 18+, native fetch + crypto).
 * Uses the B2 Native API so we only need a key ID + application key.
 *
 * Usage:
 *   node scripts/upload-media-to-b2.mjs --root "C:\\path\\to\\bucket" --dry-run
 *   node scripts/upload-media-to-b2.mjs --root "C:\\path\\to\\bucket"
 *   node scripts/upload-media-to-b2.mjs --root "C:\\path\\to\\bucket" --verify
 *
 * Env (read from .env.local / .env in the repo root, or the shell):
 *   B2_KEY_ID        (required)  application key ID
 *   B2_APP_KEY       (required)  application key secret
 *   B2_BUCKET        (optional)  default: portfolio-elsrael
 *   B2_DOWNLOAD_URL  (optional)  default: taken from the B2 authorize response
 *   MEDIA_ROOT       (optional)  default for --root
 *
 * Layout expected under <root>:
 *   project-images/**   -> <bucket>/project-images/**
 *   blog-images/**      -> <bucket>/blog-images/**
 *   images/**           -> <bucket>/images/**
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const AUTH_URL = 'https://api.backblazeb2.com/b2api/v3/b2_authorize_account';
const FOLDERS = ['project-images', 'blog-images', 'images'];
const MIME = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

// ---------------------------------------------------------------------------
// Env loading (no dotenv dependency)
// ---------------------------------------------------------------------------
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(repoRoot, file);
    if (!fs.existsSync(full)) continue;
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(full);
      } else {
        const text = fs.readFileSync(full, 'utf8');
        for (const line of text.split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
          if (!m || m[1] in process.env) continue;
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // ignore malformed env files
    }
  }
}
loadEnv();

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    root: process.env.MEDIA_ROOT,
    prefixes: [],
    concurrency: 6,
    dryRun: false,
    force: false,
    verify: false,
    skipExisting: true,
    cacheControl: 'public, max-age=31536000, immutable',
    mapOut: path.join(repoRoot, 'migration', 'media-map.json'),
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--root': args.root = argv[++i]; break;
      case '--prefix': args.prefixes.push(argv[++i]); break;
      case '--concurrency': args.concurrency = Math.max(1, parseInt(argv[++i], 10) || 6); break;
      case '--dry-run': args.dryRun = true; break;
      case '--force': args.force = true; break;
      case '--verify': args.verify = true; break;
      case '--no-skip': args.skipExisting = false; break;
      case '--cache-control': args.cacheControl = argv[++i]; break;
      case '--map-out': args.mapOut = argv[++i]; break;
      case '--help':
      case '-h': args.help = true; break;
      default:
        if (a.startsWith('--')) {
          console.error(`Unknown option: ${a}`);
          process.exit(1);
        }
    }
  }
  return args;
}

function usage() {
  console.log(`\nUpload local WebP export -> Backblaze B2 (native API)\n
  node scripts/upload-media-to-b2.mjs --root <dir> [options]

Options:
  --root <dir>          Directory containing project-images/, blog-images/, images/
  --prefix <name>       Only upload this prefix (repeatable). Default: all three
  --dry-run             List what would happen, upload nothing
  --force               Re-upload even if the object already exists
  --no-skip             Disable skip-existing (upload everything)
  --verify              List the bucket afterwards and compare counts/bytes
  --concurrency <n>     Parallel uploads (default 6)
  --cache-control <v>   Cache-Control header (default: 1 year immutable)
  --map-out <file>      Where to write the mapping JSON (default migration/media-map.json)

Required environment (.env.local):
  B2_KEY_ID, B2_APP_KEY
Optional:
  B2_BUCKET (default portfolio-elsrael), B2_DOWNLOAD_URL, MEDIA_ROOT
`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const b64 = (s) => Buffer.from(s).toString('base64');
const encodeFileName = (name) => name.split('/').map(encodeURIComponent).join('/');
const contentType = (key) => MIME[path.extname(key).toLowerCase()] || 'application/octet-stream';
const fmtBytes = (n) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
};

function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(full, rel));
    else if (entry.isFile()) out.push({ full, rel });
  }
  return out;
}

async function pool(items, limit, worker) {
  let idx = 0;
  let done = 0;
  const failures = [];
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const item = items[idx++];
      try {
        await worker(item, done + 1, items.length);
      } catch (err) {
        failures.push({ key: item.key, error: err.message });
        process.stdout.write(`\r  ✗ ${item.key}: ${err.message}\n`);
      } finally {
        done++;
        if (done % 10 === 0 || done === items.length) {
          process.stdout.write(`\r  progress ${done}/${items.length}`);
        }
      }
    }
  });
  await Promise.all(runners);
  process.stdout.write('\n');
  return failures;
}

// ---------------------------------------------------------------------------
// B2 native API
// ---------------------------------------------------------------------------
async function authorize(keyId, appKey) {
  const res = await fetch(AUTH_URL, {
    headers: { Authorization: `Basic ${b64(`${keyId}:${appKey}`)}` },
  });
  if (!res.ok) {
    throw new Error(`b2_authorize_account failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const storage = data.apiInfo?.storageApi;
  const apiUrl = storage?.apiUrl || data.apiUrl;
  const downloadUrl = storage?.downloadUrl || data.downloadUrl;
  const bucketId = storage?.bucketId || data.allowed?.bucketId;
  if (!apiUrl || !bucketId) {
    throw new Error('Could not determine apiUrl/bucketId from authorize response.');
  }
  return { token: data.authorizationToken, apiUrl, downloadUrl, bucketId };
}

async function getUploadUrl(auth) {
  const res = await fetch(`${auth.apiUrl}/b2api/v3/b2_get_upload_url`, {
    method: 'POST',
    headers: { Authorization: auth.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: auth.bucketId }),
  });
  if (!res.ok) {
    throw new Error(`b2_get_upload_url failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function uploadObject(auth, key, buf, cacheControl) {
  const upload = await getUploadUrl(auth);
  const sha1 = crypto.createHash('sha1').update(buf).digest('hex');
  const res = await fetch(upload.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: upload.authorizationToken,
      'X-Bz-File-Name': encodeFileName(key),
      'Content-Type': contentType(key),
      'X-Bz-Content-Sha1': sha1,
      'Cache-Control': cacheControl,
    },
    body: buf,
  });
  if (!res.ok) {
    throw new Error(`upload failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return { sha1, fileId: data.fileId, fileName: data.fileName };
}

async function listFiles(auth, prefix) {
  const files = new Map();
  let startFileName = null;
  do {
    const res = await fetch(`${auth.apiUrl}/b2api/v3/b2_list_file_names`, {
      method: 'POST',
      headers: { Authorization: auth.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucketId: auth.bucketId,
        prefix,
        maxFileCount: 10000,
        startFileName,
      }),
    });
    if (!res.ok) {
      throw new Error(`b2_list_file_names(${prefix}) failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    for (const f of data.files || []) files.set(f.fileName, f);
    startFileName = data.nextFileName;
  } while (startFileName);
  return files;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.root) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const bucket = process.env.B2_BUCKET || 'portfolio-elsrael';
  const hasCreds = Boolean(keyId && appKey);
  if (!hasCreds && !args.dryRun) {
    console.error('Missing B2_KEY_ID / B2_APP_KEY. Add them to .env.local or the environment.');
    process.exit(1);
  }

  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) {
    console.error(`Root directory not found: ${root}`);
    process.exit(1);
  }

  const selected = (args.prefixes.length ? args.prefixes : FOLDERS).filter((p) => FOLDERS.includes(p));
  if (!selected.length) {
    console.error(`No valid prefixes selected. Choose from: ${FOLDERS.join(', ')}`);
    process.exit(1);
  }

  console.log(`\nBackblaze B2 upload`);
  console.log(`  bucket : ${bucket}`);
  console.log(`  root   : ${root}`);
  console.log(`  folders: ${selected.join(', ')}`);
  console.log(`  mode   : ${args.dryRun ? 'DRY RUN' : 'UPLOAD'}\n`);

  // Collect work (no network needed)
  const jobs = [];
  let totalBytes = 0;
  for (const folder of selected) {
    const dir = path.join(root, folder);
    if (!fs.existsSync(dir)) {
      console.warn(`  ! skipping missing folder: ${dir}`);
      continue;
    }
    for (const { full, rel } of walk(dir)) {
      const size = fs.statSync(full).size;
      jobs.push({ key: `${folder}/${rel}`, full, size });
      totalBytes += size;
    }
  }
  console.log(`Found ${jobs.length} files (${fmtBytes(totalBytes)}).`);

  // Offline dry run: no credentials required
  if (args.dryRun && !hasCreds) {
    for (const job of jobs.slice(0, 200)) {
      console.log(`  would upload ${job.key}  (${fmtBytes(job.size)})`);
    }
    if (jobs.length > 200) console.log(`  ... and ${jobs.length - 200} more`);
    console.log(`\nDry run complete (offline, no credentials). ${jobs.length} file(s), ${fmtBytes(totalBytes)}.`);
    return;
  }

  const auth = await authorize(keyId, appKey);
  const publicBase = (process.env.B2_DOWNLOAD_URL || auth.downloadUrl || '').replace(/\/$/, '');
  console.log(`  endpoint : ${auth.apiUrl}`);
  console.log(`  public   : ${publicBase}/file/${bucket}/`);
  console.log(`  bucketId : ${auth.bucketId}\n`);

  // Skip-existing
  let toUpload = jobs;
  if (args.skipExisting && !args.force && !args.dryRun) {
    const existingByPrefix = new Map();
    for (const folder of selected) {
      try {
        existingByPrefix.set(folder, await listFiles(auth, `${folder}/`));
      } catch (err) {
        console.warn(`  ! could not list ${folder}, will upload all: ${err.message}`);
        existingByPrefix.set(folder, null);
      }
    }
    toUpload = jobs.filter((job) => {
      const prefix = job.key.split('/')[0];
      const existing = existingByPrefix.get(prefix);
      if (!existing) return true;
      const found = existing.get(job.key);
      return !found || Number(found.contentLength) !== job.size;
    });
    const skipped = jobs.length - toUpload.length;
    if (skipped) console.log(`Skipping ${skipped} already-present file(s).`);
  }

  if (args.dryRun) {
    for (const job of toUpload.slice(0, 200)) {
      console.log(`  would upload ${job.key}  (${fmtBytes(job.size)})`);
    }
    if (toUpload.length > 200) console.log(`  ... and ${toUpload.length - 200} more`);
    console.log(`\nDry run complete. ${toUpload.length} file(s), ${fmtBytes(toUpload.reduce((s, j) => s + j.size, 0))}.`);
    return;
  }

  // Upload
  const startedAt = Date.now();
  const uploaded = [];
  const failures = await pool(toUpload, args.concurrency, async (job) => {
    const buf = fs.readFileSync(job.full);
    const res = await uploadObject(auth, job.key, buf, args.cacheControl);
    uploaded.push({ key: job.key, size: job.size, sha1: res.sha1, url: `${publicBase}/file/${bucket}/${job.key}` });
  });

  const uploadedBytes = uploaded.reduce((s, u) => s + u.size, 0);
  const secs = ((Date.now() - startedAt) / 1000).toFixed(1);

  // Write mapping
  const map = {
    bucket,
    publicBase: `${publicBase}/file/${bucket}`,
    generatedAt: new Date().toISOString(),
    files: uploaded.reduce((acc, u) => {
      acc[u.key] = { size: u.size, sha1: u.sha1, url: u.url };
      return acc;
    }, {}),
  };
  fs.mkdirSync(path.dirname(args.mapOut), { recursive: true });
  fs.writeFileSync(args.mapOut, JSON.stringify(map, null, 2));

  console.log(`\nUploaded ${uploaded.length}/${toUpload.length} file(s), ${fmtBytes(uploadedBytes)} in ${secs}s.`);
  if (failures.length) {
    console.log(`Failures: ${failures.length}`);
    for (const f of failures) console.log(`  - ${f.key}: ${f.error}`);
  }
  console.log(`Mapping written to ${args.mapOut}`);

  // Verify
  if (args.verify) {
    console.log('\nVerifying remote objects...');
    for (const folder of selected) {
      const remote = await listFiles(auth, `${folder}/`);
      const local = jobs.filter((j) => j.key.startsWith(`${folder}/`));
      const localBytes = local.reduce((s, j) => s + j.size, 0);
      let remoteBytes = 0;
      let mismatched = 0;
      for (const j of local) {
        const r = remote.get(j.key);
        if (!r) { mismatched++; continue; }
        remoteBytes += Number(r.contentLength);
        if (Number(r.contentLength) !== j.size) mismatched++;
      }
      const missing = local.length - local.filter((j) => remote.has(j.key)).length;
      console.log(
        `  ${folder}: local ${local.length} (${fmtBytes(localBytes)}) | remote ${local.length - missing} present` +
        ` | missing ${missing} | size-mismatch ${mismatched}`
      );
    }
  }

  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
