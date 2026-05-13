import { Pool } from 'pg';

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

let pool: Pool | null = null;

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function query(sql: string, params?: unknown[]): Promise<{ rows: any[] } | null> {
  const p = getPool();
  if (!p) return null;
  try {
    const result = await p.query(sql, params);
    return { rows: result.rows };
  } catch (e) {
    console.error('DB query error:', e);
    return null;
  }
}
