import axios from "axios";
import config from "../config/config.js";
import log from "../utils/logger";

/**
 * Build the POST /api/trips payload from the current Redux state.
 *
 * The full Google route object is kept in `state.route`, so we can pull exact
 * coordinates, distance, duration, and the encoded polyline straight from it —
 * no extra API calls. `origin`/`destination` in state are the address strings
 * the user typed; we pair them with the resolved leg coordinates.
 *
 * @param {object} state - Redux state ({ origin, destination, route, detourList }).
 * @param {string} tripName - The name the user entered for the trip.
 * @returns {object} The request body for POST /api/trips.
 */
export function buildTripPayload(state, tripName) {
  const { origin, destination, route, detourList } = state;
  const legs = (route && route.legs) || [];
  const firstLeg = legs[0] || {};
  const lastLeg = legs[legs.length - 1] || {};
  const startLocation = firstLeg.start_location || {};
  const endLocation = lastLeg.end_location || {};

  const distanceMeters = legs.reduce(
    (sum, leg) => sum + ((leg.distance && leg.distance.value) || 0),
    0
  );
  const durationSeconds = legs.reduce(
    (sum, leg) => sum + ((leg.duration && leg.duration.value) || 0),
    0
  );
  const routePolyline =
    (route && route.overview_polyline && route.overview_polyline.points) ||
    null;

  return {
    tripName,
    origin: {
      address: origin || "",
      lat: startLocation.lat ?? null,
      lng: startLocation.lng ?? null,
    },
    destination: {
      address: destination || "",
      lat: endLocation.lat ?? null,
      lng: endLocation.lng ?? null,
    },
    routePolyline,
    distanceMeters: distanceMeters || null,
    durationSeconds: durationSeconds || null,
    detours: (detourList || []).map((detour) => ({
      placeName: detour.name,
      placeType: detour.type || null,
      latitude: detour.lat,
      longitude: detour.lng,
      placeId: detour.placeId || detour.id || null,
      rating: detour.rating || null,
      metadata: { addedTime: detour.addedTime },
    })),
  };
}

/**
 * TripRequester — persists a trip to the backend.
 *
 * The backend scopes the trip to the signed-in user via the session cookie, so
 * every call must send credentials.
 */
export default class TripRequester {
  getUrlBase() {
    return config.BACKEND_URL;
  }

  /**
   * Save a trip (with its detours). Resolves to the created trip on success.
   *
   * @param {object} payload - Body from buildTripPayload.
   * @returns {Promise<object>} { trip, detours }
   */
  saveTrip(payload) {
    return axios
      .post(this.getUrlBase() + "/api/trips", payload, {
        withCredentials: true,
      })
      .then((response) => response.data)
      .catch((error) => {
        log.error("Failed to save trip:", error);
        throw error;
      });
  }
}
