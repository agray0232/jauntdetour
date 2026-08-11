const {
  initializeBackendTelemetry,
  resetBackendTelemetryForTests,
} = require("./telemetry");

describe("initializeBackendTelemetry", () => {
  afterEach(() => resetBackendTelemetryForTests());

  test("is a no-op without a connection string", () => {
    const useAzureMonitorImpl = jest.fn();

    expect(
      initializeBackendTelemetry({ connectionString: "", useAzureMonitorImpl })
    ).toBe(false);
    expect(useAzureMonitorImpl).not.toHaveBeenCalled();
  });

  test("configures redaction hooks once", () => {
    const useAzureMonitorImpl = jest.fn();

    expect(
      initializeBackendTelemetry({
        connectionString: "InstrumentationKey=test",
        useAzureMonitorImpl,
      })
    ).toBe(true);
    expect(
      initializeBackendTelemetry({
        connectionString: "InstrumentationKey=test",
        useAzureMonitorImpl,
      })
    ).toBe(true);

    expect(useAzureMonitorImpl).toHaveBeenCalledTimes(1);
    expect(useAzureMonitorImpl).toHaveBeenCalledWith({
      azureMonitorExporterOptions: {
        connectionString: "InstrumentationKey=test",
      },
      enableLiveMetrics: false,
      instrumentationOptions: {
        http: {
          ignoreIncomingRequestHook: expect.any(Function),
          requestHook: expect.any(Function),
        },
        postgreSql: {
          addSqlCommenterCommentToQueries: false,
          enhancedDatabaseReporting: false,
          requestHook: expect.any(Function),
        },
      },
    });
  });
});
