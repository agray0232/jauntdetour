const { useAzureMonitor } = require("@azure/monitor-opentelemetry");
const {
  sanitizeHttpSpan,
  sanitizePostgresSpan,
} = require("../app/utils/telemetrySanitizer");

let initialized = false;

function initializeBackendTelemetry({
  connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  useAzureMonitorImpl = useAzureMonitor,
} = {}) {
  if (!connectionString || initialized) {
    return initialized;
  }

  useAzureMonitorImpl({
    azureMonitorExporterOptions: { connectionString },
    enableLiveMetrics: false,
    instrumentationOptions: {
      http: {
        ignoreIncomingRequestHook: (request) =>
          sanitizeUrlPath(request && request.url) === "/test",
        requestHook: sanitizeHttpSpan,
      },
      postgreSql: {
        addSqlCommenterCommentToQueries: false,
        enhancedDatabaseReporting: false,
        requestHook: sanitizePostgresSpan,
      },
    },
  });
  initialized = true;
  return true;
}

function sanitizeUrlPath(value) {
  return String(value || "/").split(/[?#]/, 1)[0];
}

function resetBackendTelemetryForTests() {
  initialized = false;
}

module.exports = {
  initializeBackendTelemetry,
  resetBackendTelemetryForTests,
};
