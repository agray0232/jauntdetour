import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppShell from "./components/shell/AppShell";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import PlannerPage from "./pages/PlannerPage";
import RoutePlaceholderPage from "./pages/RoutePlaceholderPage";
import "./styles/App.css";
import "./styles/TripTimeline.css";

const DesignSystemCatalog =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./design-system/DesignSystemCatalog"))
    : null;

function App() {
  const showDesignSystemCatalog =
    process.env.NODE_ENV !== "production" &&
    new URLSearchParams(window.location.search).has("design-system");

  if (showDesignSystemCatalog && DesignSystemCatalog) {
    return (
      <Suspense fallback={<main>Loading design system...</main>}>
        <DesignSystemCatalog />
      </Suspense>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="plan" element={<PlannerPage />} />
        <Route
          path="trips"
          element={
            <ProtectedRoute title="My Jaunts">
              <RoutePlaceholderPage title="My Jaunts">
                Your routed saved-Jaunt library will replace the existing
                planner drawer after Build and Discover reach feature parity.
              </RoutePlaceholderPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="trips/:tripId"
          element={
            <ProtectedRoute title="this Jaunt">
              <RoutePlaceholderPage title="Jaunt detail">
                Saved route details and Resume Planning will be implemented with
                the routed My Jaunts experience.
              </RoutePlaceholderPage>
            </ProtectedRoute>
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route
          path="account"
          element={
            <ProtectedRoute title="your account">
              <RoutePlaceholderPage title="Account info">
                Account identity and sign-out controls are managed through your
                Microsoft sign-in.
              </RoutePlaceholderPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <RoutePlaceholderPage
              actionLabel="Return home"
              actionTo="/"
              title="Page not found"
            >
              This destination does not exist or may have moved.
            </RoutePlaceholderPage>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
