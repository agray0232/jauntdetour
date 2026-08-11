import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import config from "../config/config";

const UUID_SEGMENT =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi;

const ALLOWED_PROPERTIES = new Set([
  "actionOrdinal",
  "category",
  "countBucket",
  "failureClass",
  "feature",
  "mode",
  "outcome",
  "pageInstanceId",
  "pageName",
  "radiusBucket",
  "resultCountBucket",
  "source",
  "visitId",
]);

const ALLOWED_MEASUREMENTS = new Set(["activeDurationMs"]);

let client = null;
let eventContext = {};

function createEphemeralId() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function normalizeTelemetryPath(value) {
  if (!value) {
    return "/";
  }

  let pathname = value;
  try {
    pathname = new URL(value, window.location.origin).pathname;
  } catch {
    pathname = String(value).split(/[?#]/, 1)[0];
  }

  const redacted = pathname.replace(UUID_SEGMENT, "/:id");
  return redacted.replace(/^\/trips\/:id(?=\/|$)/, "/trips/:tripId");
}

export function sanitizeTelemetryProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        ALLOWED_PROPERTIES.has(key) &&
        (typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean")
    )
  );
}

export function sanitizeTelemetryMeasurements(measurements = {}) {
  return Object.fromEntries(
    Object.entries(measurements).filter(
      ([key, value]) =>
        ALLOWED_MEASUREMENTS.has(key) &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
    )
  );
}

function redactTelemetryItem(item) {
  if (item.baseData && item.baseData.uri) {
    item.baseData.uri = normalizeTelemetryPath(item.baseData.uri);
  }

  return true;
}

export function initializeTelemetry({
  connectionString = config.APPLICATIONINSIGHTS_CONNECTION_STRING,
  ApplicationInsightsClass = ApplicationInsights,
} = {}) {
  if (!connectionString || client) {
    return client;
  }

  client = new ApplicationInsightsClass({
    config: {
      connectionString,
      disableAjaxTracking: true,
      disableCookiesUsage: true,
      disableExceptionTracking: true,
      disableFetchTracking: true,
      enableAutoRouteTracking: false,
      enableUnhandledPromiseRejectionTracking: false,
      enableSessionStorageBuffer: false,
      isStorageUseDisabled: true,
    },
  });
  client.loadAppInsights();
  client.addTelemetryInitializer(redactTelemetryItem);
  return client;
}

export function trackPageView({ name, path, properties } = {}) {
  if (!client) {
    return;
  }

  const normalizedPath = normalizeTelemetryPath(path);
  client.trackPageView({
    name: name || normalizedPath,
    uri: normalizedPath,
    properties: sanitizeTelemetryProperties(properties),
  });
}

export function beginPageView({ name, path, visitId }) {
  eventContext = {
    actionOrdinal: 0,
    pageInstanceId: createEphemeralId(),
    pageName: name,
    visitId,
  };
  trackPageView({ name, path, properties: eventContext });
}

export function trackEvent(name, properties = {}, measurements = {}) {
  if (!client || !name) {
    return;
  }

  eventContext.actionOrdinal = (eventContext.actionOrdinal || 0) + 1;
  client.trackEvent({
    name,
    properties: sanitizeTelemetryProperties({
      ...eventContext,
      ...properties,
    }),
    measurements: sanitizeTelemetryMeasurements(measurements),
  });
}

export function setAuthenticatedUser(userId) {
  if (!client || !userId) {
    return;
  }

  client.setAuthenticatedUserContext(String(userId), undefined, false);
}

export function clearAuthenticatedUser() {
  if (client) {
    client.clearAuthenticatedUserContext();
  }
}

export function resetTelemetryForTests() {
  client = null;
  eventContext = {};
}

export { createEphemeralId };
