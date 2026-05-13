import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, getDoc, setDoc } from './_shared/store';

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
    const feedback = (await getDoc<FeedbackMap>(key)) || {};
    return { statusCode: 200, body: JSON.stringify(feedback) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const feedback = (await getDoc<FeedbackMap>(key)) || {};
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
