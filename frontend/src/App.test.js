import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { FluentProvider } from "@fluentui/react-components";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthSessionProvider } from "./auth/AuthSessionProvider";
import { jauntDetourTheme } from "./design-system/jauntDetourTheme";
import mainReducer from "./reducers/main-reducer";
import AuthRequester from "./scripts/AuthRequester";

jest.mock(
  "./containers/MainContainer",
  () =>
    function MockPlanner() {
      return <div>Current planner</div>;
    }
);

jest.mock("./scripts/AuthRequester");

function renderApp(route, currentUser = null) {
  const getCurrentUser = jest.fn().mockResolvedValue(currentUser);
  const login = jest.fn();
  const logout = jest.fn().mockResolvedValue();
  AuthRequester.mockImplementation(() => ({ getCurrentUser, login, logout }));

  render(
    <Provider store={createStore(mainReducer)}>
      <FluentProvider theme={jauntDetourTheme}>
        <MemoryRouter
          future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
          initialEntries={[route]}
        >
          <AuthSessionProvider>
            <App />
          </AuthSessionProvider>
        </MemoryRouter>
      </FluentProvider>
    </Provider>
  );

  return { getCurrentUser, login, logout };
}

describe("application routes", () => {
  beforeEach(() => {
    AuthRequester.mockReset();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders the public Home experience and planner entry", async () => {
    renderApp("/");

    expect(
      screen.getByRole("heading", {
        name: "Find the stop that makes the drive.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Plan your Jaunt" })
    ).toHaveAttribute("href", "/plan");
    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(primaryNavigation).queryByRole("link", { name: "Privacy" })
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole("navigation", { name: "Footer navigation" })
      ).getByRole("link", { name: "Privacy" })
    ).toHaveAttribute("href", "/privacy");
    expect(
      await screen.findByRole("button", { name: "Sign in" })
    ).toBeVisible();
  });

  it("mounts the current planner only at /plan", async () => {
    renderApp("/plan");

    expect(screen.getByText("Current planner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan a Jaunt" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      await screen.findByRole("button", { name: "Sign in" })
    ).toBeVisible();
  });

  it("gates My Jaunts and preserves its requested destination", async () => {
    const { login } = renderApp("/trips");

    expect(
      await screen.findByRole("heading", { name: "Sign in to view My Jaunts" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]);
    expect(login).toHaveBeenCalledWith("/trips");
  });

  it("renders a protected account destination for a signed-in user", async () => {
    const { logout } = renderApp("/account", {
      email: "traveler@example.com",
      display_name: "Avery Traveler",
    });

    expect(
      await screen.findByRole("heading", { name: "Account info" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
    const identitySummary = screen.getByRole("region", {
      name: "Account identity summary",
    });
    expect(within(identitySummary).getByText("Avery Traveler")).toBeVisible();
    expect(
      within(identitySummary).getByText("traveler@example.com")
    ).toBeVisible();
    expect(
      screen.getByText(
        "Your display name and email are managed by your sign-in account."
      )
    ).toBeVisible();
    expect(screen.queryByText(/Microsoft Entra/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View My Jaunts/ })
    ).toHaveAttribute("href", "/trips");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("preserves sign out through the shared account menu", async () => {
    const { logout } = renderApp("/", {
      email: "traveler@example.com",
      display_name: "Avery Traveler",
    });

    const accountTrigger = await screen.findByRole("button", {
      name: "Account menu",
    });
    fireEvent.click(accountTrigger);
    expect(screen.getByText("traveler@example.com")).toBeVisible();
    expect(
      screen.getByRole("menuitem", { name: "View profile" })
    ).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "My Jaunts" })).toBeVisible();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("restores focus when the account menu is dismissed with Escape", async () => {
    renderApp("/", {
      email: "traveler@example.com",
      display_name: "Avery Traveler",
    });
    const accountTrigger = await screen.findByRole("button", {
      name: "Account menu",
    });
    fireEvent.click(accountTrigger);

    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    );
    expect(accountTrigger).toHaveFocus();
  });

  it("restores a safe protected destination after authentication", async () => {
    sessionStorage.setItem("jaunt.authReturnPath", "/account");
    renderApp("/", {
      email: "traveler@example.com",
      display_name: "Avery Traveler",
    });

    expect(
      await screen.findByRole("heading", { name: "Account info" })
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("jaunt.authReturnPath")).toBeNull();
  });

  it("resolves auth once while navigating between public routes", async () => {
    const { getCurrentUser } = renderApp("/");

    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(1));
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Primary navigation" })
      ).getByRole("link", { name: "About" })
    );
    expect(
      await screen.findByRole("heading", {
        name: "Make room for the unexpected.",
      })
    ).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("renders a useful not-found destination", async () => {
    renderApp("/missing-page");

    expect(
      screen.getByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(
      await screen.findByRole("button", { name: "Sign in" })
    ).toBeVisible();
  });
});
