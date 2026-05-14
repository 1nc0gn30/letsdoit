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

function getDatabaseUrl() {
  const manualUrl = process.env.DATABASE_URL;
  if (manualUrl) return manualUrl;

  try {
    return getConnectionString();
  } catch (error) {
    const visibleDatabaseKeys = Object.keys(process.env)
      .filter((key) => key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('NETLIFY'))
      .sort();
    const suffix = visibleDatabaseKeys.length > 0
      ? ` Visible database-related env keys: ${visibleDatabaseKeys.join(', ')}.`
      : ' No database-related env keys are visible to this function.';
    throw new Error(
      `Netlify Database connection is not available. Connect Netlify Database to this site or set DATABASE_URL for local/manual Postgres.${suffix}`
    );
  }
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
