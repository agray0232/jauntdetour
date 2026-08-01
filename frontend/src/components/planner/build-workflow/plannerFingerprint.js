function normalizeEndpoint(endpoint) {
  if (typeof endpoint === "string") {
    return endpoint.trim();
  }
  return endpoint?.address || "";
}

export function createPlannerFingerprint({
  destination,
  detourList = [],
  origin,
  route,
  tripName,
}) {
  return JSON.stringify({
    destination: normalizeEndpoint(destination),
    detours: detourList.map((detour) => ({
      addedTime: detour.addedTime ?? null,
      id: detour.placeId || detour.id || null,
      latitude: detour.lat,
      longitude: detour.lng,
      name: detour.name,
      type: detour.type || null,
    })),
    origin: normalizeEndpoint(origin),
    routePolyline:
      route?.overview_polyline?.points ||
      route?.overview_polyline?.encodedPoints ||
      null,
    tripName: (tripName || "").trim(),
  });
}

export function getPlannerSaveState({ currentTrip, fingerprint, operation }) {
  if (operation === "saving" || operation === "failed") {
    return operation;
  }
  if (!currentTrip) {
    return "unsaved";
  }
  if (!currentTrip.savedFingerprint) {
    return currentTrip.tripName === JSON.parse(fingerprint).tripName
      ? "loaded"
      : "dirty";
  }
  return currentTrip.savedFingerprint === fingerprint ? "saved" : "dirty";
}

export const saveStatus = {
  dirty: { color: "warning", label: "Unsaved changes" },
  failed: { color: "danger", label: "Save failed" },
  loaded: { color: "informative", label: "Loaded" },
  saved: { color: "success", label: "Saved" },
  saving: { color: "informative", label: "Saving" },
  unsaved: { color: "warning", label: "Not saved" },
};
