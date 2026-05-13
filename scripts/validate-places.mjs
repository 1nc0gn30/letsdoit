import { hamptonRoadsPlaces } from '../src/data/places.ts';

const bounds = {
  minLat: 36.48,
  maxLat: 37.42,
  minLng: -77.05,
  maxLng: -75.65,
};

const seenNames = new Map();
const seenCoordinates = new Map();
const issues = [];

for (const place of hamptonRoadsPlaces) {
  const nameKey = place.name.toLowerCase();
  const coordKey = `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`;

  if (seenNames.has(nameKey)) {
    issues.push(`${place.id}: duplicate name also used by ${seenNames.get(nameKey)} (${place.name})`);
  }
  seenNames.set(nameKey, place.id);

  if (seenCoordinates.has(coordKey)) {
    issues.push(`${place.id}: duplicate coordinate also used by ${seenCoordinates.get(coordKey)} (${coordKey})`);
  }
  seenCoordinates.set(coordKey, place.id);

  if (
    place.lat < bounds.minLat ||
    place.lat > bounds.maxLat ||
    place.lng < bounds.minLng ||
    place.lng > bounds.maxLng
  ) {
    issues.push(`${place.id}: outside Hampton Roads bounds (${place.lat}, ${place.lng})`);
  }

  if (!place.address.includes(', VA')) {
    issues.push(`${place.id}: address is missing Virginia marker (${place.address})`);
  }

  if (!place.description || place.description.length < 24) {
    issues.push(`${place.id}: description is too thin`);
  }
}

if (issues.length > 0) {
  console.error(`Place validation failed with ${issues.length} issue(s):`);
  for (const issue of issues.slice(0, 100)) console.error(`- ${issue}`);
  if (issues.length > 100) console.error(`...and ${issues.length - 100} more`);
  process.exit(1);
}

console.log(`Validated ${hamptonRoadsPlaces.length} places/events: no duplicate names, duplicate coordinates, or out-of-bounds points found.`);
