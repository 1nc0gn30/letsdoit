import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, getDoc, setDoc, dbQuery } from './_shared/store';

interface FeedbackMap {
  [placeId: string]: { liked: boolean; created_at: string };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const key = `feedback/${userId}`;

  if (event.httpMethod === 'GET') {
    const dbResult = await dbQuery(
      'SELECT place_id, liked, created_at FROM place_feedback WHERE user_id = $1',
      [userId]
    );
    if (dbResult) {
      const feedback: FeedbackMap = {};
      for (const row of dbResult.rows) {
        feedback[row.place_id] = { liked: row.liked, created_at: row.created_at };
      }
      return { statusCode: 200, body: JSON.stringify(feedback) };
    }
    const feedback = (await getDoc(key)) || {};
    return { statusCode: 200, body: JSON.stringify(feedback) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');

    const db = await dbQuery('SELECT 1');
    if (db) {
      await dbQuery(
        `INSERT INTO place_feedback (user_id, place_id, liked) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, place_id) DO UPDATE SET liked = $3, created_at = NOW()`,
        [userId, body.place_id, body.liked]
      );
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    const feedback = (await getDoc(key)) || {};
    feedback[body.place_id] = {
      liked: body.liked,
      created_at: new Date().toISOString(),
    };
    await setDoc(key, feedback);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};

export { handler };
