import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { FluentProvider } from "@fluentui/react-components";
import RouteForm from "./RouteForm";
import RouteRequester from "../../../scripts/RouteRequester";
import { jauntDetourTheme } from "../../../design-system/jauntDetourTheme";

jest.mock("../../../scripts/RouteRequester");

function createProps(overrides = {}) {
  return {
    origin: "",
    destination: "",
    setOrigin: jest.fn(),
    setDestination: jest.fn(),
    setRoute: jest.fn(),
    setTripSummary: jest.fn(),
    onRouteReady: jest.fn(),
    clearAll: jest.fn(),
    ...overrides,
  };
}

function renderForm(props) {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <RouteForm {...props} />
    </FluentProvider>
  );
}

describe("RouteForm", () => {
  beforeEach(() => {
    RouteRequester.mockReset();
  });

  it("associates required validation with both route fields", () => {
    const props = createProps();
    renderForm(props);

    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    expect(screen.getByText("Enter a starting point.")).toBeVisible();
    expect(screen.getByText("Enter a destination.")).toBeVisible();
    expect(props.setRoute).not.toHaveBeenCalled();
  });

  it("commits normalized endpoints only after a route succeeds", async () => {
    const route = { summary: { distance: 245, time: { hours: 3, min: 47 } } };
    const getRoute = jest.fn().mockResolvedValue({ routes: [route] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps();
    renderForm(props);

    fireEvent.change(screen.getByRole("textbox", { name: "Start" }), {
      target: { value: "  Atlanta, GA  " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Destination" }), {
      target: { value: "  Charlotte, NC  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    expect(
      screen.getByRole("button", { name: "Creating route" })
    ).toBeDisabled();
    await waitFor(() => expect(props.setRoute).toHaveBeenCalledWith(route));
    expect(getRoute).toHaveBeenCalledWith(
      "Atlanta, GA",
      "Charlotte, NC",
      "Address",
      {}
    );
    expect(props.setOrigin).toHaveBeenCalledWith("Atlanta, GA");
    expect(props.setDestination).toHaveBeenCalledWith("Charlotte, NC");
    expect(props.setTripSummary).toHaveBeenCalledWith(route.summary);
    expect(props.onRouteReady).toHaveBeenCalledTimes(1);
  });

  it("retains the prior route when a request fails and supports retry", async () => {
    const getRoute = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        routes: [{ summary: { distance: 10, time: { hours: 0, min: 20 } } }],
      });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({ origin: "Atlanta", destination: "Charlotte" });
    renderForm(props);

    fireEvent.click(screen.getByRole("button", { name: "Create route" }));
    expect(
      await screen.findByText(/route could not be created/i)
    ).toBeVisible();
    expect(props.setRoute).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Create route" }));
    await waitFor(() => expect(props.setRoute).toHaveBeenCalledTimes(1));
    expect(getRoute).toHaveBeenCalledTimes(2);
  });

  it("reports a no-route response without committing endpoints", async () => {
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({ routes: [] }),
    }));
    const props = createProps({ origin: "Atlanta", destination: "Nowhere" });
    renderForm(props);

    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    expect(await screen.findByText(/could not find a drive/i)).toBeVisible();
    expect(props.setOrigin).not.toHaveBeenCalled();
    expect(props.setRoute).not.toHaveBeenCalled();
  });

  it("clears local values and Redux planning state", () => {
    const props = createProps({ origin: "Atlanta", destination: "Charlotte" });
    renderForm(props);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByRole("textbox", { name: "Start" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Destination" })).toHaveValue(
      ""
    );
    expect(props.clearAll).toHaveBeenCalledTimes(1);
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderForm(createProps());

    expect(await axe(container)).toHaveNoViolations();
  });
});
