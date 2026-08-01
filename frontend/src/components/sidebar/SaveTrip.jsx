import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Toast,
  Toaster,
  ToastTitle,
  makeStyles,
  tokens,
  useId,
  useToastController,
} from "@fluentui/react-components";
import TripRequester, { buildTripPayload } from "../../scripts/TripRequester";
import AuthRequester from "../../scripts/AuthRequester";
import { createPlannerFingerprint } from "../planner/build-workflow/plannerFingerprint";
import { jauntSpacing, jauntTypography } from "../../design-system/tokens";

const RESUME_SAVE_KEY = "jaunt.resumeSaveTrip";

const useStyles = makeStyles({
  root: {
    display: "grid",
    marginTop: jauntSpacing[5],
    padding: `${jauntSpacing[4]} ${jauntSpacing[4]} ${jauntSpacing[5]}`,
    rowGap: jauntSpacing[3],
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  embedded: {
    marginTop: 0,
    padding: 0,
    borderTop: 0,
  },
  context: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: jauntSpacing[2],
    "@media (max-width: 20rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

export default function SaveTrip({
  embedded = false,
  onClear = () => {},
  onStatusChange = () => {},
}) {
  const styles = useStyles();
  const {
    user,
    origin,
    destination,
    route,
    detourList,
    tripName,
    currentTrip,
  } = useSelector(
    (state) => ({
      user: state.user,
      origin: state.origin,
      destination: state.destination,
      route: state.route,
      detourList: state.detourList,
      tripName: state.tripName,
      currentTrip: state.currentTrip,
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [dialogName, setDialogName] = useState("");
  const [saving, setSaving] = useState(false);
  const toasterId = useId("save-trip-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const auth = new AuthRequester();

  const setTripName = useCallback(
    (name) => dispatch({ type: "SET_TRIP_NAME", data: { tripName: name } }),
    [dispatch]
  );

  const showToast = useCallback(
    (message, intent) =>
      dispatchToast(
        <Toast>
          <ToastTitle>{message}</ToastTitle>
        </Toast>,
        { intent }
      ),
    [dispatchToast]
  );

  const buildSavedFingerprint = useCallback(
    (name) =>
      createPlannerFingerprint({
        origin,
        destination,
        route,
        detourList,
        tripName: name,
      }),
    [destination, detourList, origin, route]
  );

  const persist = useCallback(
    (name) => {
      setSaving(true);
      onStatusChange("saving");
      const payload = buildTripPayload(
        { origin, destination, route, detourList },
        name,
        currentTrip
      );
      const requester = new TripRequester();

      const create = () =>
        requester.saveTrip(payload).then((data) => {
          const trip = data.trip || {};
          setTripName(name);
          dispatch({
            type: "SET_CURRENT_TRIP",
            data: {
              currentTrip: {
                tripId: trip.trip_id,
                tripName: name,
                updatedAt: trip.updated_at,
                origin: trip.origin,
                destination: trip.destination,
                routePolyline: trip.route_polyline,
                distanceMeters: trip.distance_meters,
                durationSeconds: trip.duration_seconds,
                savedFingerprint: buildSavedFingerprint(name),
              },
            },
          });
        });

      const save = currentTrip
        ? requester
            .updateTrip(currentTrip.tripId, payload)
            .then((data) => {
              const trip = data.trip || {};
              const updatedRoute = data.route || {};
              const savedName = trip.tripName || name;
              setTripName(savedName);
              dispatch({
                type: "SET_CURRENT_TRIP",
                data: {
                  currentTrip: {
                    tripId: trip.tripId || currentTrip.tripId,
                    tripName: savedName,
                    updatedAt: trip.updatedAt,
                    origin: trip.origin,
                    destination: trip.destination,
                    routePolyline:
                      (updatedRoute.overview_polyline &&
                        updatedRoute.overview_polyline.points) ||
                      currentTrip.routePolyline ||
                      null,
                    distanceMeters: trip.distanceMeters,
                    durationSeconds: trip.durationSeconds,
                    savedFingerprint: buildSavedFingerprint(savedName),
                  },
                },
              });
            })
            .catch((error) => {
              if (error?.response?.status === 404) {
                return create();
              }
              throw error;
            })
        : create();

      return save
        .then(() => {
          setNameDialogOpen(false);
          dispatch({ type: "BUMP_TRIPS_REVISION" });
          onStatusChange("idle");
          showToast("Jaunt saved", "success");
        })
        .catch(() => {
          onStatusChange("failed");
          showToast("Could not save Jaunt. Please try again.", "error");
        })
        .finally(() => setSaving(false));
    },
    [
      origin,
      destination,
      route,
      detourList,
      currentTrip,
      dispatch,
      setTripName,
      buildSavedFingerprint,
      onStatusChange,
      showToast,
    ]
  );

  const requestSave = useCallback(() => {
    const name = (tripName || "").trim();
    if (name) {
      persist(name);
    } else {
      setDialogName("");
      setNameDialogOpen(true);
    }
  }, [tripName, persist]);

  useEffect(() => {
    if (user && sessionStorage.getItem(RESUME_SAVE_KEY)) {
      sessionStorage.removeItem(RESUME_SAVE_KEY);
      requestSave();
    }
  }, [user, requestSave]);

  const handlePrimaryClick = () => {
    if (!user) {
      setSignInDialogOpen(true);
      return;
    }
    requestSave();
  };

  const handleSignIn = () => {
    sessionStorage.setItem(RESUME_SAVE_KEY, "1");
    auth.login();
  };

  return (
    <>
      <Toaster toasterId={toasterId} />

      <section
        className={`${styles.root} ${embedded ? styles.embedded : ""}`}
        aria-label="Save Jaunt"
      >
        <span className={styles.context}>
          {currentTrip
            ? "Changes update the loaded Jaunt."
            : "Sign in only when you are ready to save."}
        </span>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            id="save-trip-button"
            disabled={saving}
            onClick={handlePrimaryClick}
          >
            {saving
              ? "Saving Jaunt"
              : currentTrip
                ? "Update Jaunt"
                : "Save Jaunt"}
          </Button>
          <Button appearance="secondary" disabled={saving} onClick={onClear}>
            Clear
          </Button>
        </div>
      </section>

      <Dialog
        open={nameDialogOpen}
        onOpenChange={(event, data) => setNameDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Save your Jaunt</DialogTitle>
            <DialogContent>
              <Field label="Jaunt name" required>
                <Input
                  value={dialogName}
                  placeholder="e.g. Carolinas weekend"
                  onChange={(event) => setDialogName(event.target.value)}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={saving}
                onClick={() => setNameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={saving || !dialogName.trim()}
                onClick={() => persist(dialogName.trim())}
              >
                {saving ? "Saving Jaunt" : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={signInDialogOpen}
        onOpenChange={(event, data) => setSignInDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Sign in to save your Jaunt</DialogTitle>
            <DialogContent>
              Create an account or sign in to save this Jaunt and access it
              later.
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setSignInDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleSignIn}>
                Sign in
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}

SaveTrip.propTypes = {
  embedded: PropTypes.bool,
  onClear: PropTypes.func,
  onStatusChange: PropTypes.func,
};

SaveTrip.defaultProps = {
  onClear: () => {},
  onStatusChange: () => {},
};
