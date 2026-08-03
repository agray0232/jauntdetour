import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppShell from "./components/shell/AppShell";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import JauntDetailPage from "./pages/JauntDetailPage";
import MyJauntsPage from "./pages/MyJauntsPage";
import PlannerPage from "./pages/PlannerPage";
import PrivacyPage from "./pages/PrivacyPage";
import RoutePlaceholderPage from "./pages/RoutePlaceholderPage";

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
              <MyJauntsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="trips/:tripId"
          element={
            <ProtectedRoute title="this Jaunt">
              <JauntDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route
          path="account"
          element={
            <ProtectedRoute title="your account">
              <AccountPage />
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
