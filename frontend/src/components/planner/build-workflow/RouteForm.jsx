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
import PlaceAutocompleteField from "./PlaceAutocompleteField";
import { jauntSpacing, jauntTypography } from "../../../design-system/tokens";
import { trackEvent } from "../../../telemetry/telemetry";

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

function formatLocationLabel(value) {
  return (value || "").replace(/,?\s+USA$/i, "");
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
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [keepExistingDetours, setKeepExistingDetours] = useState(true);
  const [incompatibleRoute, setIncompatibleRoute] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setOriginValue(normalizeEndpoint(origin));
    setSelectedOrigin(null);
  }, [origin]);

  useEffect(() => {
    setDestinationValue(normalizeEndpoint(destination));
    setSelectedDestination(null);
  }, [destination]);

  const trimmedOrigin = originValue.trim();
  const trimmedDestination = destinationValue.trim();
  const originInvalid = submitted && !trimmedOrigin;
  const destinationInvalid = submitted && !trimmedDestination;
  const loading = status === "loading";
  const editingExistingJaunt = onCancel != null;
  const hasExistingDetours = editingExistingJaunt && detourList.length > 0;

  const commitRoute = (
    nextRoute,
    {
      fallbackOrigin = trimmedOrigin,
      fallbackDestination = trimmedDestination,
      selectedOriginLabel = null,
      selectedDestinationLabel = null,
      removeDetours = false,
    } = {}
  ) => {
    const legs = nextRoute.legs || [];
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    const resolvedOrigin = formatLocationLabel(
      selectedOriginLabel || firstLeg?.start_address || fallbackOrigin
    );
    const resolvedDestination = formatLocationLabel(
      selectedDestinationLabel || lastLeg?.end_address || fallbackDestination
    );

    setOriginValue(resolvedOrigin);
    setDestinationValue(resolvedDestination);
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setOrigin(resolvedOrigin);
    setDestination(resolvedDestination);
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
    trackEvent("route_search_succeeded", { feature: "route" });
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
    const submittedOrigin = trimmedOrigin;
    const submittedDestination = trimmedDestination;
    const selectedOriginLabel = selectedOrigin?.text || null;
    const selectedDestinationLabel = selectedDestination?.text || null;
    const routeOrigin = selectedOrigin
      ? `place_id:${selectedOrigin.placeId}`
      : submittedOrigin;
    const routeDestination = selectedDestination
      ? `place_id:${selectedDestination.placeId}`
      : submittedDestination;
    setStatus("loading");
    trackEvent("route_search_started", { feature: "route" });

    try {
      const requester = new RouteRequester();
      const waypointIds = detourList
        .map((detour) => detour.placeId)
        .filter(Boolean);
      const preserveDetours =
        hasExistingDetours && keepExistingDetours && waypointIds.length > 0;
      const data = await requester.getRoute(
        routeOrigin,
        routeDestination,
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
            routeOrigin,
            routeDestination,
            "Address",
            {}
          );
          if (requestId !== requestIdRef.current) {
            return;
          }
          nextRoute = directData.routes && directData.routes[0];
          if (nextRoute) {
            setStatus("idle");
            setIncompatibleRoute({
              route: nextRoute,
              fallbackOrigin: submittedOrigin,
              fallbackDestination: submittedDestination,
              selectedOriginLabel,
              selectedDestinationLabel,
            });
            return;
          }
        }
        setStatus("error");
        trackEvent("route_search_failed", {
          failureClass: "no_route",
          feature: "route",
        });
        setErrorMessage(
          "We could not find a drive between those places. Check both locations and try again."
        );
        return;
      }

      commitRoute(nextRoute, {
        fallbackOrigin: submittedOrigin,
        fallbackDestination: submittedDestination,
        selectedOriginLabel,
        selectedDestinationLabel,
        removeDetours: hasExistingDetours && !keepExistingDetours,
      });
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStatus("error");
      trackEvent("route_search_failed", {
        failureClass: "request_failed",
        feature: "route",
      });
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
    setSelectedOrigin(null);
    setSelectedDestination(null);
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
        <PlaceAutocompleteField
          disabled={loading}
          icon={<NavigationRegular />}
          invalid={originInvalid}
          label="Start"
          placeholder="Enter a starting point"
          selectedPlace={selectedOrigin}
          validationMessage="Enter a starting point."
          value={originValue}
          onValueChange={(value) => {
            setOriginValue(value);
            setSelectedOrigin(null);
          }}
          onSelect={(place) => {
            setOriginValue(place.text);
            setSelectedOrigin(place);
          }}
        />
        <PlaceAutocompleteField
          disabled={loading}
          icon={<LocationRegular />}
          invalid={destinationInvalid}
          label="Destination"
          placeholder="Where are you going?"
          selectedPlace={selectedDestination}
          validationMessage="Enter a destination."
          value={destinationValue}
          onValueChange={(value) => {
            setDestinationValue(value);
            setSelectedDestination(null);
          }}
          onSelect={(place) => {
            setDestinationValue(place.text);
            setSelectedDestination(place);
          }}
        />
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
        open={incompatibleRoute !== null}
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
                  commitRoute(incompatibleRoute.route, {
                    fallbackOrigin: incompatibleRoute.fallbackOrigin,
                    fallbackDestination: incompatibleRoute.fallbackDestination,
                    selectedOriginLabel: incompatibleRoute.selectedOriginLabel,
                    selectedDestinationLabel:
                      incompatibleRoute.selectedDestinationLabel,
                    removeDetours: true,
                  })
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
