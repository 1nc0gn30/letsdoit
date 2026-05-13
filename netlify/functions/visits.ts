import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, query } from './_shared/store';
import { v4 as uuidv4 } from 'uuid';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod === 'GET') {
    const result = await query(
      'SELECT * FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    return { statusCode: 200, body: JSON.stringify(result?.rows || []) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const id = uuidv4();
    await query(
      'INSERT INTO visits (id, user_id, place_id, status, liked, disliked, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, userId, body.place_id, body.status, body.liked ?? null, body.disliked ?? null, body.note ?? null]
    );
    const created = await query('SELECT * FROM visits WHERE id = $1', [id]);
    return { statusCode: 200, body: JSON.stringify(created?.rows[0] || { id }) };
  }

  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body || '{}');
    const allowed = ['status', 'liked', 'disliked', 'note'];
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const field of allowed) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No updates provided' }) };
    }

    values.push(body.id, userId);
    const sql = `UPDATE visits SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
    const result = await query(sql, values);
    if (!result || result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Visit not found' }) };
    }
    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};

export { handler };
