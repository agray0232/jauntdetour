import React from "react";
import {
  AddRegular,
  LocationRegular,
  NavigationRegular,
} from "@fluentui/react-icons";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    position: "relative",
    width: "min(42rem, 100%)",
    minHeight: "25rem",
    color: tokens.colorNeutralForeground1,
  },
  window: {
    position: "absolute",
    inset: "0 0 2.25rem 0",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    boxShadow: tokens.shadow28,
    ...shorthands.border("1px", "solid", "rgba(255, 255, 255, 0.5)"),
  },
  bar: {
    display: "flex",
    height: "2rem",
    alignItems: "center",
    padding: `0 ${jauntSpacing[3]}`,
    columnGap: jauntSpacing[1],
    color: tokens.colorNeutralForeground2,
    backgroundColor: jauntColors.neutral.backgroundSubtle,
    ...shorthands.borderBottom("1px", "solid", jauntColors.neutral.stroke),
  },
  dot: {
    width: "0.4375rem",
    height: "0.4375rem",
    backgroundColor: jauntColors.neutral.stroke,
    borderRadius: jauntRadius.round,
  },
  address: {
    marginLeft: jauntSpacing[2],
    fontSize: jauntTypography.size.caption,
  },
  app: {
    display: "grid",
    minHeight: "20.75rem",
    gridTemplateColumns: "minmax(11rem, 36%) 1fr",
  },
  panel: {
    display: "grid",
    alignContent: "start",
    padding: jauntSpacing[4],
    rowGap: jauntSpacing[2],
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRight("1px", "solid", jauntColors.neutral.stroke),
  },
  jauntName: {
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.bodyLarge,
    fontWeight: jauntTypography.weight.bold,
  },
  routeName: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  tabs: {
    display: "flex",
    marginTop: jauntSpacing[2],
    columnGap: jauntSpacing[4],
    fontSize: jauntTypography.size.bodySmall,
    ...shorthands.borderBottom("1px", "solid", jauntColors.neutral.stroke),
  },
  activeTab: {
    paddingBottom: jauntSpacing[2],
    borderBottom: `3px solid ${jauntColors.brand.accent}`,
    fontWeight: jauntTypography.weight.bold,
  },
  tab: {
    paddingBottom: jauntSpacing[2],
    color: tokens.colorNeutralForeground2,
  },
  stops: {
    display: "grid",
    marginTop: jauntSpacing[2],
    rowGap: jauntSpacing[2],
  },
  stop: {
    display: "grid",
    gridTemplateColumns: "1.5rem 1fr",
    alignItems: "center",
    minHeight: "2.625rem",
    padding: jauntSpacing[2],
    columnGap: jauntSpacing[2],
    fontSize: jauntTypography.size.bodySmall,
    borderRadius: jauntRadius.control,
  },
  selectedStop: {
    backgroundColor: jauntColors.brand.accentSubtle,
    ...shorthands.border("1px", "solid", jauntColors.brand.accent),
  },
  marker: {
    display: "grid",
    width: "1.5rem",
    height: "1.5rem",
    placeItems: "center",
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.neutral.foreground,
    borderRadius: jauntRadius.round,
    fontSize: jauntTypography.size.caption,
    fontWeight: jauntTypography.weight.bold,
  },
  selectedMarker: {
    backgroundColor: jauntColors.brand.accentStrong,
  },
  map: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#dce9df",
    backgroundImage:
      "linear-gradient(28deg, transparent 48%, rgba(255,255,255,0.82) 49%, rgba(255,255,255,0.82) 51%, transparent 52%), linear-gradient(112deg, transparent 45%, rgba(180,202,188,0.82) 46%, rgba(180,202,188,0.82) 48%, transparent 49%), repeating-linear-gradient(0deg, transparent 0, transparent 42px, rgba(83,129,103,0.1) 43px, rgba(83,129,103,0.1) 44px)",
  },
  water: {
    position: "absolute",
    right: "-12%",
    bottom: "-8%",
    width: "80%",
    height: "38%",
    backgroundColor: "rgba(185, 223, 229, 0.62)",
    transform: "rotate(8deg)",
  },
  route: {
    position: "absolute",
    top: "6%",
    left: "49%",
    width: "0.3125rem",
    height: "88%",
    backgroundColor: jauntColors.map.route,
    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.85)",
    transform: "rotate(-17deg)",
  },
  pin: {
    position: "absolute",
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.map.endpoint,
    borderRadius: jauntRadius.round,
    boxShadow: tokens.shadow8,
    ...shorthands.border("2px", "solid", jauntColors.neutral.background),
  },
  pinStart: {
    top: "8%",
    left: "29%",
  },
  pinStop: {
    top: "45%",
    left: "50%",
    backgroundColor: jauntColors.map.stop,
  },
  pinEnd: {
    right: "24%",
    bottom: "8%",
  },
  result: {
    position: "absolute",
    right: jauntSpacing[5],
    bottom: 0,
    display: "grid",
    width: "18rem",
    gridTemplateColumns: "2rem 1fr auto",
    alignItems: "center",
    padding: jauntSpacing[3],
    columnGap: jauntSpacing[3],
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    boxShadow: tokens.shadow16,
    ...shorthands.border("1px", "solid", jauntColors.neutral.stroke),
  },
  resultMarker: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.map.selected,
    borderRadius: jauntRadius.round,
    fontWeight: jauntTypography.weight.bold,
  },
  resultCopy: {
    display: "grid",
    minWidth: 0,
    rowGap: jauntSpacing[1],
  },
  resultMeta: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  resultIcon: {
    color: jauntColors.brand.primary,
  },
  stats: {
    position: "absolute",
    bottom: jauntSpacing[1],
    left: 0,
    display: "grid",
    padding: `${jauntSpacing[2]} ${jauntSpacing[3]}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
    borderLeft: `4px solid ${jauntColors.brand.highlight}`,
  },
  statsLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.caption,
  },
  statsValue: {
    fontSize: jauntTypography.size.bodySmall,
    fontWeight: jauntTypography.weight.bold,
  },
  compact: {
    "@media (max-width: 48.75rem)": {
      minHeight: "14rem",
    },
    "@media (max-width: 21rem)": {
      display: "none",
    },
    "@media (max-height: 31.25rem)": {
      display: "none",
    },
  },
  compactWindow: {
    "@media (max-width: 48.75rem)": {
      inset: "0 0 1.75rem",
    },
  },
  compactApp: {
    "@media (max-width: 35rem)": {
      minHeight: "13rem",
      gridTemplateColumns: "42% 58%",
    },
  },
  compactPanel: {
    "@media (max-width: 35rem)": {
      padding: jauntSpacing[3],
    },
  },
  compactResult: {
    "@media (max-width: 35rem)": {
      right: jauntSpacing[2],
      width: "14.5rem",
    },
  },
  hideOnSmall: {
    "@media (max-width: 30rem)": {
      display: "none",
    },
  },
});

export default function ProductPreview() {
  const styles = useStyles();

  return (
    <div
      className={`${styles.root} ${styles.compact}`}
      role="img"
      aria-label="JauntDetour planner preview showing an Atlanta to Charlotte route with a stop at Paris Mountain"
    >
      <div className={`${styles.window} ${styles.compactWindow}`}>
        <div className={styles.bar} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.address}>jauntdetour.com/plan</span>
        </div>
        <div className={`${styles.app} ${styles.compactApp}`}>
          <div className={`${styles.panel} ${styles.compactPanel}`}>
            <span className={styles.jauntName}>Carolinas weekend</span>
            <span className={styles.routeName}>Atlanta to Charlotte</span>
            <div className={styles.tabs}>
              <span className={styles.activeTab}>Build</span>
              <span className={styles.tab}>Discover</span>
            </div>
            <div className={styles.stops}>
              <div className={styles.stop}>
                <span className={styles.marker}>A</span>
                <span>Atlanta, GA</span>
              </div>
              <div className={`${styles.stop} ${styles.selectedStop}`}>
                <span className={`${styles.marker} ${styles.selectedMarker}`}>
                  1
                </span>
                <span>Paris Mountain</span>
              </div>
              <div className={styles.stop}>
                <span className={styles.marker}>B</span>
                <span>Charlotte, NC</span>
              </div>
            </div>
          </div>
          <div className={styles.map} aria-hidden="true">
            <span className={styles.water} />
            <span className={styles.route} />
            <span className={`${styles.pin} ${styles.pinStart}`}>
              <NavigationRegular />
            </span>
            <span className={`${styles.pin} ${styles.pinStop}`}>1</span>
            <span className={`${styles.pin} ${styles.pinEnd}`}>
              <LocationRegular />
            </span>
          </div>
        </div>
      </div>
      <div className={`${styles.result} ${styles.compactResult}`}>
        <span className={styles.resultMarker}>1</span>
        <span className={styles.resultCopy}>
          <strong>Paris Mountain</strong>
          <span className={styles.resultMeta}>Hike · 4.7 rating</span>
        </span>
        <AddRegular className={styles.resultIcon} aria-hidden="true" />
      </div>
      <div className={`${styles.stats} ${styles.hideOnSmall}`}>
        <span className={styles.statsLabel}>Route with detour</span>
        <span className={styles.statsValue}>258 mi · 4 hr 05 min</span>
      </div>
    </div>
  );
}
