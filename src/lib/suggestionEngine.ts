import { Place, Tag } from '../data/places';

export interface SuggestionWeights {
  likedPlaceBonus: number;
  dislikedPlacePenalty: number;
  visitedPenalty: number;
  distanceWeight: number;
  tagMatchWeight: number;
  timeOfDayWeight: number;
  freshnessWeight: number;
}

const DEFAULT_WEIGHTS: SuggestionWeights = {
  likedPlaceBonus: 40,
  dislikedPlacePenalty: -80,
  visitedPenalty: -15,
  distanceWeight: 30,
  tagMatchWeight: 25,
  timeOfDayWeight: 20,
  freshnessWeight: 15,
};

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getTimeOfDayScore(place: Place, hour: number): number {
  const isNightlife = place.tags.includes('nightlife');
  const isCoffee = place.tags.includes('coffee');
  const isFood = place.tags.includes('food');
  const isEntertainment = place.tags.includes('entertainment');
  const isFamily = place.tags.includes('family');
  const isEvent = place.type === 'event';

  if (hour >= 6 && hour < 11) {
    if (isCoffee) return 1.0;
    if (isFood) return 0.7;
    if (isFamily) return 0.6;
    if (isNightlife || isEntertainment) return 0.1;
    return 0.4;
  }
  if (hour >= 11 && hour < 15) {
    if (isFood) return 1.0;
    if (isFamily) return 0.8;
    if (isEvent) return 0.7;
    if (isCoffee) return 0.5;
    return 0.5;
  }
  if (hour >= 15 && hour < 20) {
    if (isEvent) return 1.0;
    if (isEntertainment) return 0.9;
    if (isOutdoors(place)) return 0.8;
    if (isFamily) return 0.7;
    return 0.5;
  }
  // 20-23 / night
  if (isNightlife) return 1.0;
  if (isEntertainment) return 0.9;
  if (isFood) return 0.8;
  if (isEvent) return 0.7;
  return 0.3;
}

function isOutdoors(place: Place) {
  return place.tags.includes('outdoors') || place.tags.includes('beach') || place.tags.includes('nature');
}

export function scorePlaces(
  places: Place[],
  preferences: Tag[],
  userLocation: [number, number] | null,
  likedPlaceIds: string[],
  dislikedPlaceIds: string[],
  visitedPlaceIds: string[],
  weights: SuggestionWeights = DEFAULT_WEIGHTS
): { place: Place; score: number }[] {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  const scored = places.map((place) => {
    let score = 50;

    // Tag match
    const tagMatches = place.tags.filter((t) => preferences.includes(t)).length;
    score += tagMatches * weights.tagMatchWeight;

    // Distance
    if (userLocation) {
      const dist = haversineMiles(userLocation[0], userLocation[1], place.lat, place.lng);
      const distScore = Math.max(0, weights.distanceWeight - dist * 1.5);
      score += distScore;
    }

    // Time of day
    const tod = getTimeOfDayScore(place, hour);
    score += tod * weights.timeOfDayWeight;

    // Liked / disliked / visited
    if (likedPlaceIds.includes(place.id)) score += weights.likedPlaceBonus;
    if (dislikedPlaceIds.includes(place.id)) score += weights.dislikedPlacePenalty;
    if (visitedPlaceIds.includes(place.id)) score += weights.visitedPenalty;

    // Events get a slight weekend boost
    if (place.type === 'event' && (day === 0 || day === 6)) {
      score += 10;
    }

    // Business variety penalty: if visited recently, penalize more
    if (visitedPlaceIds.includes(place.id)) {
      score += weights.visitedPenalty;
    }

    return { place, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function pickSuggestion(
  places: Place[],
  preferences: Tag[],
  userLocation: [number, number] | null,
  likedPlaceIds: string[],
  dislikedPlaceIds: string[],
  visitedPlaceIds: string[]
): Place | null {
  const scored = scorePlaces(places, preferences, userLocation, likedPlaceIds, dislikedPlaceIds, visitedPlaceIds);
  if (scored.length === 0) return null;

  // Add a small random jitter to top 10 so the same place isn't always picked
  const top = scored.slice(0, Math.min(10, scored.length));
  const jittered = top.map((s) => ({ ...s, score: s.score + Math.random() * 15 }));
  jittered.sort((a, b) => b.score - a.score);
  return jittered[0].place;
}

export function computeCredibilityDelta(status: 'went' | 'skipped' | 'declined', liked?: boolean) {
  if (status === 'went') {
    return liked === true ? 12 : liked === false ? -2 : 8;
  }
  if (status === 'skipped') return -10;
  if (status === 'declined') return -3;
  return 0;
}
