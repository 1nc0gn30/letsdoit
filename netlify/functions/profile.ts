import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions';
import { getUserId, getDoc, setDoc } from './_shared/store';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  preferences: string[];
  credibility_score: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const userId = getUserId(context);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const key = `profiles/${userId}`;

  if (event.httpMethod === 'GET') {
    let profile = await getDoc<Profile>(key);
    if (!profile) {
      // Initialize default profile
      const email = context.clientContext?.user?.email || '';
      const displayName = (context.clientContext?.user?.user_metadata?.display_name as string) || email.split('@')[0] || 'Explorer';
      profile = {
        id: userId,
        display_name: displayName,
        email,
        preferences: [],
        credibility_score: 100,
        streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await setDoc(key, profile);
    }
    return { statusCode: 200, body: JSON.stringify(profile) };
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const existing = (await getDoc<Profile>(key)) || {
      id: userId,
      display_name: body.display_name || '',
      email: context.clientContext?.user?.email || '',
      preferences: [],
      credibility_score: 100,
      streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated: Profile = {
      ...existing,
      display_name: body.display_name ?? existing.display_name,
      preferences: body.preferences ?? existing.preferences,
      credibility_score: body.credibility_score ?? existing.credibility_score,
      streak: body.streak ?? existing.streak,
      updated_at: new Date().toISOString(),
    };
    await setDoc(key, updated);
    return { statusCode: 200, body: JSON.stringify(updated) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};

export { handler };
