import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Field,
  Input,
  Toaster,
  Toast,
  ToastTitle,
  useToastController,
  useId,
} from "@fluentui/react-components";
import TripRequester, { buildTripPayload } from "../../scripts/TripRequester";
import AuthRequester from "../../scripts/AuthRequester";

// sessionStorage flag: set when a signed-out user opts to sign in from the save
// prompt, so the save resumes automatically after the login redirect.
const RESUME_SAVE_KEY = "jaunt.resumeSaveTrip";

/**
 * SaveTrip — the trip name field plus the "Save Trip" control and its dialogs.
 *
 * Reads the current trip straight from Redux. The trip name is a first-class,
 * editable field (Redux `tripName`): when a saved trip is loaded its name
 * populates here. The button always reads "Save Trip"; under the hood it updates
 * the loaded trip in place when one is loaded (`currentTrip`), otherwise creates
 * a new trip. If the loaded trip no longer exists (e.g. deleted elsewhere), the
 * update falls back to creating a new trip. Signed-out users are prompted to
 * sign in.
 */
export default function SaveTrip() {
  const {
    user,
    origin,
    destination,
    route,
    detourList,
    tripName,
    currentTrip,
  } = useSelector((state) => ({
    user: state.user,
    origin: state.origin,
    destination: state.destination,
    route: state.route,
    detourList: state.detourList,
    tripName: state.tripName,
    currentTrip: state.currentTrip,
  }));
  const dispatch = useDispatch();

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  // Local buffer for the fallback "name required" dialog input.
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

  // Persist the current plan under `name`: update the loaded trip in place, or
  // create a new one. A 404 on update means the loaded trip is gone (deleted),
  // so fall back to creating it as a new trip. On success, bump the revision so
  // an open "My Trips" list refreshes.
  const persist = useCallback(
    (name) => {
      setSaving(true);
      const payload = buildTripPayload(
        { origin, destination, route, detourList },
        name
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
              },
            },
          });
        });

      const save = currentTrip
        ? requester
            .updateTrip(currentTrip.tripId, payload)
            .then((data) => {
              const trip = data.trip || {};
              setTripName(trip.tripName || name);
              dispatch({
                type: "SET_CURRENT_TRIP",
                data: {
                  currentTrip: {
                    tripId: trip.tripId || currentTrip.tripId,
                    tripName: trip.tripName || name,
                    updatedAt: trip.updatedAt,
                  },
                },
              });
            })
            .catch((err) => {
              // The loaded trip no longer exists — save it as a new trip.
              if (err && err.response && err.response.status === 404) {
                return create();
              }
              throw err;
            })
        : create();

      return save
        .then(() => {
          setNameDialogOpen(false);
          dispatch({ type: "BUMP_TRIPS_REVISION" });
          showToast("Trip saved", "success");
        })
        .catch(() => {
          showToast("Could not save trip. Please try again.", "error");
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
      showToast,
    ]
  );

  // Start a save: save directly when a name is present, else prompt for one.
  const requestSave = useCallback(() => {
    const name = (tripName || "").trim();
    if (name) {
      persist(name);
    } else {
      setDialogName("");
      setNameDialogOpen(true);
    }
  }, [tripName, persist]);

  // Clicking "Sign in" from the save prompt is an intent to save. We stash a
  // one-shot flag before the login redirect; once authenticated on return,
  // resume the save automatically.
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
    // Survive the full-page login redirect so we can resume on return.
    sessionStorage.setItem(RESUME_SAVE_KEY, "1");
    auth.login();
  };

  return (
    <>
      <Toaster toasterId={toasterId} />

      <div className="save-trip-section">
        <Button
          appearance="primary"
          className="save-trip-btn"
          id="save-trip-button"
          disabled={saving}
          onClick={handlePrimaryClick}
        >
          {saving ? "Saving..." : "Save Trip"}
        </Button>
      </div>

      {/* Fallback: prompt for a name when saving without one. */}
      <Dialog
        open={nameDialogOpen}
        onOpenChange={(event, data) => setNameDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Save your trip</DialogTitle>
            <DialogContent>
              <Field label="Trip name" required>
                <Input
                  value={dialogName}
                  placeholder="e.g. Coastal weekend"
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
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Signed-out: prompt to sign in. */}
      <Dialog
        open={signInDialogOpen}
        onOpenChange={(event, data) => setSignInDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Sign in to save your trip</DialogTitle>
            <DialogContent>
              Create an account or sign in to save this trip and access it
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
