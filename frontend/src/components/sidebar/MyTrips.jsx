import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Card,
  Text,
  Spinner,
} from "@fluentui/react-components";
import TripRequester from "../../scripts/TripRequester";

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

/**
 * MyTrips — a "My Trips" button (shown only when signed in) that opens a
 * non-modal Fluent drawer listing the user's saved trips. The drawer overlays
 * the map without a backdrop, so the map stays visible behind it. List-only for
 * now; loading a trip onto the map is a later story.
 */
export default function MyTrips() {
  const user = useSelector((state) => state.user);

  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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

  if (!user) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
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
                  <Card key={trip.trip_id} className="my-trips-card">
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
