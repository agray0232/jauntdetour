import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
// prompt, so the name dialog reopens automatically after the login redirect.
const RESUME_SAVE_KEY = "jaunt.resumeSaveTrip";

/**
 * SaveTrip — "Save Trip" button plus its Fluent dialogs and toast.
 *
 * Reads the current trip straight from Redux, so it can drop into TripSummary
 * with no prop threading. Signed-out users get a prompt to sign in; signed-in
 * users get a name dialog, and the result is reported via a Fluent toast.
 */
export default function SaveTrip() {
  const { user, origin, destination, route, detourList } = useSelector(
    (state) => ({
      user: state.user,
      origin: state.origin,
      destination: state.destination,
      route: state.route,
      detourList: state.detourList,
    })
  );

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [tripName, setTripName] = useState("");
  const [saving, setSaving] = useState(false);

  const toasterId = useId("save-trip-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const auth = new AuthRequester();

  // Clicking "Sign in" from the save prompt is an intent to save. We stash a
  // one-shot flag before the login redirect; once the user is authenticated on
  // return, reopen the name dialog automatically.
  useEffect(() => {
    if (user && sessionStorage.getItem(RESUME_SAVE_KEY)) {
      sessionStorage.removeItem(RESUME_SAVE_KEY);
      setTripName("");
      setNameDialogOpen(true);
    }
  }, [user]);

  const handleClick = () => {
    if (!user) {
      setSignInDialogOpen(true);
    } else {
      setTripName("");
      setNameDialogOpen(true);
    }
  };

  const handleSignIn = () => {
    // Survive the full-page login redirect so we can resume on return.
    sessionStorage.setItem(RESUME_SAVE_KEY, "1");
    auth.login();
  };

  const handleSave = () => {
    const name = tripName.trim();
    if (!name) {
      return;
    }
    setSaving(true);
    const payload = buildTripPayload(
      { origin, destination, route, detourList },
      name
    );
    new TripRequester()
      .saveTrip(payload)
      .then(() => {
        setNameDialogOpen(false);
        dispatchToast(
          <Toast>
            <ToastTitle>Trip saved</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      })
      .catch(() => {
        dispatchToast(
          <Toast>
            <ToastTitle>Could not save trip. Please try again.</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <>
      <Toaster toasterId={toasterId} />

      <Button
        appearance="primary"
        className="save-trip-btn mt-2"
        id="save-trip-button"
        onClick={handleClick}
      >
        Save Trip
      </Button>

      {/* Signed-in: prompt for a trip name. */}
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
                  value={tripName}
                  placeholder="e.g. Coastal weekend"
                  onChange={(event) => setTripName(event.target.value)}
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
                disabled={saving || !tripName.trim()}
                onClick={handleSave}
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
