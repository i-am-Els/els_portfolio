import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { deleteObject, listObjects } from '@/utils/b2';
import { isAllowedKey, isAllowedPrefix } from '@/utils/mediaPaths';

export const runtime = 'nodejs';

/**
 * POST /api/b2/delete — remove an object (or every object in a folder) from B2.
 *
 * Accepts either `{ key }` for a single object, or `{ prefix }` to wipe one of
 * the sanctioned folders (used when a post or project is deleted).
 * Both are validated against src/utils/mediaPaths.ts, so this can only ever
 * touch the sanctioned folders.
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { key?: unknown; prefix?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body' }, { status: 400 });
  }

  const key = typeof payload.key === 'string' ? payload.key : '';
  const prefix = typeof payload.prefix === 'string' ? payload.prefix : '';

  if (key) {
    if (!isAllowedKey(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    try {
      const { deleted } = await deleteObject(key);
      return NextResponse.json({ key, deleted });
    } catch (err) {
      console.error('[b2/delete]', err);
      const message = err instanceof Error ? err.message : 'Delete failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (prefix) {
    if (!isAllowedPrefix(prefix)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }
    try {
      const objects = await listObjects(`${prefix}/`);
      let deleted = 0;
      for (const object of objects) {
        const result = await deleteObject(object.key);
        if (result.deleted) deleted += 1;
      }
      return NextResponse.json({ prefix, total: objects.length, deleted });
    } catch (err) {
      console.error('[b2/delete]', err);
      const message = err instanceof Error ? err.message : 'Delete failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  return NextResponse.json({ error: 'Provide a "key" or a "prefix"' }, { status: 400 });
}
