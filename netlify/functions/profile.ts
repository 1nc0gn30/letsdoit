import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, dbQuery } from './_shared/store';

const ALLOWED_FIELDS = ['display_name', 'preferences', 'credibility_score', 'streak'];

function profileDefaults(context: HandlerContext) {
  const email = context.clientContext?.user?.email || '';
  const displayName = (context.clientContext?.user?.user_metadata?.display_name as string) || email.split('@')[0] || 'Explorer';
  return { email, displayName };
}

async function ensureProfile(userId: string, context: HandlerContext) {
  const { email, displayName } = profileDefaults(context);
  await dbQuery(
    `INSERT INTO profiles (id, display_name, email, preferences, credibility_score, streak)
     VALUES ($1, $2, $3, ARRAY[]::text[], 100, 0)
     ON CONFLICT (id) DO NOTHING`,
    [userId, displayName, email]
  );
}

function normalizeValue(field: string, value: unknown) {
  if (field === 'preferences') {
    return Array.isArray(value) ? value.map(String) : [];
  }
  return value;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      await ensureProfile(userId, context);
      const result = await dbQuery('SELECT * FROM profiles WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
      }
      return { statusCode: 500, body: JSON.stringify({ error: 'Profile could not be loaded after creation.' }) };
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      await ensureProfile(userId, context);
      const body = JSON.parse(event.body || '{}');
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
          updates.push(`${field} = $${idx++}`);
          values.push(normalizeValue(field, body[field]));
        }
      }

      if (updates.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No updates provided' }) };
      }

      updates.push('updated_at = NOW()');
      values.push(userId);
      const sql = `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await dbQuery(sql, values);
      if (result.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found' }) };
      }
      return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e: any) {
    console.error('profile function error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Internal server error' }) };
  }
};

export { handler };
