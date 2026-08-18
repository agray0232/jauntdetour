import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { jauntDetourTheme } from "../../design-system/jauntDetourTheme";
import useCompactLayout from "../../hooks/useCompactLayout";
import AppShell from "./AppShell";

jest.mock("../../hooks/useCompactLayout");
jest.mock("./AppHeader", () => () => <header>Shared header</header>);

function renderShell() {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <>
                  <Link to="/plan">Open Plan</Link>
                  <div>Home content</div>
                </>
              }
            />
            <Route
              path="plan"
              element={
                <>
                  <Link to="/">Return Home</Link>
                  <div>Planner content</div>
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </FluentProvider>
  );
}

describe("AppShell", () => {
  let originalVisualViewport;

  beforeEach(() => {
    originalVisualViewport = window.visualViewport;
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: originalVisualViewport,
    });
    jest.restoreAllMocks();
  });

  it("resets compact page scrolling when the route changes", () => {
    useCompactLayout.mockReturnValue(true);
    renderShell();
    const main = screen.getByRole("main", { name: "Page content" });
    main.scrollTop = 240;

    fireEvent.click(screen.getByRole("link", { name: "Open Plan" }));

    expect(screen.getByText("Planner content")).toBeVisible();
    expect(HTMLElement.prototype.scrollTo).toHaveBeenLastCalledWith({ top: 0 });
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
    expect(screen.getAllByText("Shared header")).toHaveLength(1);
  });

  it("leaves document scrolling unchanged on desktop", () => {
    useCompactLayout.mockReturnValue(false);
    renderShell();

    fireEvent.click(screen.getByRole("link", { name: "Open Plan" }));

    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("locks compact planner scrolling to the visual viewport and restores it", () => {
    const listeners = {};
    const viewport = {
      height: 620,
      offsetTop: 48,
      addEventListener: jest.fn((event, listener) => {
        listeners[event] = listener;
      }),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    });
    useCompactLayout.mockReturnValue(true);
    renderShell();

    fireEvent.click(screen.getByRole("link", { name: "Open Plan" }));

    const shell = screen.getByTestId("app-shell");
    const main = screen.getByRole("main", { name: "Page content" });
    expect(shell).toHaveStyle({ height: "620px", top: "48px" });
    expect(main).toHaveAttribute("data-scroll-locked", "true");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    expect(viewport.addEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );

    viewport.height = 360;
    viewport.offsetTop = 120;
    act(() => listeners.resize());
    expect(shell).toHaveStyle({ height: "360px", top: "120px" });

    fireEvent.click(screen.getByRole("link", { name: "Return Home" }));
    expect(shell).not.toHaveStyle({ height: "360px", top: "120px" });
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
    expect(viewport.removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });
});
