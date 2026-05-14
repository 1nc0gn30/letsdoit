import { Pool } from 'pg';
import { getConnectionString } from '@netlify/database';

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

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl;

  const netlifyDbUrl = process.env.NETLIFY_DB_URL;
  if (netlifyDbUrl) return netlifyDbUrl;

  try {
    return getConnectionString();
  } catch {
    // fall through
  }

  // Log key names server-side only for debugging; never send to client
  const visibleKeys = Object.keys(process.env)
    .filter((key) =>
    key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB_URL') || key.includes('NETLIFY')
    )
    .sort();
  console.error('[store] Missing database env variable. Visible keys:', visibleKeys.join(', ') || 'none');

  throw new Error(
    'Database connection is not available. ' +
    'Add NETLIFY_DB_URL (from your Netlify Database dashboard) or DATABASE_URL to your site environment variables. ' +
    'Docs: https://ntl.fyi/database-environment'
  );
}

export function getPool(): Pool {
  const url = getDatabaseUrl();
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
