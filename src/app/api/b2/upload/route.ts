import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { uploadObject, MAX_UPLOAD_BYTES } from '@/utils/b2';
import { buildObjectKey, isAllowedPrefix } from '@/utils/mediaPaths';

export const runtime = 'nodejs';

/**
 * POST /api/b2/upload — the app's only way to write to Backblaze B2.
 *
 * Files are previewed in the browser as blob: URLs while editing and only reach
 * this route when the user actually saves. See src/utils/mediaUpload.ts.
 *
 * Note: src/middleware.ts only matches `/admin/:path*`, so this route does its
 * own authentication and returns 401 JSON rather than redirecting.
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const raw = form.get('file');
  const file =
    raw && typeof raw === 'object' && typeof (raw as File).arrayBuffer === 'function'
      ? (raw as File)
      : null;

  if (!file) {
    return NextResponse.json({ error: 'Missing "file"' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File is too large (4 MB max)' }, { status: 413 });
  }

  const contentType = file.type || '';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images can be uploaded' }, { status: 400 });
  }

  const prefix = String(form.get('prefix') ?? '');
  if (!isAllowedPrefix(prefix)) {
    return NextResponse.json({ error: 'Invalid destination folder' }, { status: 400 });
  }

  const provided = form.get('filename');
  const key = buildObjectKey(prefix, contentType, typeof provided === 'string' ? provided : null);
  if (!key) {
    return NextResponse.json({ error: 'Invalid destination path' }, { status: 400 });
  }

  try {
    const body = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadObject(key, body, contentType);
    return NextResponse.json({ key: uploaded.key, url: uploaded.url });
  } catch (err) {
    console.error('[b2/upload]', err);
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
