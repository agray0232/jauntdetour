import React, { useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Card,
  Text,
  Spinner,
  Toaster,
  Toast,
  ToastTitle,
  useToastController,
  useId,
} from "@fluentui/react-components";
import TripRequester from "../../scripts/TripRequester";
import log from "../../utils/logger";

const PAGE_SIZE = 10;

// origin/destination are stored as JSONB { address, lat, lng }; show the address.
function formatEndpoint(point) {
  if (!point) {
    return "Unknown";
  }
  if (point.address) {
    return point.address;
  }
  if (point.lat != null && point.lng != null) {
    return `${point.lat}, ${point.lng}`;
  }
  return "Unknown";
}

// Rebuild the planning state from a loaded trip view. clearAll first so a loaded
// trip never merges with an in-progress one; SET_ROUTE also flips showRoute /
// showDetourButton so the map and sidebar render.
function applyTripView(dispatch, { trip, route, detours }) {
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
  dispatch({ type: "SET_DETOUR_LIST", data: { detourList: detours || [] } });
}

/**
 * MyTrips — a "My Trips" button (shown only when signed in) that opens a
 * non-modal Fluent drawer listing the user's saved trips. The drawer overlays
 * the map without a backdrop, so the map stays visible behind it. Clicking a
 * trip loads it onto the map and into the sidebar; the drawer stays open.
 */
export default function MyTrips() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loadingTripId, setLoadingTripId] = useState(null);

  // Monotonic token for load requests. Only the most recent click's response is
  // applied, so quick successive clicks can't resolve out of order and load the
  // wrong trip (or let an earlier request clear the later one's loading state).
  const latestRequestRef = useRef(0);

  const toasterId = useId("my-trips-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const load = useCallback((nextPage) => {
    setLoading(true);
    setError(false);
    new TripRequester()
      .listTrips(nextPage, PAGE_SIZE)
      .then((data) => {
        setTrips(data.trips || []);
        setTotal(data.total || 0);
        setPage(data.page || nextPage);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = () => {
    setOpen(true);
    load(1);
  };

  // Fetch a saved trip and rebuild the planning state from it. clearAll first so
  // a loaded trip never merges with an in-progress one. The drawer stays open.
  // Only show the spinner if the load is slow (>250ms); fast loads render
  // instantly, so a momentary spinner would just be a distracting flash.
  const loadTrip = useCallback(
    (tripId) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      const isLatest = () => latestRequestRef.current === requestId;

      let settled = false;
      const spinnerTimer = setTimeout(() => {
        if (!settled && isLatest()) {
          setLoadingTripId(tripId);
        }
      }, 250);
      new TripRequester()
        .getTrip(tripId)
        .then((view) => {
          // Ignore a stale response from a superseded click.
          if (isLatest()) {
            applyTripView(dispatch, view);
          }
        })
        .catch((err) => {
          log.error("Failed to load trip:", err);
          if (!isLatest()) {
            return;
          }
          dispatchToast(
            <Toast>
              <ToastTitle>
                Could not load that trip. Please try again.
              </ToastTitle>
            </Toast>,
            { intent: "error" }
          );
        })
        .finally(() => {
          settled = true;
          clearTimeout(spinnerTimer);
          // Only the latest request owns the loading indicator.
          if (isLatest()) {
            setLoadingTripId(null);
          }
        });
    },
    [dispatch, dispatchToast]
  );

  if (!user) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Toaster toasterId={toasterId} />
      <Button appearance="secondary" id="my-trips-button" onClick={handleOpen}>
        My Trips
      </Button>

      <OverlayDrawer
        as="aside"
        position="end"
        modalType="non-modal"
        open={open}
        onOpenChange={(event, data) => setOpen(data.open)}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            }
          >
            My Trips
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <Spinner label="Loading trips..." />
          ) : error ? (
            <Text>Could not load your trips. Please try again.</Text>
          ) : total === 0 ? (
            <Text>You haven&apos;t saved any trips yet.</Text>
          ) : (
            <>
              <div className="my-trips-list">
                {trips.map((trip) => (
                  <Card
                    key={trip.trip_id}
                    className="my-trips-card"
                    style={{ position: "relative" }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Load trip ${trip.trip_name}`}
                    aria-busy={loadingTripId === trip.trip_id}
                    onClick={() => loadTrip(trip.trip_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        loadTrip(trip.trip_id);
                      }
                    }}
                  >
                    {loadingTripId === trip.trip_id && (
                      <div
                        style={{ position: "absolute", top: 8, right: 8 }}
                        aria-hidden="true"
                      >
                        <Spinner size="tiny" />
                      </div>
                    )}
                    <Text weight="semibold">{trip.trip_name}</Text>
                    <Text size={200}>
                      {formatEndpoint(trip.origin)} &rarr;{" "}
                      {formatEndpoint(trip.destination)}
                    </Text>
                    <Text size={200}>
                      Saved {new Date(trip.created_at).toLocaleDateString()}
                    </Text>
                  </Card>
                ))}
              </div>

              <div className="my-trips-pager">
                <Button
                  appearance="secondary"
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                >
                  Previous
                </Button>
                <Text>
                  Page {page} of {totalPages}
                </Text>
                <Button
                  appearance="secondary"
                  disabled={page >= totalPages}
                  onClick={() => load(page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </DrawerBody>
      </OverlayDrawer>
    </>
  );
}
