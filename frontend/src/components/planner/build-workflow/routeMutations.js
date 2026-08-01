import RouteRequester from "../../../scripts/RouteRequester";

export function moveDetour(detours, fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= detours.length ||
    toIndex >= detours.length ||
    fromIndex === toIndex
  ) {
    return detours;
  }

  const nextDetours = detours.slice();
  const [movedDetour] = nextDetours.splice(fromIndex, 1);
  nextDetours.splice(toIndex, 0, movedDetour);
  return nextDetours.map((detour) => ({ ...detour, addedTime: -1 }));
}

export async function recalculateItinerary({
  destination,
  detours,
  origin,
  requester = new RouteRequester(),
}) {
  const data = await requester.getRoute(origin, destination, "Address", {
    waypoints: detours.map((detour) => detour.placeId),
  });
  const route = data.routes && data.routes[0];
  if (!route) {
    throw new Error("No route returned");
  }
  return route;
}
