import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import { jauntColors, jauntSpacing } from "../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: "100vh",
    height: "100dvh",
    backgroundColor: tokens.colorNeutralBackground2,
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
  },
});

export default function AppShell() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
