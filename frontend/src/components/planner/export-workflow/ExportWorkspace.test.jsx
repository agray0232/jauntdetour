import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { FluentProvider } from "@fluentui/react-components";
import ExportWorkspace from "./ExportWorkspace";
import { exportToGoogleMaps } from "../../../utils/googleMapsExport";
import { jauntDetourTheme } from "../../../design-system/jauntDetourTheme";
import { trackEvent } from "../../../telemetry/telemetry";

jest.mock("../../../utils/googleMapsExport");
jest.mock("../../../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));

describe("ExportWorkspace", () => {
  beforeEach(() => {
    exportToGoogleMaps.mockReset();
    trackEvent.mockReset();
  });

  it("summarizes the current Jaunt and opens it in Google Maps", () => {
    const detourList = [
      { name: "Paris Mountain", lat: 34.9, lng: -82.4, placeId: "one" },
    ];
    render(
      <FluentProvider theme={jauntDetourTheme}>
        <ExportWorkspace
          origin="Atlanta"
          destination="Charlotte"
          detourList={detourList}
        />
      </FluentProvider>
    );

    expect(
      screen.getByRole("heading", { name: "Take your Jaunt with you" })
    ).toBeVisible();
    expect(screen.getByLabelText("Route to export")).toHaveTextContent(
      "Atlanta"
    );
    expect(screen.getByLabelText("Route to export")).toHaveTextContent(
      "Charlotte"
    );
    expect(screen.getByText("1 detour")).toBeVisible();
    expect(
      within(screen.getByLabelText("Route to export")).getByTestId(
        "route-detour-count"
      )
    ).toHaveTextContent("1 detour");
    expect(
      screen.getByRole("article", { name: "Google Maps" })
    ).not.toHaveTextContent("1 detour");

    fireEvent.click(
      screen.getByRole("button", { name: "Open in Google Maps" })
    );
    expect(exportToGoogleMaps).toHaveBeenCalledWith(
      "Atlanta",
      "Charlotte",
      detourList
    );
    expect(trackEvent).toHaveBeenCalledWith("trip_export_opened", {
      countBucket: "1-5",
      feature: "export",
      source: "planner",
    });
  });

  it("has no automated accessibility violations", async () => {
    const { container } = render(
      <FluentProvider theme={jauntDetourTheme}>
        <ExportWorkspace
          origin="Atlanta"
          destination="Charlotte"
          detourList={[]}
        />
      </FluentProvider>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
