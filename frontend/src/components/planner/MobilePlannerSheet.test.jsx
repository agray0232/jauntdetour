import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";
import MobilePlannerSheet from "./MobilePlannerSheet";
import {
  calculateViewportBounds,
  subscribeToViewport,
} from "./mobileViewportGeometry";

function renderSheet() {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <div
        data-testid="planner"
        style={{ height: "840px", position: "relative" }}
      >
        <MobilePlannerSheet active>
          <div>Planning content</div>
        </MobilePlannerSheet>
      </div>
    </FluentProvider>
  );
}

describe("MobilePlannerSheet", () => {
  let originalInnerHeight;
  let originalVisualViewport;

  beforeEach(() => {
    originalInnerHeight = window.innerHeight;
    originalVisualViewport = window.visualViewport;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 840,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it("starts at the balanced magnetic position", () => {
    renderSheet();

    const handle = screen.getByRole("slider", {
      name: "Resize planning tools",
    });
    expect(handle).toHaveAttribute("aria-valuetext", "mid position");
    expect(handle).toHaveAttribute("aria-valuenow", "41");
  });

  it("cycles between magnetic positions on tap", () => {
    renderSheet();
    const handle = screen.getByRole("slider", {
      name: "Resize planning tools",
    });

    fireEvent.click(handle);
    expect(handle).toHaveAttribute("aria-valuetext", "expanded position");
    expect(handle).toHaveAttribute("aria-valuenow", "100");
    fireEvent.click(handle);
    expect(handle).toHaveAttribute("aria-valuetext", "mid position");
  });

  it("supports keyboard movement between magnetic positions", () => {
    renderSheet();
    const handle = screen.getByRole("slider", {
      name: "Resize planning tools",
    });

    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle).toHaveAttribute("aria-valuetext", "peek position");
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(handle).toHaveAttribute("aria-valuetext", "mid position");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuetext", "expanded position");
  });

  it("expands low-position tools when a form field receives focus", () => {
    render(
      <FluentProvider theme={jauntDetourTheme}>
        <div style={{ height: "840px", position: "relative" }}>
          <MobilePlannerSheet active>
            <input aria-label="Route origin" />
          </MobilePlannerSheet>
        </div>
      </FluentProvider>
    );
    const handle = screen.getByRole("slider", {
      name: "Resize planning tools",
    });

    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle).toHaveAttribute("aria-valuetext", "peek position");
    fireEvent.focus(screen.getByRole("textbox", { name: "Route origin" }));
    expect(handle).toHaveAttribute("aria-valuetext", "expanded position");
  });

  it("preserves child state when toggling across the compact breakpoint", () => {
    function StatefulChild() {
      const [value, setValue] = React.useState("");
      return (
        <input
          aria-label="Route origin"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      );
    }

    const tree = (activeSheet) => (
      <FluentProvider theme={jauntDetourTheme}>
        <div style={{ height: "840px", position: "relative" }}>
          <MobilePlannerSheet active={activeSheet}>
            <StatefulChild />
          </MobilePlannerSheet>
        </div>
      </FluentProvider>
    );

    const { rerender } = render(tree(true));
    const input = screen.getByRole("textbox", { name: "Route origin" });
    fireEvent.change(input, { target: { value: "Atlanta" } });
    expect(input).toHaveValue("Atlanta");

    rerender(tree(false));
    expect(screen.getByRole("textbox", { name: "Route origin" })).toHaveValue(
      "Atlanta"
    );
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();

    rerender(tree(true));
    expect(screen.getByRole("textbox", { name: "Route origin" })).toHaveValue(
      "Atlanta"
    );
  });

  it("calculates planner-local bounds above the virtual keyboard", () => {
    expect(
      calculateViewportBounds({
        fallbackHeight: 840,
        parentHeight: 740,
        parentTop: 100,
        viewport: { height: 400, offsetTop: 180 },
      })
    ).toEqual({ bottomInset: 260, height: 400, top: 80 });

    expect(
      calculateViewportBounds({
        fallbackHeight: 840,
        parentHeight: 740,
        parentTop: 100,
        viewport: { height: 300, offsetTop: 220 },
      })
    ).toEqual({ bottomInset: 320, height: 300, top: 120 });
  });

  it("subscribes to viewport changes and cleans up listeners", () => {
    const viewport = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const listener = jest.fn();
    const unsubscribe = subscribeToViewport(viewport, listener);

    expect(viewport.addEventListener).toHaveBeenCalledWith("resize", listener);
    expect(viewport.addEventListener).toHaveBeenCalledWith("scroll", listener);

    unsubscribe();
    expect(viewport.removeEventListener).toHaveBeenCalledWith(
      "resize",
      listener
    );
    expect(viewport.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      listener
    );
  });
});
