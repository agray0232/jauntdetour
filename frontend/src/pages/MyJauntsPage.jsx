import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Text,
  Toast,
  Toaster,
  ToastTitle,
  makeStyles,
  shorthands,
  tokens,
  useId,
  useToastController,
} from "@fluentui/react-components";
import {
  CopyRegular,
  DeleteRegular,
  MoreHorizontalRegular,
} from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../design-system/tokens";
import TripRequester from "../scripts/TripRequester";
import { trackEvent } from "../telemetry/telemetry";

const PAGE_SIZE = 10;

function getCountBucket(count) {
  if (count === 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 10) return "6-10";
  return "11+";
}

const useStyles = makeStyles({
  page: {
    minHeight: "100%",
    padding: `${jauntSpacing[7]} max(${jauntSpacing[5]}, calc((100vw - 72rem) / 2)) ${jauntSpacing[9]}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    marginBottom: jauntSpacing[7],
    gap: jauntSpacing[5],
    "@media (max-width: 40rem)": {
      alignItems: "start",
      flexDirection: "column",
    },
  },
  headingGroup: {
    display: "grid",
    rowGap: jauntSpacing[2],
  },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  subtitle: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodyLarge,
  },
  actionLink: {
    display: "inline-flex",
    minHeight: "2rem",
    alignItems: "center",
    justifyContent: "center",
    padding: `0 ${jauntSpacing[3]}`,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    fontWeight: jauntTypography.weight.semibold,
    textDecorationLine: "none",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    borderRadius: jauntRadius.control,
    ":hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  primaryLink: {
    minHeight: "2.5rem",
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.borderColor(tokens.colorBrandBackground),
    ":hover": { backgroundColor: tokens.colorBrandBackgroundHover },
  },
  state: {
    display: "grid",
    minHeight: "16rem",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    rowGap: jauntSpacing[4],
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
  },
  stateTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  list: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyleType: "none",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
  },
  row: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "minmax(18rem, 1fr) minmax(18rem, 1.25fr) auto auto",
    alignItems: "center",
    minHeight: "7.5rem",
    padding: `${jauntSpacing[4]} ${jauntSpacing[3]}`,
    columnGap: jauntSpacing[5],
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
    "@media (max-width: 60rem)": {
      gridTemplateColumns: "1fr auto",
      rowGap: jauntSpacing[3],
    },
  },
  nameGroup: {
    display: "grid",
    minWidth: 0,
    rowGap: jauntSpacing[2],
  },
  name: {
    overflow: "hidden",
    color: tokens.colorNeutralForeground1,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.bodyLarge,
    fontWeight: jauntTypography.weight.semibold,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metadata: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  route: {
    minWidth: 0,
    "@media (max-width: 60rem)": {
      gridColumn: "1 / -1",
      gridRow: 2,
    },
  },
  endpoint: {
    display: "block",
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "min(22rem, 36%)",
    overflow: "hidden",
    textAlign: "center",
    textOverflow: "ellipsis",
    transform: "translate(-50%, -50%)",
    whiteSpace: "nowrap",
    "@media (max-width: 60rem)": {
      position: "static",
      width: "auto",
      textAlign: "left",
      transform: "none",
    },
  },
  count: {
    color: jauntColors.brand.accentStrong,
    fontWeight: jauntTypography.weight.semibold,
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
    columnGap: jauntSpacing[2],
  },
  pager: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    marginTop: jauntSpacing[5],
    columnGap: jauntSpacing[4],
  },
  pagerNext: {
    justifySelf: "end",
  },
  dialog: {
    borderRadius: jauntRadius.surface,
  },
});

function formatEndpoint(endpoint) {
  if (endpoint?.address) return endpoint.address;
  if (endpoint?.lat != null && endpoint?.lng != null) {
    return `${endpoint.lat}, ${endpoint.lng}`;
  }
  return "Unknown location";
}

function formatUpdated(value) {
  if (!value) return "Saved date unavailable";
  return `Updated ${new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export default function MyJauntsPage() {
  const styles = useStyles();
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [duplicateId, setDuplicateId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const latestListRequest = useRef(0);
  const toasterId = useId("my-jaunts-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const load = useCallback((nextPage) => {
    const requestId = latestListRequest.current + 1;
    latestListRequest.current = requestId;
    setStatus("loading");
    new TripRequester()
      .listTrips(nextPage, PAGE_SIZE)
      .then((data) => {
        if (requestId !== latestListRequest.current) return;
        setTrips(data.trips || []);
        setTotal(data.total || 0);
        setPage(data.page || nextPage);
        setStatus("ready");
        trackEvent("trip_list_viewed", {
          countBucket: getCountBucket((data.trips || []).length),
          feature: "trip",
          source: "list",
        });
      })
      .catch(() => {
        if (requestId === latestListRequest.current) setStatus("error");
      });
  }, []);

  useEffect(() => {
    load(1);
    return () => {
      latestListRequest.current += 1;
    };
  }, [load]);

  const duplicateTrip = (trip) => {
    setDuplicateId(trip.trip_id);
    new TripRequester()
      .duplicateTrip(trip.trip_id)
      .then(() => {
        trackEvent("trip_duplicated", { feature: "trip", source: "list" });
        dispatchToast(
          <Toast>
            <ToastTitle>Jaunt duplicated</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
        load(page);
      })
      .catch(() => {
        trackEvent("trip_duplicate_failed", {
          failureClass: "request_failed",
          feature: "trip",
          source: "list",
        });
        dispatchToast(
          <Toast>
            <ToastTitle>Could not duplicate that Jaunt.</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setDuplicateId(null));
  };

  const deleteTrip = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    new TripRequester()
      .deleteTrip(deleteTarget.trip_id)
      .then(() => {
        trackEvent("trip_deleted", { feature: "trip", source: "list" });
        const remaining = trips.filter(
          (trip) => trip.trip_id !== deleteTarget.trip_id
        );
        setDeleteTarget(null);
        dispatchToast(
          <Toast>
            <ToastTitle>Jaunt deleted</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
        if (remaining.length === 0 && page > 1) load(page - 1);
        else {
          setTrips(remaining);
          setTotal((value) => Math.max(0, value - 1));
        }
      })
      .catch(() => {
        trackEvent("trip_delete_failed", {
          failureClass: "request_failed",
          feature: "trip",
          source: "list",
        });
        dispatchToast(
          <Toast>
            <ToastTitle>Could not delete that Jaunt.</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setDeleting(false));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className={styles.page}>
      <Toaster toasterId={toasterId} />
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>My Jaunts</h1>
          <p className={styles.subtitle}>Your saved routes and detours</p>
        </div>
        <Link
          className={`${styles.actionLink} ${styles.primaryLink}`}
          to="/plan"
        >
          Plan a Jaunt
        </Link>
      </header>

      {status === "loading" ? (
        <div className={styles.state} role="status">
          <Spinner label="Loading your Jaunts..." />
        </div>
      ) : status === "error" ? (
        <section className={styles.state} aria-labelledby="jaunts-error-title">
          <h2 className={styles.stateTitle} id="jaunts-error-title">
            Jaunts could not be loaded
          </h2>
          <Button appearance="primary" onClick={() => load(page)}>
            Retry
          </Button>
        </section>
      ) : total === 0 ? (
        <section className={styles.state} aria-labelledby="jaunts-empty-title">
          <h2 className={styles.stateTitle} id="jaunts-empty-title">
            No saved Jaunts yet
          </h2>
          <Text>Build a route, discover a stop, and save the drive.</Text>
          <Link
            className={`${styles.actionLink} ${styles.primaryLink}`}
            to="/plan"
          >
            Plan a Jaunt
          </Link>
        </section>
      ) : (
        <>
          <ul className={styles.list} aria-label="Saved Jaunts">
            {trips.map((trip) => {
              const hasDetourCount = trip.detour_count != null;
              const detourCount = hasDetourCount
                ? Number(trip.detour_count)
                : null;
              return (
                <li key={trip.trip_id}>
                  <article className={styles.row}>
                    <div className={styles.nameGroup}>
                      <span className={styles.name}>{trip.trip_name}</span>
                      <span className={styles.metadata}>
                        {formatUpdated(trip.updated_at || trip.created_at)}
                      </span>
                    </div>
                    <div className={styles.route}>
                      <span className={styles.endpoint}>
                        {formatEndpoint(trip.origin)} to{" "}
                        {formatEndpoint(trip.destination)}
                      </span>
                    </div>
                    <span className={styles.count}>
                      {hasDetourCount
                        ? `${detourCount} ${
                            detourCount === 1 ? "detour" : "detours"
                          }`
                        : "Detour count unavailable"}
                    </span>
                    <div className={styles.actions}>
                      <Link
                        className={styles.actionLink}
                        to={`/trips/${trip.trip_id}`}
                        onClick={() =>
                          trackEvent("trip_opened", {
                            feature: "trip",
                            source: "list",
                          })
                        }
                      >
                        Open
                      </Link>
                      <Menu>
                        <MenuTrigger disableButtonEnhancement>
                          <Button
                            appearance="subtle"
                            aria-label={`More actions for ${trip.trip_name}`}
                            icon={<MoreHorizontalRegular />}
                          />
                        </MenuTrigger>
                        <MenuPopover>
                          <MenuList>
                            <MenuItem
                              disabled={duplicateId === trip.trip_id}
                              icon={<CopyRegular />}
                              onClick={() => duplicateTrip(trip)}
                            >
                              {duplicateId === trip.trip_id
                                ? "Creating a copy..."
                                : "Duplicate"}
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
                  </article>
                </li>
              );
            })}
          </ul>
          <nav className={styles.pager} aria-label="My Jaunts pages">
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
              className={styles.pagerNext}
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Next
            </Button>
          </nav>
        </>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(event, data) => {
          if (!data.open && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogSurface className={styles.dialog}>
          <DialogBody>
            <DialogTitle>Delete this Jaunt permanently?</DialogTitle>
            <DialogContent>
              {deleteTarget
                ? `“${deleteTarget.trip_name}” and its detours will be deleted. This cannot be undone.`
                : "This cannot be undone."}
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
                onClick={deleteTrip}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </main>
  );
}
