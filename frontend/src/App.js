import React, { lazy, Suspense } from "react";
import MainContainer from "./containers/MainContainer";
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
    <div>
      <MainContainer />
    </div>
  );
}

export default App;
