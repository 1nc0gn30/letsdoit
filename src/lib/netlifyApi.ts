// Thin client for Netlify Functions API

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  preferences: string[];
  credibility_score: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  place_id: string;
  status: 'suggested' | 'accepted' | 'checked_in' | 'skipped' | 'declined';
  liked?: boolean;
  disliked?: boolean;
  note?: string;
  created_at: string;
}

export interface FeedbackMap {
  [placeId: string]: { liked: boolean; created_at: string };
}

async function api<T>(method: string, path: string, body?: unknown, token?: string): Promise<{ data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/.netlify/functions/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      return { error: text || `HTTP ${res.status}` };
    }
    return { data: text ? (JSON.parse(text) as T) : undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getProfile(token: string) {
  return api<Profile>('GET', 'profile', undefined, token);
}

export async function updateProfile(token: string, updates: Partial<Profile>) {
  return api<Profile>('PUT', 'profile', updates, token);
}

export async function getVisits(token: string) {
  return api<Visit[]>('GET', 'visits', undefined, token);
}

export async function createVisit(token: string, visit: Omit<Visit, 'id' | 'created_at'>) {
  return api<Visit>('POST', 'visits', visit, token);
}

export async function updateVisit(token: string, visit: Partial<Visit> & { id: string }) {
  return api<Visit>('PUT', 'visits', visit, token);
}

export async function getFeedback(token: string) {
  return api<FeedbackMap>('GET', 'feedback', undefined, token);
}

export async function submitFeedback(token: string, placeId: string, liked: boolean) {
  return api<{ success: boolean }>('POST', 'feedback', { place_id: placeId, liked }, token);
}
