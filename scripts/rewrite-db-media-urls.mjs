#!/usr/bin/env node
/**
 * One-time migration: rewrite legacy Supabase Storage media URLs stored in the
 * database to their Backblaze B2 equivalents.
 *
 *   node scripts/rewrite-db-media-urls.mjs                     # dry run (default)
 *   node scripts/rewrite-db-media-urls.mjs --apply             # write changes
 *   node scripts/rewrite-db-media-urls.mjs --verify            # confirm none remain
 *   node scripts/rewrite-db-media-urls.mjs --restore <file>    # roll back from backup
 *
 * Design notes
 * - It imports the *production* resolver (src/utils/mediaUrl.ts) so the DB can
 *   never drift from what the app actually renders.
 * - Tables/columns are discovered from the PostgREST schema, so nothing that
 *   stores a media URL (including HTML content columns) is missed.
 * - A value is only touched if it contains a Supabase Storage path, so slugs,
 *   external links and plain text are never rewritten.
 * - `--apply` always writes a backup first; `--restore` puts the old values back.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment (.env.local).
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const MARKER = '/storage/v1/object/public/';
const HTML_RE = /<\/?[a-z]/i;
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

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { apply: false, verify: false, restore: null, limit: 10000, yes: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--verify') args.verify = true;
    else if (a === '--restore') args.restore = argv[++i];
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10) || 10000;
    else if (a === '-y' || a === '--yes') args.yes = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else {
      console.error(`Unknown option: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

function usage() {
  console.log(`
Rewrite legacy Supabase Storage media URLs in the database -> Backblaze B2.

  node scripts/rewrite-db-media-urls.mjs [--apply] [--verify] [--restore <file>]

Options:
  (none)          Dry run: show what would change, write nothing
  --apply         Write the changes (writes a backup to migration/ first)
  --verify        Re-scan every table and report remaining legacy URLs
  --restore FILE  Write the original values from a backup file back
  --limit N       Max rows fetched per table (default 10000)

Environment (.env.local):
  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
`);
}

// ---------------------------------------------------------------------------
// Supabase REST helpers (service role bypasses RLS)
// ---------------------------------------------------------------------------
function makeClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  const req = async (apiPath, init = {}) => {
    const res = await fetch(`${url}${apiPath}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${init.method || 'GET'} ${apiPath} -> ${res.status} ${body}`);
    }
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  return {
    schema: () => req('/rest/v1/'),
    select: (table, limit) => req(`/rest/v1/${encodeURIComponent(table)}?select=*&limit=${limit}`),
    update: (table, id, patch) =>
      req(`/rest/v1/${encodeURIComponent(table)}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
  };
}

// ---------------------------------------------------------------------------
// Value rewriting
// ---------------------------------------------------------------------------
function rewriteValue(value, resolveMediaUrl, resolveHtmlImages) {
  if (typeof value !== 'string') return null;
  if (!value.includes(MARKER)) return null;
  const next = HTML_RE.test(value) ? resolveHtmlImages(value) : resolveMediaUrl(value);
  return next !== value ? next : null;
}

function scanRow(row, resolveMediaUrl, resolveHtmlImages, changes, table) {
  const id = row.id;
  if (id === undefined || id === null) return false;

  let found = false;
  for (const [column, value] of Object.entries(row)) {
    const next = rewriteValue(value, resolveMediaUrl, resolveHtmlImages);
    if (next === null) continue;
    found = true;
    changes.push({ table, id, column, before: value, after: next });
  }
  return found;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    return;
  }

  const client = makeClient();
  const { resolveMediaUrl, resolveHtmlImages } = await import(
    pathToFileURL(path.join(repoRoot, 'src', 'utils', 'mediaUrl.ts')).href
  );

  // ---- restore mode -------------------------------------------------------
  if (args.restore) {
    const backupPath = path.resolve(args.restore);
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup not found: ${backupPath}`);
      process.exit(1);
    }
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const changes = backup.changes || [];
    console.log(`\nRestoring ${changes.length} value(s) from ${backupPath}\n`);
    let done = 0;
    for (const c of changes) {
      await client.update(c.table, c.id, { [c.column]: c.before });
      done++;
      process.stdout.write(`\r  restored ${done}/${changes.length}`);
    }
    process.stdout.write('\n');
    console.log('Restore complete.');
    return;
  }

  // ---- discover tables ----------------------------------------------------
  const schema = await client.schema();
  const definitions = schema.definitions || schema?.paths || {};
  const tables = Object.keys(definitions).filter((name) => {
    const def = definitions[name];
    return def && typeof def === 'object' && def.properties && def.properties.id;
  });

  if (!tables.length) {
    console.error('Could not discover tables from the PostgREST schema.');
    process.exit(1);
  }

  const mode = args.verify
    ? 'VERIFY'
    : args.apply
      ? 'APPLY'
      : 'DRY RUN';
  console.log(`\nDB media URL rewrite -> Backblaze B2`);
  console.log(`  mode   : ${mode}`);
  console.log(`  tables : ${tables.length} (${tables.join(', ')})\n`);

  // ---- scan ---------------------------------------------------------------
  const changes = [];
  let rowsScanned = 0;
  const perTable = [];

  for (const table of tables) {
    let rows;
    try {
      rows = await client.select(table, args.limit);
    } catch (err) {
      console.warn(`  ! skipping ${table}: ${err.message}`);
      continue;
    }
    if (!Array.isArray(rows)) continue;
    rowsScanned += rows.length;

    const tableChanges = [];
    for (const row of rows) {
      scanRow(row, resolveMediaUrl, resolveHtmlImages, tableChanges, table);
    }
    if (tableChanges.length) {
      changes.push(...tableChanges);
      perTable.push({ table, rows: rows.length, values: tableChanges.length });
    }
  }

  // ---- report -------------------------------------------------------------
  console.log(`Scanned ${rowsScanned} row(s) across ${tables.length} table(s).`);

  if (perTable.length) {
    console.log('\nValues containing legacy Supabase Storage URLs:');
    for (const { table, rows, values } of perTable) {
      console.log(`  ${table}: ${values} value(s) in ${rows} row(s)`);
    }
    console.log('\nSample:');
    for (const c of changes.slice(0, 8)) {
      const before = c.before.length > 110 ? `${c.before.slice(0, 110)}…` : c.before;
      const after = c.after.length > 110 ? `${c.after.slice(0, 110)}…` : c.after;
      console.log(`  ${c.table}.${c.column} (id ${c.id})`);
      console.log(`     - ${before}`);
      console.log(`     + ${after}`);
    }
    if (changes.length > 8) console.log(`  … and ${changes.length - 8} more`);
  } else {
    console.log('\nNo legacy Supabase Storage URLs found. Nothing to do.');
  }

  // ---- verify mode stops here --------------------------------------------
  if (args.verify) {
    const remaining = changes.length;
    console.log(
      remaining
        ? `\n✗ ${remaining} legacy URL(s) still present.`
        : '\n✓ No legacy Supabase Storage URLs remain in the database.'
    );
    process.exit(remaining ? 1 : 0);
  }

  if (!changes.length) return;

  // ---- apply --------------------------------------------------------------
  if (!args.apply) {
    console.log(
      `\nDry run — nothing written. Re-run with --apply to commit these ${changes.length} change(s).`
    );
    return;
  }

  // Backup first: always.
  fs.mkdirSync(DEFAULT_BACKUP_DIR, { recursive: true });
  const backupFile = path.join(
    DEFAULT_BACKUP_DIR,
    `db-media-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(
    backupFile,
    JSON.stringify({ generatedAt: new Date().toISOString(), changes }, null, 2)
  );
  console.log(`\nBackup written to ${backupFile}`);

  let ok = 0;
  const failures = [];
  for (const c of changes) {
    try {
      await client.update(c.table, c.id, { [c.column]: c.after });
      ok++;
      if (ok % 10 === 0) process.stdout.write(`\r  updated ${ok}/${changes.length}`);
    } catch (err) {
      failures.push({ ...c, error: err.message });
      process.stdout.write(`\r  ✗ ${c.table}.${c.column} (${c.id}): ${err.message}\n`);
    }
  }
  process.stdout.write('\n');

  console.log(`\nUpdated ${ok}/${changes.length} value(s).`);
  if (failures.length) {
    console.log(`Failures: ${failures.length}`);
    for (const f of failures) console.log(`  - ${f.table}.${f.column} (${f.id})`);
    console.log(`\nRoll back with: node scripts/rewrite-db-media-urls.mjs --restore "${backupFile}"`);
    process.exit(1);
  }
  console.log(`Roll back with: node scripts/rewrite-db-media-urls.mjs --restore "${backupFile}"`);
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
