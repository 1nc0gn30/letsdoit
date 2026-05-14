import { availableTags, Place } from '../data/places';

export const HAMPTON_ROADS_BOUNDS: [[number, number], [number, number]] = [
  [36.48, -77.05],
  [37.42, -75.65],
];

const tagCopy: Record<string, string> = {
  food: 'Good fit for meals, casual meetups, and local flavor.',
  coffee: 'Useful for a quick stop, low-pressure planning, or remote work.',
  music: 'Best when you want sound, crowds, and a more social night out.',
  outdoors: 'Good for fresh air, movement, and low-cost exploring.',
  culture: 'A stronger pick when you want something visual, creative, or educational.',
  history: 'Best for slower visits, regional context, and landmark-driven exploring.',
  nightlife: 'A better match for evening plans and higher-energy groups.',
  entertainment: 'Good when the goal is an activity, not just a destination.',
  family: 'Designed to be easier for mixed-age groups and daytime plans.',
  beach: 'Best for coastal time, walking, views, and warm-weather plans.',
  festival: 'Time-sensitive by nature; verify the schedule before heading out.',
  nature: 'Good for quieter outdoor time and wildlife or scenery.',
  sports: 'Useful when you want movement, competition, or fitness built in.',
  wellness: 'Better for recovery, calm, and lower-noise plans.',
};

export function getPrimaryTag(place: Place) {
  return availableTags.find((tag) => tag.id === place.tags[0]);
}

export function getPlaceCity(place: Place) {
  const parts = place.address.split(',');
  return parts.length >= 2 ? parts[parts.length - 2].trim() : 'Hampton Roads';
}

export function getPlaceTypeLabel(place: Place) {
  return place.type === 'event' ? 'Event' : 'Place';
}

export function getPlaceDescription(place: Place) {
  const primary = getPrimaryTag(place);
  const category = primary?.label.toLowerCase() ?? 'local';
  const city = getPlaceCity(place);
  const lead = place.type === 'event'
    ? `${place.name} is listed as a ${category} event in ${city}.`
    : `${place.name} is listed as a ${category} stop in ${city}.`;
  const reasons = place.tags
    .map((tag) => tagCopy[tag])
    .filter(Boolean)
    .slice(0, 2);
  return [lead, ...reasons].join(' ');
}

export function getGoogleMapsUrl(place: Place) {
  const query = encodeURIComponent(`${place.name} ${place.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleDirectionsUrl(place: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
}

export function getAppleMapsUrl(place: Place) {
  const query = encodeURIComponent(`${place.name} ${place.address}`);
  return `https://maps.apple.com/?q=${query}&ll=${place.lat},${place.lng}`;
}

export function getAppleDirectionsUrl(place: Place) {
  return `https://maps.apple.com/?daddr=${place.lat},${place.lng}`;
}

export function getWazeUrl(place: Place) {
  return `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`;
}
