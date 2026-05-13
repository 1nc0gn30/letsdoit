// Netlify Blobs document store wrapper
// Uses Netlify Blobs as the backing store for profile, visits, and feedback data.

interface NetlifyContext {
  clientContext?: {
    user?: {
      sub: string;
      email?: string;
      app_metadata?: Record<string, unknown>;
      user_metadata?: Record<string, unknown>;
    };
  };
}

export function getUserId(context: NetlifyContext): string | null {
  return context.clientContext?.user?.sub ?? null;
}

// Minimal in-memory fallback for local dev without Netlify CLI
const memoryStore = new Map<string, string>();

async function getStore() {
  try {
    const { getStore: netlifyGetStore } = await import('@netlify/blobs');
    return netlifyGetStore({ name: 'navi-data' });
  } catch {
    // Fallback for local dev without Netlify Blobs
    return {
      async get(key: string) {
        return memoryStore.get(key) ?? null;
      },
      async set(key: string, value: string) {
        memoryStore.set(key, value);
      },
      async delete(key: string) {
        memoryStore.delete(key);
      },
    };
  }
}

export async function getDoc<T = unknown>(key: string): Promise<T | null> {
  const store = await getStore();
  const raw = await store.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setDoc(key: string, value: unknown): Promise<void> {
  const store = await getStore();
  await store.set(key, JSON.stringify(value));
}

export async function deleteDoc(key: string): Promise<void> {
  const store = await getStore();
  await store.delete(key);
}
