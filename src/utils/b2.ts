/**
 * Server-side Backblaze B2 client using the native B2 API — no SDK.
 *
 * ⚠️ Reads B2_KEY_ID / B2_APP_KEY. Import ONLY from route handlers / server code,
 * never from a client component.
 *
 * Bucket: `portfolio-elsrael`, object keys look like:
 *   blog-images/{blogId}/thumbnail/{name}.webp     featured image
 *   blog-images/{blogId}/content/{name}.webp       inline images
 *   project-images/{projectId}/thumbnail/{name}.webp
 *   images/{profileId}.webp
 */
import { createHash } from 'node:crypto';

const AUTH_URL = 'https://api.backblazeb2.com/b2api/v3/b2_authorize_account';
const API_V3 = '/b2api/v3';
const AUTH_TTL_MS = 9 * 60 * 1000;

/** Public base for reading objects back. Kept in sync with src/utils/mediaUrl.ts. */
export const B2_PUBLIC_BASE = (
  process.env.NEXT_PUBLIC_B2_PUBLIC_URL ||
  'https://f005.backblazeb2.com/file/portfolio-elsrael'
).replace(/\/+$/, '');

/** Hard cap on a single upload, well under Vercel's 4.5 MB request body limit. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

interface B2Auth {
  apiUrl: string;
  bucketId: string;
  token: string;
}

export type DeleteMethod = 'delete' | 'hide' | 'none';

let cachedAuth: { value: B2Auth; at: number } | null = null;

function requireCredentials() {
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  if (!keyId || !appKey) {
    throw new Error('B2 credentials are not configured (B2_KEY_ID / B2_APP_KEY)');
  }
  return { keyId, appKey };
}

/** `a/b c.webp` -> `a/b%20c.webp` (slashes preserved, per B2's X-Bz-File-Name). */
function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

const RETRYABLE = /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up/i;

/**
 * Transient DNS/connection blips are common enough against Backblaze that an
 * upload shouldn't fail on the first one.
 */
async function fetchWithRetry(input: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !RETRYABLE.test(String(err))) throw err;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  throw lastError;
}

async function authorize(): Promise<B2Auth> {
  if (cachedAuth && Date.now() - cachedAuth.at < AUTH_TTL_MS) return cachedAuth.value;

  const { keyId, appKey } = requireCredentials();
  const res = await fetchWithRetry(AUTH_URL, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${appKey}`).toString('base64')}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`B2 authorize failed (${res.status})`);

  const data = await res.json();
  const storage = data.apiInfo?.storageApi ?? data;
  const auth: B2Auth = {
    apiUrl: storage.apiUrl,
    bucketId: storage.bucketId ?? data.allowed?.bucketId,
    token: data.authorizationToken,
  };
  if (!auth.apiUrl || !auth.bucketId) {
    throw new Error('B2 authorize response had no apiUrl/bucketId');
  }

  cachedAuth = { value: auth, at: Date.now() };
  return auth;
}

/** POST to a B2 API method. `token` defaults to the account token. */
async function b2Post<T>(
  auth: B2Auth,
  method: string,
  body: Record<string, unknown>,
  token = auth.token
): Promise<T> {
  const res = await fetchWithRetry(`${auth.apiUrl}${API_V3}/${method}`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`B2 ${method} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface UploadedObject {
  key: string;
  url: string;
  fileId: string;
}

/**
 * Upload a single object. Each upload mints a fresh, upload-only B2 upload URL
 * so the application key is never handed to anything else.
 */
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<UploadedObject> {
  if (body.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB upload limit`);
  }

  const auth = await authorize();
  const { uploadUrl, authorizationToken } = await b2Post<{
    uploadUrl: string;
    authorizationToken: string;
  }>(auth, 'b2_get_upload_url', { bucketId: auth.bucketId });

  const sha1 = createHash('sha1').update(body).digest('hex');
  const res = await fetchWithRetry(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: authorizationToken,
      'X-Bz-File-Name': encodeKey(key),
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`B2 upload failed (${res.status}): ${text}`);

  let fileId = '';
  try {
    fileId = JSON.parse(text).fileId ?? '';
  } catch {
    /* fileId is only used for logging here */
  }

  return { key, url: `${B2_PUBLIC_BASE}/${key}`, fileId };
}

/** Resolve an object key to its fileId by listing its folder. */
async function findFileId(auth: B2Auth, key: string): Promise<string | null> {
  const slash = key.lastIndexOf('/');
  const dir = slash === -1 ? '' : key.slice(0, slash + 1);

  let start: string | undefined;
  for (;;) {
    const body: Record<string, unknown> = {
      bucketId: auth.bucketId,
      prefix: dir || undefined,
      maxFileCount: 1000,
    };
    if (start) body.startFileName = start;

    const data = await b2Post<{
      files?: { fileName: string; fileId: string }[];
      nextFileName?: string | null;
    }>(auth, 'b2_list_file_names', body);

    for (const file of data.files ?? []) {
      if (file.fileName === key) return file.fileId;
    }
    start = data.nextFileName ?? undefined;
    if (!start) return null;
  }
}

/**
 * Make an object unreachable. Idempotent — returns whether it actually did
 * something, and how.
 *
 * Tries a hard delete first. This Backblaze account currently REFUSES hard
 * deletes: `b2_delete_file` answers 404 `not_found` for a fileId that
 * `b2_get_file_info` confirms is valid, despite the key holding the
 * `deleteFiles` capability. In that case we hide the object instead, which
 * produces the same observable result — it disappears from listings and its
 * public URL starts returning 404. A hidden object keeps occupying storage
 * until it's purged from the Backblaze console, which at ~5 MB is a non-issue.
 *
 * B2 has no rename, so "moving" an object means uploading a copy then calling
 * this on the original.
 */
export async function deleteObject(key: string): Promise<{ deleted: boolean; method: DeleteMethod }> {
  const auth = await authorize();
  const fileId = await findFileId(auth, key);
  if (!fileId) return { deleted: false, method: 'none' };

  try {
    await b2Post(auth, 'b2_delete_file', { fileName: key, fileId });
    return { deleted: true, method: 'delete' };
  } catch (err) {
    console.warn(`[b2] hard delete refused for ${key}, falling back to hide:`, err);
  }

  try {
    await b2Post(auth, 'b2_hide_file', { bucketId: auth.bucketId, fileName: key });
    return { deleted: true, method: 'hide' };
  } catch {
    return { deleted: false, method: 'none' };
  }
}

/** List object keys under a folder prefix. Hidden objects are not returned. */
export async function listObjects(prefix: string): Promise<
  { key: string; size: number; fileId: string }[]
> {
  const auth = await authorize();
  const out: { key: string; size: number; fileId: string }[] = [];
  let start: string | undefined;

  for (;;) {
    const body: Record<string, unknown> = {
      bucketId: auth.bucketId,
      prefix: prefix || undefined,
      maxFileCount: 1000,
    };
    if (start) body.startFileName = start;

    const data = await b2Post<{
      files?: { fileName: string; contentLength: string | number; fileId: string }[];
      nextFileName?: string | null;
    }>(auth, 'b2_list_file_names', body);

    for (const file of data.files ?? []) {
      out.push({ key: file.fileName, size: Number(file.contentLength), fileId: file.fileId });
    }
    start = data.nextFileName ?? undefined;
    if (!start) break;
  }
  return out;
}
