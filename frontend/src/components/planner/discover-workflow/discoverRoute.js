export function getRoutePoint(route, percentage) {
  const polyline = route?.overview_polyline;
  const points = polyline?.decodedPoints || polyline?.complete_overview || [];
  if (points.length === 0) {
    return null;
  }
  const index = Math.min(
    points.length - 1,
    Math.max(0, Math.round((percentage / 100) * (points.length - 1)))
  );
  return { lat: points[index][0], lng: points[index][1] };
}

export function getVisibleDetourOptions(detourOptions = [], detourList = []) {
  const addedPlaceIds = new Set(
    detourList.map((detour) => detour.placeId).filter(Boolean)
  );
  return detourOptions
    .map((option, index) => ({ index, option }))
    .filter(({ option }) => !addedPlaceIds.has(option.place_id));
}
