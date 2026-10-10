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
import { createHash, createHmac } from 'node:crypto';

const AUTH_URL = 'https://api.backblazeb2.com/b2api/v3/b2_authorize_account';
const API_V3 = '/b2api/v3';
const AUTH_TTL_MS = 9 * 60 * 1000;

const S3_API_URL = process.env.B2_S3_API_URL || 'https://s3.us-east-005.backblazeb2.com';
const S3_REGION = process.env.B2_S3_REGION || 'us-east-005';

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

const hmac = (key: Buffer | string, data: string) =>
  createHmac('sha256', key).update(data).digest();
const sha256hex = (data: string) => createHash('sha256').update(data).digest('hex');

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

/** Every version id for a key, including hide markers. */
async function listVersionIds(auth: B2Auth, key: string): Promise<string[]> {
  const data = await b2Post<{
    files?: { fileName: string; fileId: string; action: string }[];
  }>(auth, 'b2_list_file_versions', { bucketId: auth.bucketId, prefix: key, maxFileCount: 100 });
  return (data.files ?? []).filter((f) => f.fileName === key).map((f) => f.fileId);
}

/**
 * Hard-delete one object version through B2's S3-compatible endpoint.
 *
 * `b2_delete_file` is refused on this account — it answers 404 `not_found` for
 * a fileId that `b2_get_file_info` had just confirmed is valid, even though the
 * key holds the `deleteFiles` capability. The S3 endpoint has no such problem,
 * as long as the DELETE is pinned to a versionId. (A plain S3 DELETE is not
 * enough: it just writes a hide marker, which is what produced the 0 KB files.)
 *
 * Because it deletes by version, it also removes hide markers — the only way to
 * clean one up.
 */
async function s3DeleteVersion(key: string, fileId: string): Promise<boolean> {
  const { keyId, appKey } = requireCredentials();
  const bucket = process.env.B2_BUCKET || 'portfolio-elsrael';
  const host = new URL(S3_API_URL).host;

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256hex('');
  const canonicalUri = `/${[bucket, ...key.split('/').filter(Boolean)].map(encodeURIComponent).join('/')}`;
  const canonicalQuery = `versionId=${encodeURIComponent(fileId)}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    'DELETE',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const scope = `${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${appKey}`, dateStamp), S3_REGION), 's3'), 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const res = await fetchWithRetry(`${S3_API_URL}${canonicalUri}?${canonicalQuery}`, {
    method: 'DELETE',
    headers: {
      Host: host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    cache: 'no-store',
  });
  return res.status === 200 || res.status === 204;
}

/**
 * Make an object unreachable for good. Idempotent.
 *
 * Deletes every version of the key — the object itself plus any hide marker —
 * so nothing lingers as a 0 KB entry. Returns how many versions were removed.
 *
 * B2 has no rename, so "moving" an object means uploading a copy then calling
 * this on the original.
 */
export async function deleteObject(key: string): Promise<{ deleted: boolean; method: DeleteMethod }> {
  const auth = await authorize();
  const versionIds = await listVersionIds(auth, key);
  if (!versionIds.length) return { deleted: false, method: 'none' };

  let removed = 0;
  for (const fileId of versionIds) {
    if (await s3DeleteVersion(key, fileId)) removed += 1;
  }
  if (removed > 0) return { deleted: true, method: 'delete' };

  // Last resort. Hiding drops the object from listings and its public URL starts
  // returning 404, but it leaves a 0 KB hide marker behind — avoid relying on it.
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
