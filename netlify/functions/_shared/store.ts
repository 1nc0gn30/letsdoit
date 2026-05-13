import { getStore } from '@netlify/blobs';

interface NetlifyContext {
  clientContext?: {
    user?: {
      sub: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    };
  };
}

export function getUserId(context: NetlifyContext): string | null {
  return context.clientContext?.user?.sub ?? null;
}

// --- Netlify Blobs fallback ---
let blobStore: any = null;
async function getBlobStore() {
  if (!blobStore) blobStore = await getStore({ name: 'navi-data' });
  return blobStore;
}

export async function blobGet(key: string): Promise<any | null> {
  const store = await getBlobStore();
  const raw = await store.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function blobSet(key: string, value: any): Promise<void> {
  const store = await getBlobStore();
  await store.set(key, JSON.stringify(value));
}

// --- Database helper with Blob fallback ---
export async function getDb() {
  try {
    const { createDatabaseClient } = await import('@netlify/database');
    return createDatabaseClient();
  } catch {
    return null;
  }
}

export async function dbQuery(sql: string, params: unknown[] = []): Promise<{ rows: any[] } | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    return await db.query(sql, params);
  } catch {
    return null;
  }
}

export async function getDoc(key: string): Promise<any | null> {
  const result = await dbQuery('SELECT value FROM blob_docs WHERE key = $1', [key]);
  if (result && result.rows.length > 0) {
    try { return JSON.parse(result.rows[0].value); } catch { return null; }
  }
  return blobGet(key);
}

export async function setDoc(key: string, value: any): Promise<void> {
  const db = await getDb();
  if (db) {
    try {
      await db.query(
        'INSERT INTO blob_docs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, JSON.stringify(value)]
      );
      return;
    } catch { /* fall through to blobs */ }
  }
  await blobSet(key, value);
}
