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

export async function getBlobStore() {
  return getStore({ name: 'navi-data' });
}

export async function getDoc<T = unknown>(key: string): Promise<T | null> {
  const store = await getBlobStore();
  const raw = await store.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setDoc(key: string, value: unknown): Promise<void> {
  const store = await getBlobStore();
  await store.set(key, JSON.stringify(value));
}
