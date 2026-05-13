import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, query } from './_shared/store';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod === 'GET') {
    const result = await query(
      'SELECT place_id, liked, created_at FROM place_feedback WHERE user_id = $1',
      [userId]
    );
    const feedback: Record<string, { liked: boolean; created_at: string }> = {};
    for (const row of result?.rows || []) {
      feedback[row.place_id] = { liked: row.liked, created_at: row.created_at };
    }
    return { statusCode: 200, body: JSON.stringify(feedback) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    await query(
      `INSERT INTO place_feedback (user_id, place_id, liked) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, place_id) DO UPDATE SET liked = $3, created_at = NOW()`,
      [userId, body.place_id, body.liked]
    );
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};

export { handler };
