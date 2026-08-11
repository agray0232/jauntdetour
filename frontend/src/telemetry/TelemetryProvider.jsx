import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  beginPageView,
  clearAuthenticatedUser,
  createEphemeralId,
  initializeTelemetry,
  normalizeTelemetryPath,
  setAuthenticatedUser,
  trackEvent,
} from "./telemetry";
import { createEngagementTracker } from "./engagement";

const PAGE_NAMES = {
  "/": "Home",
  "/about": "About",
  "/account": "Account",
  "/plan": "Planner",
  "/privacy": "Privacy",
  "/trips": "My Jaunts",
  "/trips/:tripId": "Jaunt detail",
};

export default function TelemetryProvider({ children }) {
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const visitIdRef = useRef(createEphemeralId());

  useEffect(() => {
    initializeTelemetry();
  }, []);

  useEffect(() => {
    const path = normalizeTelemetryPath(location.pathname);
    beginPageView({
      name: PAGE_NAMES[path] || "Not found",
      path,
      visitId: visitIdRef.current,
    });
  }, [location.pathname]);

  useEffect(() => {
    const tracker = createEngagementTracker({
      isVisible: () => document.visibilityState === "visible",
      now: () => performance.now(),
      onComplete: (activeDurationMs) =>
        trackEvent(
          "page_engagement",
          { feature: "engagement" },
          { activeDurationMs }
        ),
    });
    const handleVisibilityChange = () => tracker.visibilityChanged();
    const handlePageHide = () => tracker.complete();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      tracker.complete();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (user && user.user_id) {
      setAuthenticatedUser(user.user_id);
    } else {
      clearAuthenticatedUser();
    }
  }, [user]);

  return <React.Fragment>{children}</React.Fragment>;
}

TelemetryProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
