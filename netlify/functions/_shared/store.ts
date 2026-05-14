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
  // 1. Manual DATABASE_URL fallback (external Postgres, local dev, etc.)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl;

  // 2. Netlify Database native variable (pooled connection, auto-injected when linked)
  const netlifyDbUrl = process.env.NETLIFY_DB_URL;
  if (netlifyDbUrl) return netlifyDbUrl;

  // 3. Let @netlify/database resolve it (reads NETLIFY_DB_URL via its own helper)
  try {
    return getConnectionString();
  } catch {
    // Intentionally fall through to a clear error
  }

  const visibleKeys = Object.keys(process.env)
    .filter((key) =>
      key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB_URL') || key.includes('NETLIFY')
    )
    .sort();

  const suffix = visibleKeys.length > 0
    ? ` Visible env keys: ${visibleKeys.join(', ')}.`
    : ' No database-related env keys are visible to this function.';

  throw new Error(
    `Database connection is not available. ` +
    `Add NETLIFY_DB_URL (from your Netlify Database dashboard) or DATABASE_URL to your site's environment variables. ` +
    `Docs: https://ntl.fyi/database-environment${suffix}`
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
