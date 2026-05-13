import { getVisits, createVisit, updateVisit, getFeedback, submitFeedback } from './netlifyApi';

export type VisitStatus = 'suggested' | 'accepted' | 'checked_in' | 'skipped' | 'declined';

export async function getUserVisits(token: string) {
  const { data, error } = await getVisits(token);
  return { visits: data || [], error };
}

export async function createUserVisit(token: string, placeId: string, status: VisitStatus) {
  return createVisit(token, { place_id: placeId, status });
}

export async function updateUserVisit(token: string, visitId: string, updates: Partial<{ liked?: boolean; disliked?: boolean; status?: VisitStatus; note?: string }>) {
  return updateVisit(token, { id: visitId, ...updates });
}

export async function submitUserFeedback(token: string, placeId: string, liked: boolean) {
  return submitFeedback(token, placeId, liked);
}

export async function getUserFeedback(token: string) {
  const { data, error } = await getFeedback(token);
  const feedback = data || {};
  const list = Object.entries(feedback).map(([place_id, v]) => ({ place_id, liked: v.liked }));
  return { feedback: list, error };
}
