import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";
import MobilePlannerSheet from "./MobilePlannerSheet";

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

  beforeEach(() => {
    originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 840,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it("starts at the balanced magnetic position", () => {
    renderSheet();

    const handle = screen.getByRole("slider", {
      name: "Resize planning tools",
    });
    expect(handle).toHaveAttribute("aria-valuetext", "mid position");
    expect(handle).toHaveAttribute("aria-valuenow", "38");
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
});
