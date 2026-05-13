import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, getDoc, setDoc, dbQuery } from './_shared/store';
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
    const dbResult = await dbQuery(
      'SELECT * FROM visits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    if (dbResult) {
      return { statusCode: 200, body: JSON.stringify(dbResult.rows) };
    }
    const visits = (await getDoc(key)) || [];
    return { statusCode: 200, body: JSON.stringify(visits) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const id = uuidv4();

    const db = await dbQuery('SELECT 1');
    if (db) {
      await dbQuery(
        'INSERT INTO visits (id, user_id, place_id, status, liked, disliked, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, userId, body.place_id, body.status, body.liked ?? null, body.disliked ?? null, body.note ?? null]
      );
      const created = await dbQuery('SELECT * FROM visits WHERE id = $1', [id]);
      if (created && created.rows.length > 0) {
        return { statusCode: 200, body: JSON.stringify(created.rows[0]) };
      }
    }

    const visits: Visit[] = (await getDoc(key)) || [];
    const visit: Visit = {
      id,
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

    const db = await dbQuery('SELECT 1');
    if (db) {
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
      if (updates.length > 0) {
        values.push(body.id, userId);
        const q = `UPDATE visits SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
        const result = await dbQuery(q, values);
        if (result && result.rows.length > 0) {
          return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
        }
      }
    }

    const visits: Visit[] = (await getDoc(key)) || [];
    const idx = visits.findIndex((v) => v.id === body.id);
    if (idx === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Visit not found' }) };
    }
    const allowed = ['status', 'liked', 'disliked', 'note'];
    for (const field of allowed) {
      if (body[field] !== undefined) {
        (visits[idx] as any)[field] = body[field];
      }
    }
    await setDoc(key, visits);
    return { statusCode: 200, body: JSON.stringify(visits[idx]) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};

export { handler };
