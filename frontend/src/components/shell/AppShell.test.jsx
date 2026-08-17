import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
            <Route path="plan" element={<div>Planner content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </FluentProvider>
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
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
});
