import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, getDoc, setDoc } from './_shared/store';
import { v4 as uuidv4 } from 'uuid';

interface Visit {
  id: string;
  place_id: string;
  status: 'suggested' | 'accepted' | 'checked_in' | 'skipped' | 'declined';
  liked?: boolean;
  disliked?: boolean;
  note?: string;
  created_at: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const key = `visits/${userId}`;

  if (event.httpMethod === 'GET') {
    const visits = (await getDoc<Visit[]>(key)) || [];
    return { statusCode: 200, body: JSON.stringify(visits) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const visits = (await getDoc<Visit[]>(key)) || [];
    const visit: Visit = {
      id: uuidv4(),
      place_id: body.place_id,
      status: body.status,
      liked: body.liked,
      disliked: body.disliked,
      note: body.note,
      created_at: new Date().toISOString(),
    };
    visits.unshift(visit);
    await setDoc(key, visits);
    return { statusCode: 200, body: JSON.stringify(visit) };
  }

  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body || '{}');
    const visits = (await getDoc<Visit[]>(key)) || [];
    const idx = visits.findIndex((v) => v.id === body.id);
    if (idx === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Visit not found' }) };
    }
    visits[idx] = { ...visits[idx], ...body, updated_at: new Date().toISOString() };
    await setDoc(key, visits);
    return { statusCode: 200, body: JSON.stringify(visits[idx]) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};

export { handler };
