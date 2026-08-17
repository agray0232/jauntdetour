import React, { useLayoutEffect, useRef } from "react";
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
        overflow: "hidden",
        overscrollBehavior: "none",
      },
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
});

export default function AppShell() {
  const styles = useStyles();
  const compactLayout = useCompactLayout();
  const location = useLocation();
  const mainRef = useRef(null);

  useLayoutEffect(() => {
    if (!compactLayout) return;
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo(0, 0);
  }, [compactLayout, location.key, location.pathname]);

  return (
    <div className={styles.root}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <main
        aria-label="Page content"
        className={styles.main}
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  );
}
