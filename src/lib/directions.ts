export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  name: string;
  mode: string;
}

export interface RouteLeg {
  steps: RouteStep[];
  distance: number; // meters
  duration: number; // seconds
  summary: string;
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  legs: RouteLeg[];
  geometry: [number, number][]; // [lng, lat]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export async function fetchRoute(
  from: [number, number],
  to: [number, number]
): Promise<RouteResult | null> {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.length) return null;
    const route = data.routes[0];
    const leg = route.legs[0];
    return {
      distance: route.distance,
      duration: route.duration,
      legs: route.legs.map((l: any) => ({
        steps: l.steps.map((s: any) => ({
          instruction: stripHtml(s.maneuver.instruction || s.name),
          distance: s.distance,
          duration: s.duration,
          name: s.name || '',
          mode: s.mode || 'driving',
        })),
        distance: l.distance,
        duration: l.duration,
        summary: l.summary || '',
      })),
      geometry: route.geometry.coordinates as [number, number][],
    };
  } catch {
    return null;
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1609) return `${Math.round(meters)} m`;
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}
