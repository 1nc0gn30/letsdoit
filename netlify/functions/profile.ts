import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, dbQuery } from './_shared/store';

const ALLOWED_FIELDS = ['display_name', 'preferences', 'credibility_score', 'streak'];

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const result = await dbQuery('SELECT * FROM profiles WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
      }
      // Auto-create profile if missing
      const email = context.clientContext?.user?.email || '';
      const displayName = (context.clientContext?.user?.user_metadata?.display_name as string) || email.split('@')[0] || 'Explorer';
      await dbQuery(
        'INSERT INTO profiles (id, display_name, email, preferences, credibility_score, streak) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, displayName, email, '{}', 100, 0]
      );
      const created = await dbQuery('SELECT * FROM profiles WHERE id = $1', [userId]);
      return { statusCode: 200, body: JSON.stringify(created.rows[0]) };
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
          updates.push(`${field} = $${idx++}`);
          values.push(field === 'preferences' ? body[field] : body[field]);
        }
      }

      if (updates.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No updates provided' }) };
      }

      updates.push('updated_at = NOW()');
      values.push(userId);
      const sql = `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await dbQuery(sql, values);
      return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e: any) {
    console.error('profile function error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Internal server error' }) };
  }
};

export { handler };
