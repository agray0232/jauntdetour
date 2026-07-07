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
  Text,
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

// Format an ISO timestamp for the "Last saved" line. Returns "" when absent.
function formatLastSaved(updatedAt) {
  if (!updatedAt) {
    return "";
  }
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * SaveTrip — the trip name field plus the save/update control and its dialogs.
 *
 * Reads the current trip straight from Redux. The trip name is a first-class,
 * editable field (Redux `tripName`): when a saved trip is loaded its name
 * populates here and the primary button becomes "Update Trip"; for a brand-new
 * trip the button is "Save Trip" (saving directly when a name is present, or
 * prompting for one when it is blank). Signed-out users are prompted to sign in.
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

  // Create a brand-new trip, then remember it as the current trip so subsequent
  // saves update it in place.
  const createTrip = useCallback(
    (name) => {
      setSaving(true);
      const payload = buildTripPayload(
        { origin, destination, route, detourList },
        name
      );
      return new TripRequester()
        .saveTrip(payload)
        .then((data) => {
          const trip = data.trip || {};
          setNameDialogOpen(false);
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
          showToast("Trip saved", "success");
        })
        .catch(() => {
          showToast("Could not save trip. Please try again.", "error");
        })
        .finally(() => setSaving(false));
    },
    [origin, destination, route, detourList, dispatch, setTripName, showToast]
  );

  // Update the currently loaded trip in place (persists any name edits too).
  const updateTrip = useCallback(() => {
    const name = (tripName || "").trim();
    if (!name || !currentTrip) {
      return;
    }
    setSaving(true);
    const payload = buildTripPayload(
      { origin, destination, route, detourList },
      name
    );
    new TripRequester()
      .updateTrip(currentTrip.tripId, payload)
      .then((data) => {
        const trip = data.trip || {};
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
        showToast("Trip updated", "success");
      })
      .catch(() => {
        showToast("Could not update trip. Please try again.", "error");
      })
      .finally(() => setSaving(false));
  }, [
    tripName,
    currentTrip,
    origin,
    destination,
    route,
    detourList,
    dispatch,
    showToast,
  ]);

  // Start a save for a new trip: save directly when a name is present, else
  // prompt for one.
  const saveNewTrip = useCallback(() => {
    const name = (tripName || "").trim();
    if (name) {
      createTrip(name);
    } else {
      setDialogName("");
      setNameDialogOpen(true);
    }
  }, [tripName, createTrip]);

  // Clicking "Sign in" from the save prompt is an intent to save. We stash a
  // one-shot flag before the login redirect; once authenticated on return,
  // resume the save automatically.
  useEffect(() => {
    if (user && sessionStorage.getItem(RESUME_SAVE_KEY)) {
      sessionStorage.removeItem(RESUME_SAVE_KEY);
      saveNewTrip();
    }
  }, [user, saveNewTrip]);

  const handlePrimaryClick = () => {
    if (!user) {
      setSignInDialogOpen(true);
      return;
    }
    if (currentTrip) {
      updateTrip();
    } else {
      saveNewTrip();
    }
  };

  const handleSignIn = () => {
    // Survive the full-page login redirect so we can resume on return.
    sessionStorage.setItem(RESUME_SAVE_KEY, "1");
    auth.login();
  };

  const isUpdate = Boolean(currentTrip);
  const lastSaved = isUpdate ? formatLastSaved(currentTrip.updatedAt) : "";

  return (
    <>
      <Toaster toasterId={toasterId} />

      {/* Editable trip name — populated when a saved trip is loaded. */}
      <Field className="trip-name-field mt-2" label="Trip name">
        <Input
          value={tripName || ""}
          placeholder="e.g. Coastal weekend"
          onChange={(event) => setTripName(event.target.value)}
        />
      </Field>

      <Button
        appearance="primary"
        className="save-trip-btn mt-2"
        id="save-trip-button"
        disabled={saving || (isUpdate && !(tripName || "").trim())}
        onClick={handlePrimaryClick}
      >
        {isUpdate
          ? saving
            ? "Updating..."
            : "Update Trip"
          : saving
            ? "Saving..."
            : "Save Trip"}
      </Button>

      {lastSaved && (
        <Text size={200} className="last-saved-text">
          Last saved {lastSaved}
        </Text>
      )}

      {/* Fallback: prompt for a name when saving a new trip without one. */}
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
                onClick={() => createTrip(dialogName.trim())}
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
