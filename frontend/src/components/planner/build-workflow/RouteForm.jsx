import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
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
  onRouteReady,
  origin,
  setDestination,
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
      const data = await new RouteRequester().getRoute(
        trimmedOrigin,
        trimmedDestination,
        "Address",
        {}
      );
      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextRoute = data.routes && data.routes[0];
      if (!nextRoute) {
        setStatus("error");
        setErrorMessage(
          "We could not find a drive between those places. Check both locations and try again."
        );
        return;
      }

      setOrigin(trimmedOrigin);
      setDestination(trimmedDestination);
      setRoute(nextRoute);
      setTripSummary(nextRoute.summary);
      setStatus("ready");
      onRouteReady();
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
    clearAll();
  };

  return (
    <form className={styles.root} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.heading}>Where are you headed?</h3>
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
          {loading ? "Creating route" : "Create route"}
        </Button>
      </div>

      <div className={styles.note}>
        <InfoRegular aria-hidden="true" />
        <span>Plan without signing in. Sign in only when you save.</span>
      </div>
    </form>
  );
}

RouteForm.propTypes = {
  clearAll: PropTypes.func.isRequired,
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onRouteReady: PropTypes.func,
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  setDestination: PropTypes.func.isRequired,
  setOrigin: PropTypes.func.isRequired,
  setRoute: PropTypes.func.isRequired,
  setTripSummary: PropTypes.func.isRequired,
};

RouteForm.defaultProps = {
  onRouteReady: () => {},
};
