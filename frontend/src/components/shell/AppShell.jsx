import React, { useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import { jauntColors, jauntSpacing } from "../../design-system/tokens";
import useCompactLayout from "../../hooks/useCompactLayout";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: "100vh",
    height: "100dvh",
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (max-width: 48.75rem), (max-height: 31.25rem) and (orientation: landscape)":
      {
        minHeight: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
      },
  },
  plannerFrame: {
    position: "fixed",
    right: 0,
    top: 0,
    left: 0,
    minHeight: 0,
    overflow: "hidden",
  },
  skipLink: {
    position: "fixed",
    top: jauntSpacing[2],
    left: jauntSpacing[2],
    zIndex: 3000,
    padding: `${jauntSpacing[2]} ${jauntSpacing[3]}`,
    color: jauntColors.neutral.foreground,
    backgroundColor: jauntColors.brand.highlight,
    transform: "translateY(-200%)",
    ":focus": {
      transform: "translateY(0)",
    },
  },
  main: {
    minWidth: 0,
    minHeight: 0,
    "@media (max-width: 48.75rem), (max-height: 31.25rem) and (orientation: landscape)":
      {
        overflowX: "hidden",
        overflowY: "auto",
        overscrollBehaviorY: "contain",
      },
  },
  plannerMain: {
    overflow: "hidden",
    overscrollBehavior: "none",
  },
});

const getWindowVisualViewport = () => window.visualViewport;

export default function AppShell({
  getVisualViewport = getWindowVisualViewport,
}) {
  const styles = useStyles();
  const compactLayout = useCompactLayout();
  const location = useLocation();
  const mainRef = useRef(null);
  const [plannerViewport, setPlannerViewport] = useState(null);
  const plannerFrameActive = compactLayout && location.pathname === "/plan";

  useLayoutEffect(() => {
    if (!compactLayout) return;
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo(0, 0);
  }, [compactLayout, location.key, location.pathname]);

  useLayoutEffect(() => {
    if (!plannerFrameActive) return undefined;

    const root = document.documentElement;
    const body = document.body;
    const viewport = getVisualViewport();
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    const previousStyles = {
      bodyInset: body.style.inset,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
      rootOverscrollBehavior: root.style.overscrollBehavior,
    };
    const updateViewport = () => {
      setPlannerViewport(
        viewport ? { height: viewport.height, top: viewport.offsetTop } : null
      );
    };

    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.inset = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    window.scrollTo(0, 0);
    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);

    return () => {
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      root.style.overflow = previousStyles.rootOverflow;
      root.style.overscrollBehavior = previousStyles.rootOverscrollBehavior;
      body.style.position = previousStyles.bodyPosition;
      body.style.inset = previousStyles.bodyInset;
      body.style.width = previousStyles.bodyWidth;
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    };
  }, [getVisualViewport, plannerFrameActive]);

  const plannerFrameStyle =
    plannerFrameActive && plannerViewport
      ? {
          height: `${plannerViewport.height}px`,
          top: `${plannerViewport.top}px`,
        }
      : undefined;

  return (
    <div
      className={`${styles.root} ${
        plannerFrameActive ? styles.plannerFrame : ""
      }`}
      data-testid="app-shell"
      style={plannerFrameStyle}
    >
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <main
        aria-label="Page content"
        className={`${styles.main} ${
          plannerFrameActive ? styles.plannerMain : ""
        }`}
        data-scroll-locked={plannerFrameActive ? "true" : undefined}
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  );
}

AppShell.propTypes = {
  getVisualViewport: PropTypes.func,
};
