import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { axe } from "jest-axe";
import { FluentProvider } from "@fluentui/react-components";
import RouteForm from "./RouteForm";
import RouteRequester from "../../../scripts/RouteRequester";
import { jauntDetourTheme } from "../../../design-system/jauntDetourTheme";
import { trackEvent } from "../../../telemetry/telemetry";

jest.mock("../../../scripts/RouteRequester");
jest.mock("../../../telemetry/telemetry", () => ({ trackEvent: jest.fn() }));
jest.mock("./PlaceAutocompleteField", () => {
  const React = require("react");

  return function MockPlaceAutocompleteField({
    invalid,
    label,
    onSelect,
    onValueChange,
    validationMessage,
    value,
  }) {
    return React.createElement(
      "div",
      null,
      React.createElement("label", null, label),
      React.createElement("input", {
        "aria-label": label,
        value,
        onChange: (event) => onValueChange(event.target.value),
      }),
      value === "Ashland"
        ? React.createElement(
            "button",
            {
              type: "button",
              onClick: () =>
                onSelect({
                  placeId: `place-${label.toLowerCase()}`,
                  text: `Ashland ${label}`,
                }),
            },
            `Select ${label} suggestion`
          )
        : null,
      invalid ? React.createElement("span", null, validationMessage) : null
    );
  };
});

function createProps(overrides = {}) {
  return {
    origin: "",
    destination: "",
    detourList: [],
    setOrigin: jest.fn(),
    setDestination: jest.fn(),
    setDetourList: jest.fn(),
    setRoute: jest.fn(),
    setTripSummary: jest.fn(),
    onCancel: null,
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
    trackEvent.mockReset();
  });

  it("associates required validation with both route fields", () => {
    const props = createProps();
    renderForm(props);

    expect(
      screen.getByRole("heading", { name: "Where are you headed?" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
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
    expect(trackEvent).toHaveBeenNthCalledWith(1, "route_search_started", {
      feature: "route",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "route_search_succeeded", {
      feature: "route",
    });
  });

  it("routes selected suggestions by place ID", async () => {
    const route = {
      summary: {},
      legs: [
        {
          start_address: "1 Stadium Drive, Ashland, OH, USA",
          end_address: "99 Main Street, Ashland, KY, USA",
        },
      ],
    };
    const getRoute = jest.fn().mockResolvedValue({ routes: [route] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps();
    renderForm(props);

    fireEvent.change(screen.getByRole("textbox", { name: "Start" }), {
      target: { value: "Ashland" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select Start suggestion" })
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Destination" }), {
      target: { value: "Ashland" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select Destination suggestion" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    await waitFor(() => expect(props.setRoute).toHaveBeenCalledWith(route));
    expect(getRoute).toHaveBeenCalledWith(
      "place_id:place-start",
      "place_id:place-destination",
      "Address",
      {}
    );
    expect(props.setOrigin).toHaveBeenCalledWith("Ashland Start");
    expect(props.setDestination).toHaveBeenCalledWith("Ashland Destination");
  });

  it("falls back to edited free text after a suggestion was selected", async () => {
    const route = { summary: {}, legs: [] };
    const getRoute = jest.fn().mockResolvedValue({ routes: [route] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    renderForm(createProps({ destination: "Charlotte" }));

    const start = screen.getByRole("textbox", { name: "Start" });
    fireEvent.change(start, { target: { value: "Ashland" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Select Start suggestion" })
    );
    fireEvent.change(start, { target: { value: "Ashland custom" } });
    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    await waitFor(() => expect(getRoute).toHaveBeenCalled());
    expect(getRoute).toHaveBeenCalledWith(
      "Ashland custom",
      "Charlotte",
      "Address",
      {}
    );
  });

  it("preserves a selected place while resolving a free-text endpoint", async () => {
    const route = {
      summary: {},
      legs: [
        {
          start_address: "1 AMB Drive Northwest, Atlanta, GA, USA",
          end_address: "Athens, GA, USA",
        },
      ],
    };
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({ routes: [route] }),
    }));
    const props = createProps();
    renderForm(props);

    fireEvent.change(screen.getByRole("textbox", { name: "Start" }), {
      target: { value: "Ashland" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Select Start suggestion" })
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Destination" }), {
      target: { value: "athens georgiaa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    await waitFor(() =>
      expect(props.setOrigin).toHaveBeenCalledWith("Ashland Start")
    );
    expect(props.setDestination).toHaveBeenCalledWith("Athens, GA");
  });

  it("replaces free text with the locations resolved by Google", async () => {
    const route = {
      summary: { distance: 120, time: { hours: 2, min: 5 } },
      legs: [
        {
          start_address: "Ashland, OH 44805, USA",
          end_address: "Lexington, KY, USA",
        },
      ],
    };
    RouteRequester.mockImplementation(() => ({
      getRoute: jest.fn().mockResolvedValue({ routes: [route] }),
    }));
    const props = createProps();
    renderForm(props);

    fireEvent.change(screen.getByRole("textbox", { name: "Start" }), {
      target: { value: "Ashland ohioo" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Destination" }), {
      target: { value: "Lexington" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create route" }));

    await waitFor(() =>
      expect(props.setOrigin).toHaveBeenCalledWith("Ashland, OH 44805")
    );
    expect(props.setDestination).toHaveBeenCalledWith("Lexington, KY");
    expect(screen.getByRole("textbox", { name: "Start" })).toHaveValue(
      "Ashland, OH 44805"
    );
    expect(screen.getByRole("textbox", { name: "Destination" })).toHaveValue(
      "Lexington, KY"
    );
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
    expect(trackEvent).toHaveBeenLastCalledWith("route_search_failed", {
      failureClass: "request_failed",
      feature: "route",
    });

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
    expect(trackEvent).toHaveBeenLastCalledWith("route_search_failed", {
      failureClass: "no_route",
      feature: "route",
    });
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

  it("cancels route editing without changing the existing plan", () => {
    const onCancel = jest.fn();
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      onCancel,
    });
    renderForm(props);

    expect(screen.getByRole("heading", { name: "Edit Jaunt" })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Destination" }), {
      target: { value: "Savannah" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(props.clearAll).not.toHaveBeenCalled();
    expect(props.setDestination).not.toHaveBeenCalled();
    expect(props.setRoute).not.toHaveBeenCalled();
  });

  it("keeps existing detours by default when updating a Jaunt", async () => {
    const route = { summary: { distance: 260, time: { hours: 4, min: 10 } } };
    const getRoute = jest.fn().mockResolvedValue({ routes: [route] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      detourList: [
        { name: "Paris Mountain", placeId: "place-1", addedTime: 18 },
      ],
      onCancel: jest.fn(),
    });
    renderForm(props);

    expect(
      screen.getByRole("checkbox", { name: "Keep existing detours" })
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Update Jaunt" }));

    await waitFor(() => expect(props.setRoute).toHaveBeenCalledWith(route));
    expect(getRoute).toHaveBeenCalledWith("Atlanta", "Charlotte", "Address", {
      waypoints: ["place-1"],
    });
    expect(props.setDetourList).toHaveBeenCalledWith([
      expect.objectContaining({ placeId: "place-1", addedTime: -1 }),
    ]);
  });

  it("removes existing detours when preservation is unchecked", async () => {
    const route = { summary: { distance: 250, time: { hours: 4, min: 0 } } };
    const getRoute = jest.fn().mockResolvedValue({ routes: [route] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      detourList: [{ name: "Paris Mountain", placeId: "place-1" }],
      onCancel: jest.fn(),
    });
    renderForm(props);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Keep existing detours" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Update Jaunt" }));

    await waitFor(() => expect(props.setRoute).toHaveBeenCalledWith(route));
    expect(getRoute).toHaveBeenCalledWith(
      "Atlanta",
      "Charlotte",
      "Address",
      {}
    );
    expect(props.setDetourList).toHaveBeenCalledWith([]);
  });

  it("confirms before removing detours incompatible with the new Jaunt", async () => {
    const directRoute = {
      summary: { distance: 400, time: { hours: 6, min: 0 } },
    };
    const getRoute = jest
      .fn()
      .mockResolvedValueOnce({ routes: [] })
      .mockResolvedValueOnce({ routes: [directRoute] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      detourList: [{ name: "Paris Mountain", placeId: "place-1" }],
      onCancel: jest.fn(),
    });
    renderForm(props);

    fireEvent.change(screen.getByRole("textbox", { name: "Destination" }), {
      target: { value: "Edinburgh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Jaunt" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Remove incompatible detours?",
    });
    expect(dialog).toHaveTextContent(
      "Existing detours incompatible with new Jaunt and will be removed. Proceed?"
    );
    expect(props.setRoute).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Proceed" }));
    expect(props.setRoute).toHaveBeenCalledWith(directRoute);
    expect(props.setDetourList).toHaveBeenCalledWith([]);
    expect(props.onRouteReady).toHaveBeenCalledTimes(1);
  });

  it("keeps the existing Jaunt when incompatibility confirmation is canceled", async () => {
    const getRoute = jest
      .fn()
      .mockResolvedValueOnce({ routes: [] })
      .mockResolvedValueOnce({ routes: [{ summary: {} }] });
    RouteRequester.mockImplementation(() => ({ getRoute }));
    const props = createProps({
      origin: "Atlanta",
      destination: "Charlotte",
      detourList: [{ name: "Paris Mountain", placeId: "place-1" }],
      onCancel: jest.fn(),
    });
    renderForm(props);

    fireEvent.click(screen.getByRole("button", { name: "Update Jaunt" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Remove incompatible detours?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(props.setRoute).not.toHaveBeenCalled();
    expect(props.setDetourList).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderForm(createProps());

    expect(await axe(container)).toHaveNoViolations();
  });
});
