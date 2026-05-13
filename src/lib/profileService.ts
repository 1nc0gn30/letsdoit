import { getProfile, updateProfile } from './netlifyApi';
import type { Tag } from '../data/places';

export async function fetchProfile(token: string) {
  return getProfile(token);
}

export async function updatePreferences(token: string, preferences: Tag[]) {
  return updateProfile(token, { preferences: preferences as string[] });
}

export async function updateDisplayName(token: string, displayName: string) {
  return updateProfile(token, { display_name: displayName });
}

export async function adjustCredibility(token: string, delta: number) {
  const { data: profile } = await getProfile(token);
  if (!profile) return { score: 100, error: 'No profile' };
  const next = Math.max(0, Math.min(1000, (profile.credibility_score || 100) + delta));
  const { error } = await updateProfile(token, { credibility_score: next });
  return { score: next, error };
}

export async function adjustStreak(token: string, reset = false) {
  const { data: profile } = await getProfile(token);
  if (!profile) return { streak: 0, error: 'No profile' };
  const next = reset ? 0 : (profile.streak || 0) + 1;
  const { error } = await updateProfile(token, { streak: next });
  return { streak: next, error };
}
