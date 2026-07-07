/**
 * tripView — reconstructs a render-ready view of a saved trip.
 *
 * A saved trip persists only the *encoded* route polyline plus distance/duration
 * (see POST /api/trips). The frontend map, however, renders from a decoded
 * points array and needs map bounds and a formatted summary. The frontend has
 * no polyline decoder, so we rebuild all of that here (the backend already
 * depends on `polyline-encoded`) and hand the client a route object shaped like
 * the one it gets during normal planning.
 */

const polylineEncoder = require("polyline-encoded");

// Meters per mile (matches routeAPI's conversion).
const METERS_PER_MILE = 1609.34;

/**
 * Format distance (meters) + duration (seconds) into the summary shape the
 * sidebar renders: { time: { hours, min }, distance }. Mirrors
 * routeAPI.createSummaryData so a loaded trip reads identically to a fresh one.
 */
function buildSummary(distanceMeters, durationSeconds) {
  const seconds = durationSeconds || 0;
  const hours = Math.floor(seconds / 3600);
  const min = Math.floor((seconds / 3600 - hours) * 60);

  let distance = (distanceMeters || 0) / METERS_PER_MILE;
  // Match routeAPI.createSummaryData exactly: under 100 mi the distance is a
  // toPrecision(3) STRING (preserving trailing zeros like "2.00"), at/above 100
  // it is a rounded number. Keeping the string means a loaded trip displays
  // identically to a freshly planned one.
  distance = distance < 100 ? distance.toPrecision(3) : Math.round(distance);

  return { time: { hours, min }, distance };
}

/**
 * Compute Google-style bounds from an array of [lat, lng] points.
 *
 * @param {Array<[number, number]>} points
 * @returns {{northeast:{lat:number,lng:number}, southwest:{lat:number,lng:number}}|null}
 */
function computeBounds(points) {
  if (!points || points.length === 0) {
    return null;
  }
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return {
    northeast: { lat: maxLat, lng: maxLng },
    southwest: { lat: minLat, lng: minLng },
  };
}

/**
 * Map a stored detour row to the frontend detour shape. DECIMAL columns come
 * back from pg as strings, so coerce the numerics.
 */
function mapDetour(row) {
  return {
    name: row.place_name,
    type: row.place_type,
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    id: row.place_id,
    placeId: row.place_id,
    rating: row.rating != null ? Number(row.rating) : null,
    addedTime: row.metadata ? row.metadata.addedTime : undefined,
  };
}

/**
 * Build the client-facing view of a saved trip.
 *
 * @param {object} trip - A row from TripRepository.getTripById.
 * @param {object[]} [detours] - Rows from DetourRepository.getDetoursByTripId.
 * @returns {{trip: object, route: object|null, detours: object[]}}
 */
function buildTripView(trip, detours = []) {
  const points = trip.route_polyline
    ? polylineEncoder.decode(trip.route_polyline)
    : [];

  const route =
    points.length > 0
      ? {
          overview_polyline: {
            points: trip.route_polyline,
            // MapContainer reads complete_overview; DetourForm reads
            // decodedPoints — provide both so loaded trips render and can still
            // be extended with new detours.
            complete_overview: points,
            decodedPoints: points,
          },
          bounds: computeBounds(points),
          summary: buildSummary(trip.distance_meters, trip.duration_seconds),
        }
      : null;

  return {
    trip: {
      tripId: trip.trip_id,
      tripName: trip.trip_name,
      origin: trip.origin,
      destination: trip.destination,
      updatedAt: trip.updated_at,
      // Raw stored values so the client can persist them back on an update that
      // hasn't re-routed (a rename), without recomputing from a route it lacks.
      distanceMeters: trip.distance_meters ?? null,
      durationSeconds: trip.duration_seconds ?? null,
    },
    route,
    detours: (detours || []).map(mapDetour),
  };
}

module.exports = { buildTripView, buildSummary, computeBounds };
