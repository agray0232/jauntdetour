import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { FluentProvider } from "@fluentui/react-components";
import { MemoryRouter } from "react-router-dom";
import AboutPage from "./AboutPage";
import HomePage from "./HomePage";
import PrivacyPage from "./PrivacyPage";
import { jauntDetourTheme } from "../design-system/jauntDetourTheme";

function renderPage(page) {
  return render(
    <FluentProvider theme={jauntDetourTheme}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        {page}
      </MemoryRouter>
    </FluentProvider>
  );
}

describe("HomePage", () => {
  it("presents the accepted value sequence without planner controls", () => {
    renderPage(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Find the stop that makes the drive.",
        level: 1,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Plan your Jaunt" })
    ).toHaveAttribute("href", "/plan");
    expect(
      screen.getByRole("img", { name: /JauntDetour planner preview/ })
    ).toBeInTheDocument();

    for (const heading of [
      "Set the route",
      "Explore the way",
      "Keep the plan",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading, level: 3 })
      ).toBeVisible();
    }

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Map" })
    ).not.toBeInTheDocument();
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderPage(<HomePage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("AboutPage", () => {
  it("describes current capabilities and explicit product boundaries", () => {
    renderPage(<AboutPage />);

    expect(
      screen.getByRole("heading", {
        name: "Make room for the unexpected.",
        level: 1,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("What it does today")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "A focused toolkit for planning the drive.",
        level: 2,
      })
    ).toBeVisible();
    expect(screen.getByText(/does not provide live navigation/i)).toBeVisible();
    expect(screen.getByText(/without signing in/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Plan your Jaunt" })
    ).toHaveAttribute("href", "/plan");
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderPage(<AboutPage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PrivacyPage", () => {
  it("describes storage-free telemetry and its data boundaries", () => {
    renderPage(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "Privacy", level: 1 })
    ).toBeVisible();
    expect(
      screen.getByText(/does not create analytics cookies/i)
    ).toBeVisible();
    expect(
      screen.getByText(/retained in Microsoft Azure for 90 days/i)
    ).toBeVisible();
    expect(screen.getByText(/route addresses, coordinates/i)).toBeVisible();
  });

  it("has no automated accessibility violations", async () => {
    const { container } = renderPage(<PrivacyPage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
