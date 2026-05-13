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

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Make sure Netlify Database is connected to this site.');
  }
  if (!pool) {
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function dbQuery(sql: string, params?: unknown[]): Promise<{ rows: any[] }> {
  const p = getPool();
  const result = await p.query(sql, params);
  return { rows: result.rows };
}
