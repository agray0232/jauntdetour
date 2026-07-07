import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Toaster,
  Toast,
  ToastTitle,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  MoreHorizontalRegular,
  CopyRegular,
  DeleteRegular,
} from "@fluentui/react-icons";
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
// showDetourButton so the map and sidebar render. Record which saved trip is
// loaded (currentTrip) and its name so the sidebar can offer "Update Trip".
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
  dispatch({ type: "SET_TRIP_NAME", data: { tripName: trip.tripName || "" } });
  dispatch({
    type: "SET_CURRENT_TRIP",
    data: {
      currentTrip: {
        tripId: trip.tripId,
        tripName: trip.tripName,
        updatedAt: trip.updatedAt,
      },
    },
  });
}

/**
 * MyTrips — a "My Trips" button (shown only when signed in) that opens a
 * non-modal Fluent drawer listing the user's saved trips. The drawer overlays
 * the map without a backdrop, so the map stays visible behind it. Clicking a
 * trip loads it onto the map and into the sidebar; the drawer stays open.
 */
export default function MyTrips() {
  const user = useSelector((state) => state.user);
  // Bumped whenever a trip is saved/updated elsewhere (e.g. the Save Trip
  // button) so the open list can refresh instead of showing stale data.
  const tripsRevision = useSelector((state) => state.tripsRevision);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loadingTripId, setLoadingTripId] = useState(null);
  // Trip pending delete confirmation (null when the dialog is closed).
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Trip currently being duplicated (drives the per-card spinner).
  const [duplicatingTripId, setDuplicatingTripId] = useState(null);

  // Monotonic token for load requests. Only the most recent click's response is
  // applied, so quick successive clicks can't resolve out of order and load the
  // wrong trip (or let an earlier request clear the later one's loading state).
  const latestRequestRef = useRef(0);
  // Tracks the last trips-revision we reacted to, so we only reload when a trip
  // actually changed (not on the initial render).
  const prevRevisionRef = useRef(tripsRevision);

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

  // Refresh the open list when a trip is saved/updated elsewhere so it never
  // shows stale data (previously required closing and reopening the drawer).
  useEffect(() => {
    if (tripsRevision === prevRevisionRef.current) {
      return;
    }
    prevRevisionRef.current = tripsRevision;
    if (open) {
      load(page);
    }
  }, [tripsRevision, open, page, load]);

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

  // Duplicate a trip, then refresh the list so the new "Copy of ..." appears
  // (it sorts to the top by created_at). The copy is created server-side.
  const handleDuplicate = useCallback(
    (trip) => {
      setDuplicatingTripId(trip.trip_id);
      new TripRequester()
        .duplicateTrip(trip.trip_id)
        .then(() => {
          load(page);
          dispatchToast(
            <Toast>
              <ToastTitle>Trip duplicated</ToastTitle>
            </Toast>,
            { intent: "success" }
          );
        })
        .catch((err) => {
          log.error("Failed to duplicate trip:", err);
          dispatchToast(
            <Toast>
              <ToastTitle>
                Could not duplicate that trip. Please try again.
              </ToastTitle>
            </Toast>,
            { intent: "error" }
          );
        })
        .finally(() => setDuplicatingTripId(null));
    },
    [load, page, dispatchToast]
  );

  // Delete the trip awaiting confirmation, then update the list in place. If the
  // last trip on a page beyond the first is removed, step back a page so the
  // user isn't left on an empty page.
  const handleConfirmDelete = useCallback(() => {
    const trip = deleteTarget;
    if (!trip) {
      return;
    }
    setDeleting(true);
    new TripRequester()
      .deleteTrip(trip.trip_id)
      .then(() => {
        setDeleteTarget(null);
        const remaining = trips.filter((t) => t.trip_id !== trip.trip_id);
        if (remaining.length === 0 && page > 1) {
          load(page - 1);
        } else {
          setTrips(remaining);
          setTotal((prev) => Math.max(0, prev - 1));
        }
        dispatchToast(
          <Toast>
            <ToastTitle>Trip deleted</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      })
      .catch((err) => {
        log.error("Failed to delete trip:", err);
        dispatchToast(
          <Toast>
            <ToastTitle>
              Could not delete that trip. Please try again.
            </ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setDeleting(false));
  }, [deleteTarget, trips, page, load, dispatchToast]);

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
                    role="button"
                    tabIndex={0}
                    aria-label={`Load trip ${trip.trip_name}`}
                    aria-busy={
                      loadingTripId === trip.trip_id ||
                      duplicatingTripId === trip.trip_id
                    }
                    onClick={() => loadTrip(trip.trip_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        loadTrip(trip.trip_id);
                      }
                    }}
                  >
                    {(loadingTripId === trip.trip_id ||
                      duplicatingTripId === trip.trip_id) && (
                      <div
                        className="my-trips-card__spinner"
                        aria-hidden="true"
                      >
                        <Spinner size="tiny" />
                      </div>
                    )}
                    {/* Options menu — stop propagation so opening it (or picking
                        an item) never triggers the card's load-trip click. */}
                    <div
                      className="my-trips-card__menu"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <Menu>
                        <MenuTrigger disableButtonEnhancement>
                          <Button
                            appearance="subtle"
                            icon={<MoreHorizontalRegular />}
                            aria-label={`Options for ${trip.trip_name}`}
                          />
                        </MenuTrigger>
                        <MenuPopover>
                          <MenuList>
                            <MenuItem
                              icon={<CopyRegular />}
                              onClick={() => handleDuplicate(trip)}
                            >
                              Duplicate
                            </MenuItem>
                            <MenuItem
                              icon={<DeleteRegular />}
                              onClick={() => setDeleteTarget(trip)}
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                    </div>
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

      {/* Delete confirmation — driven by deleteTarget so a single dialog serves
          every card. */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(event, data) => {
          if (!data.open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete trip?</DialogTitle>
            <DialogContent>
              This permanently deletes
              {deleteTarget ? ` "${deleteTarget.trip_name}"` : " this trip"} and
              its detours. This can&apos;t be undone.
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
