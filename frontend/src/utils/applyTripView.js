import { createPlannerFingerprint } from "../components/planner/build-workflow/plannerFingerprint";

export default function applyTripView(dispatch, { trip, route, detours }) {
  const detourList = detours || [];

  dispatch({ type: "CLEAR_ALL" });
  dispatch({
    type: "SET_ORIGIN",
    data: { origin: (trip.origin && trip.origin.address) || "" },
  });
  dispatch({
    type: "SET_DESTINATION",
    data: { destination: (trip.destination && trip.destination.address) || "" },
  });
  if (route) {
    dispatch({ type: "SET_ROUTE", data: { route } });
    dispatch({
      type: "SET_TRIP_SUMMARY",
      data: { tripSummary: route.summary },
    });
  }
  dispatch({ type: "SET_DETOUR_LIST", data: { detourList } });
  dispatch({ type: "SET_TRIP_NAME", data: { tripName: trip.tripName || "" } });
  dispatch({
    type: "SET_CURRENT_TRIP",
    data: {
      currentTrip: {
        tripId: trip.tripId,
        tripName: trip.tripName,
        updatedAt: trip.updatedAt,
        origin: trip.origin,
        destination: trip.destination,
        routePolyline:
          (route &&
            route.overview_polyline &&
            route.overview_polyline.points) ||
          null,
        distanceMeters: trip.distanceMeters,
        durationSeconds: trip.durationSeconds,
        savedFingerprint: createPlannerFingerprint({
          origin: trip.origin,
          destination: trip.destination,
          route,
          detourList,
          tripName: trip.tripName,
        }),
      },
    },
  });
}
