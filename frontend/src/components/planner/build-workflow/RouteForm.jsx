import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRightRegular,
  DismissRegular,
  InfoRegular,
  LocationRegular,
  NavigationRegular,
} from "@fluentui/react-icons";
import RouteRequester from "../../../scripts/RouteRequester";
import { jauntSpacing, jauntTypography } from "../../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    padding: jauntSpacing[4],
    rowGap: jauntSpacing[4],
  },
  heading: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.bodyLarge,
  },
  headingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: jauntSpacing[3],
  },
  fields: {
    display: "grid",
    rowGap: jauntSpacing[3],
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: jauntSpacing[2],
  },
  primaryAction: {
    minWidth: "8.5rem",
  },
  note: {
    display: "flex",
    alignItems: "flex-start",
    columnGap: jauntSpacing[2],
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
    lineHeight: jauntTypography.lineHeight.standard,
  },
});

function normalizeEndpoint(value) {
  if (typeof value === "string") {
    return value;
  }
  return value?.address || "";
}

export default function RouteForm({
  clearAll,
  destination,
  detourList = [],
  onCancel = null,
  onRouteReady = () => {},
  origin,
  setDestination,
  setDetourList = () => {},
  setOrigin,
  setRoute,
  setTripSummary,
}) {
  const styles = useStyles();
  const [originValue, setOriginValue] = useState(normalizeEndpoint(origin));
  const [destinationValue, setDestinationValue] = useState(
    normalizeEndpoint(destination)
  );
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [keepExistingDetours, setKeepExistingDetours] = useState(true);
  const [incompatibleRoute, setIncompatibleRoute] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setOriginValue(normalizeEndpoint(origin));
  }, [origin]);

  useEffect(() => {
    setDestinationValue(normalizeEndpoint(destination));
  }, [destination]);

  const trimmedOrigin = originValue.trim();
  const trimmedDestination = destinationValue.trim();
  const originInvalid = submitted && !trimmedOrigin;
  const destinationInvalid = submitted && !trimmedDestination;
  const loading = status === "loading";
  const editingExistingJaunt = onCancel != null;
  const hasExistingDetours = editingExistingJaunt && detourList.length > 0;

  const commitRoute = (nextRoute, { removeDetours = false } = {}) => {
    setOrigin(trimmedOrigin);
    setDestination(trimmedDestination);
    setRoute(nextRoute);
    setTripSummary(nextRoute.summary);
    if (removeDetours) {
      setDetourList([]);
    } else if (hasExistingDetours) {
      setDetourList(detourList.map((detour) => ({ ...detour, addedTime: -1 })));
    }
    setStatus("ready");
    setIncompatibleRoute(null);
    onRouteReady();
  };

  const requestRoute = async () => {
    setSubmitted(true);
    setErrorMessage("");

    if (!trimmedOrigin || !trimmedDestination) {
      setStatus("invalid");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus("loading");

    try {
      const requester = new RouteRequester();
      const waypointIds = detourList
        .map((detour) => detour.placeId)
        .filter(Boolean);
      const preserveDetours =
        hasExistingDetours && keepExistingDetours && waypointIds.length > 0;
      const data = await requester.getRoute(
        trimmedOrigin,
        trimmedDestination,
        "Address",
        preserveDetours ? { waypoints: waypointIds } : {}
      );
      if (requestId !== requestIdRef.current) {
        return;
      }

      let nextRoute = data.routes && data.routes[0];
      if (!nextRoute) {
        if (preserveDetours) {
          const directData = await requester.getRoute(
            trimmedOrigin,
            trimmedDestination,
            "Address",
            {}
          );
          if (requestId !== requestIdRef.current) {
            return;
          }
          nextRoute = directData.routes && directData.routes[0];
          if (nextRoute) {
            setStatus("idle");
            setIncompatibleRoute(nextRoute);
            return;
          }
        }
        setStatus("error");
        setErrorMessage(
          "We could not find a drive between those places. Check both locations and try again."
        );
        return;
      }

      commitRoute(nextRoute, {
        removeDetours: hasExistingDetours && !keepExistingDetours,
      });
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStatus("error");
      setErrorMessage(
        "The route could not be created. Check your connection and try again."
      );
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    requestRoute();
  };

  const handleClear = () => {
    requestIdRef.current += 1;
    setOriginValue("");
    setDestinationValue("");
    setSubmitted(false);
    setStatus("idle");
    setErrorMessage("");
    setIncompatibleRoute(null);
    clearAll();
  };

  const handleCancel = () => {
    requestIdRef.current += 1;
    setIncompatibleRoute(null);
    onCancel();
  };

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      <div className={styles.headingRow}>
        <h3 className={styles.heading}>
          {onCancel ? "Edit Jaunt" : "Where are you headed?"}
        </h3>
        {onCancel ? (
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            type="button"
            disabled={loading}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      <div className={styles.fields}>
        <Field
          label="Start"
          required
          validationMessage={originInvalid ? "Enter a starting point." : null}
          validationState={originInvalid ? "error" : "none"}
        >
          <Input
            aria-label="Start"
            autoComplete="off"
            contentBefore={<NavigationRegular aria-hidden="true" />}
            placeholder="Enter a starting point"
            size="large"
            value={originValue}
            onChange={(event) => setOriginValue(event.target.value)}
          />
        </Field>
        <Field
          label="Destination"
          required
          validationMessage={destinationInvalid ? "Enter a destination." : null}
          validationState={destinationInvalid ? "error" : "none"}
        >
          <Input
            aria-label="Destination"
            autoComplete="off"
            contentBefore={<LocationRegular aria-hidden="true" />}
            placeholder="Where are you going?"
            size="large"
            value={destinationValue}
            onChange={(event) => setDestinationValue(event.target.value)}
          />
        </Field>
      </div>

      {hasExistingDetours ? (
        <Checkbox
          checked={keepExistingDetours}
          label="Keep existing detours"
          onChange={(event, data) => setKeepExistingDetours(data.checked)}
        />
      ) : null}

      {errorMessage ? (
        <MessageBar intent="error">
          <MessageBarBody>{errorMessage}</MessageBarBody>
        </MessageBar>
      ) : null}

      <div className={styles.actions}>
        <Button
          appearance="subtle"
          icon={<DismissRegular />}
          type="button"
          disabled={loading}
          onClick={handleClear}
        >
          Clear
        </Button>
        <Button
          className={styles.primaryAction}
          appearance="primary"
          icon={loading ? <Spinner size="tiny" /> : <ArrowRightRegular />}
          iconPosition="after"
          type="submit"
          disabled={loading}
        >
          {loading
            ? editingExistingJaunt
              ? "Updating Jaunt"
              : "Creating route"
            : editingExistingJaunt
              ? "Update Jaunt"
              : "Create route"}
        </Button>
      </div>

      <div className={styles.note}>
        <InfoRegular aria-hidden="true" />
        <span>Plan without signing in. Sign in only when you save.</span>
      </div>

      <Dialog
        open={incompatibleRoute != null}
        onOpenChange={(event, data) => {
          if (!data.open) {
            setIncompatibleRoute(null);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Remove incompatible detours?</DialogTitle>
            <DialogContent>
              Existing detours incompatible with new Jaunt and will be removed.
              Proceed?
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIncompatibleRoute(null)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={() =>
                  commitRoute(incompatibleRoute, { removeDetours: true })
                }
              >
                Proceed
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </form>
  );
}

RouteForm.propTypes = {
  clearAll: PropTypes.func.isRequired,
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  detourList: PropTypes.array,
  onCancel: PropTypes.func,
  onRouteReady: PropTypes.func,
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  setDestination: PropTypes.func.isRequired,
  setDetourList: PropTypes.func,
  setOrigin: PropTypes.func.isRequired,
  setRoute: PropTypes.func.isRequired,
  setTripSummary: PropTypes.func.isRequired,
};
