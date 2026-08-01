import React, { useEffect, useRef, useState } from "react";
import {
  Badge,
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
  ArrowLeftRegular,
  CopyRegular,
  DeleteRegular,
  MoreHorizontalRegular,
  OpenRegular,
} from "@fluentui/react-icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MapContainer from "../components/MapContainer";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../design-system/tokens";
import TripRequester from "../scripts/TripRequester";
import applyTripView from "../utils/applyTripView";
import { getDetourIconComponent } from "../utils/detourIcons";
import { exportToGoogleMaps } from "../utils/googleMapsExport";

const useStyles = makeStyles({
  page: {
    minHeight: "100%",
    padding: `${jauntSpacing[6]} max(${jauntSpacing[5]}, calc((100vw - 76rem) / 2)) ${jauntSpacing[8]}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: jauntSpacing[5],
    columnGap: jauntSpacing[2],
    color: jauntColors.brand.primary,
    fontWeight: jauntTypography.weight.semibold,
    textDecorationLine: "none",
    ":hover": { textDecorationLine: "underline" },
  },
  state: {
    display: "grid",
    minHeight: "22rem",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    rowGap: jauntSpacing[4],
  },
  stateTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  header: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    marginBottom: jauntSpacing[6],
    gap: jauntSpacing[5],
    "@media (max-width: 42rem)": {
      alignItems: "start",
      flexDirection: "column",
    },
  },
  headingGroup: { display: "grid", rowGap: jauntSpacing[2] },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  updated: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    columnGap: jauntSpacing[2],
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(20rem, 0.88fr) minmax(25rem, 1.12fr)",
    minHeight: "31rem",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    borderRadius: jauntRadius.surface,
    overflow: "hidden",
    "@media (max-width: 52rem)": {
      gridTemplateColumns: "1fr",
    },
  },
  details: {
    display: "grid",
    alignContent: "start",
    padding: jauntSpacing[6],
    rowGap: jauntSpacing[6],
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
    paddingBottom: jauntSpacing[5],
  },
  metric: {
    display: "grid",
    rowGap: jauntSpacing[1],
    ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
    paddingRight: jauntSpacing[3],
    paddingLeft: jauntSpacing[3],
    ":first-child": { paddingLeft: 0 },
    ":last-child": { borderRightStyle: "none" },
  },
  metricValue: {
    fontSize: jauntTypography.size.bodyLarge,
    fontWeight: jauntTypography.weight.bold,
  },
  metricLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  itinerary: { display: "grid", rowGap: jauntSpacing[4] },
  sectionTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  itineraryList: {
    display: "grid",
    margin: 0,
    padding: 0,
    rowGap: jauntSpacing[3],
    listStyleType: "none",
  },
  stop: {
    display: "grid",
    gridTemplateColumns: "2.25rem 1fr auto",
    alignItems: "center",
    minWidth: 0,
    columnGap: jauntSpacing[3],
  },
  marker: {
    display: "grid",
    width: "2.25rem",
    height: "2.25rem",
    placeItems: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: jauntColors.neutral.foreground,
    borderRadius: "50%",
    fontWeight: jauntTypography.weight.bold,
  },
  detourMarker: { backgroundColor: jauntColors.brand.accentStrong },
  stopCopy: { display: "grid", minWidth: 0, rowGap: jauntSpacing[1] },
  stopName: { overflow: "hidden", textOverflow: "ellipsis" },
  stopMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  map: {
    minHeight: "31rem",
    backgroundColor: jauntColors.neutral.backgroundTinted,
    ...shorthands.borderLeft("1px", "solid", tokens.colorNeutralStroke1),
    "@media (max-width: 52rem)": {
      minHeight: "22rem",
      borderLeftStyle: "none",
      ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
    },
  },
});

function hasPlanningWork(state) {
  const routeHasData = Array.isArray(state.route)
    ? state.route.length > 0
    : Boolean(state.route && Object.keys(state.route).length);
  return Boolean(
    state.origin ||
      state.destination ||
      state.tripName ||
      routeHasData ||
      state.detourList?.length
  );
}

function formatDate(value) {
  if (!value) return "Updated date unavailable";
  return `Updated ${new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

function formatDistance(meters) {
  if (meters == null) return "—";
  return `${Math.round(Number(meters) / 1609.34)} mi`;
}

function formatDuration(seconds) {
  if (seconds == null) return "—";
  const hours = Math.floor(Number(seconds) / 3600);
  const minutes = Math.round((Number(seconds) % 3600) / 60);
  return hours ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

export default function JauntDetailPage() {
  const styles = useStyles();
  const { tripId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentTrip = useSelector((state) => state.currentTrip);
  const destination = useSelector((state) => state.destination);
  const detourList = useSelector((state) => state.detourList);
  const origin = useSelector((state) => state.origin);
  const plannerRoute = useSelector((state) => state.route);
  const tripName = useSelector((state) => state.tripName);
  const [view, setView] = useState(null);
  const [status, setStatus] = useState("loading");
  const [resumeConfirmation, setResumeConfirmation] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [operation, setOperation] = useState(null);
  const requestRef = useRef(0);
  const toasterId = useId("jaunt-detail-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const load = () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setStatus("loading");
    new TripRequester()
      .getTrip(tripId)
      .then((data) => {
        if (requestId !== requestRef.current) return;
        setView(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (requestId !== requestRef.current) return;
        setStatus(error?.response?.status === 404 ? "missing" : "error");
      });
  };

  useEffect(() => {
    load();
    return () => {
      requestRef.current += 1;
    };
    // tripId is the direct-link identity; changing it must replace the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const resumePlanning = () => {
    applyTripView(dispatch, view);
    navigate("/plan", {
      state: { loadedTripName: view.trip.tripName },
    });
  };

  const requestResume = () => {
    const plannerState = {
      currentTrip,
      destination,
      detourList,
      origin,
      route: plannerRoute,
      tripName,
    };
    if (
      hasPlanningWork(plannerState) &&
      currentTrip?.tripId !== view.trip.tripId
    ) {
      setResumeConfirmation(true);
      return;
    }
    resumePlanning();
  };

  const duplicateTrip = () => {
    setOperation("duplicate");
    new TripRequester()
      .duplicateTrip(tripId)
      .then(() => {
        dispatch({ type: "BUMP_TRIPS_REVISION" });
        dispatchToast(
          <Toast>
            <ToastTitle>Jaunt duplicated</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      })
      .catch(() => {
        dispatchToast(
          <Toast>
            <ToastTitle>Could not duplicate this Jaunt.</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setOperation(null));
  };

  const deleteTrip = () => {
    setOperation("delete");
    new TripRequester()
      .deleteTrip(tripId)
      .then(() => {
        dispatch({ type: "BUMP_TRIPS_REVISION" });
        navigate("/trips", { replace: true });
      })
      .catch(() => {
        setDeleteConfirmation(false);
        setOperation(null);
        dispatchToast(
          <Toast>
            <ToastTitle>Could not delete this Jaunt.</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      });
  };

  if (status !== "ready") {
    return (
      <main className={styles.page}>
        <Link className={styles.backLink} to="/trips">
          <ArrowLeftRegular /> My Jaunts
        </Link>
        {status === "loading" ? (
          <div className={styles.state} role="status">
            <Spinner label="Loading this Jaunt..." />
          </div>
        ) : (
          <section className={styles.state}>
            <h1 className={styles.stateTitle}>
              {status === "missing"
                ? "This Jaunt could not be found"
                : "This Jaunt could not be loaded"}
            </h1>
            <Button appearance="primary" onClick={load}>
              Retry
            </Button>
          </section>
        )}
      </main>
    );
  }

  const { trip, route, detours = [] } = view;

  return (
    <main className={styles.page}>
      <Toaster toasterId={toasterId} />
      <Link className={styles.backLink} to="/trips">
        <ArrowLeftRegular /> My Jaunts
      </Link>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>{trip.tripName}</h1>
          <p className={styles.updated}>{formatDate(trip.updatedAt)}</p>
        </div>
        <div className={styles.headerActions}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="secondary"
                aria-label="More Jaunt actions"
                icon={<MoreHorizontalRegular />}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  disabled={operation !== null}
                  icon={<CopyRegular />}
                  onClick={duplicateTrip}
                >
                  {operation === "duplicate"
                    ? "Creating a copy..."
                    : "Duplicate"}
                </MenuItem>
                <MenuItem
                  disabled={operation !== null}
                  icon={<DeleteRegular />}
                  onClick={() => setDeleteConfirmation(true)}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
          <Button appearance="primary" onClick={requestResume}>
            Resume Planning
          </Button>
        </div>
      </header>

      <section className={styles.layout} aria-label="Saved Jaunt details">
        <div className={styles.details}>
          <div className={styles.metrics} aria-label="Jaunt metrics">
            <div className={styles.metric}>
              <span className={styles.metricValue}>
                {formatDistance(trip.distanceMeters)}
              </span>
              <span className={styles.metricLabel}>Distance</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>
                {formatDuration(trip.durationSeconds)}
              </span>
              <span className={styles.metricLabel}>Drive time</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{detours.length}</span>
              <span className={styles.metricLabel}>
                {detours.length === 1 ? "Detour" : "Detours"}
              </span>
            </div>
          </div>

          <div className={styles.itinerary}>
            <h2 className={styles.sectionTitle}>Itinerary</h2>
            <ol className={styles.itineraryList}>
              <li className={styles.stop}>
                <span className={styles.marker}>A</span>
                <span className={styles.stopName}>{trip.origin?.address}</span>
              </li>
              {detours.map((detour, index) => (
                <li className={styles.stop} key={detour.placeId || index}>
                  <span
                    className={`${styles.marker} ${styles.detourMarker}`}
                    aria-hidden="true"
                  >
                    {getDetourIconComponent(detour.type)}
                  </span>
                  <span className={styles.stopCopy}>
                    <span className={styles.stopName}>{detour.name}</span>
                    <span className={styles.stopMeta}>{detour.type}</span>
                  </span>
                  {detour.rating != null && (
                    <Badge appearance="tint">{detour.rating} rating</Badge>
                  )}
                </li>
              ))}
              <li className={styles.stop}>
                <span className={styles.marker}>B</span>
                <span className={styles.stopName}>
                  {trip.destination?.address}
                </span>
              </li>
            </ol>
          </div>

          <Button
            appearance="secondary"
            icon={<OpenRegular />}
            onClick={() =>
              exportToGoogleMaps(
                trip.origin?.address || "",
                trip.destination?.address || "",
                detours
              )
            }
          >
            Open in Google Maps
          </Button>
        </div>
        <div className={styles.map} aria-label="Saved route preview">
          {route ? (
            <MapContainer
              detourHighlight={[]}
              detourList={detours}
              detourOptions={[]}
              route={route}
              showDetourSearchPoint={false}
              showRoute
            />
          ) : (
            <div className={styles.state}>Map preview unavailable</div>
          )}
        </div>
      </section>

      <Dialog
        open={resumeConfirmation}
        onOpenChange={(event, data) => setResumeConfirmation(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Replace your in-progress Jaunt?</DialogTitle>
            <DialogContent>
              Resuming this saved Jaunt will replace the route and stops
              currently in the planner.
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setResumeConfirmation(false)}
              >
                Keep current Jaunt
              </Button>
              <Button appearance="primary" onClick={resumePlanning}>
                Replace and resume
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={deleteConfirmation}
        onOpenChange={(event, data) => {
          if (operation !== "delete") setDeleteConfirmation(data.open);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete this Jaunt permanently?</DialogTitle>
            <DialogContent>
              “{trip.tripName}” and its detours will be deleted. This cannot be
              undone.
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={operation === "delete"}
                onClick={() => setDeleteConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={operation === "delete"}
                onClick={deleteTrip}
              >
                {operation === "delete" ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </main>
  );
}
