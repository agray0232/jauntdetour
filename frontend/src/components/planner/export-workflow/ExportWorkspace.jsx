import React from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { OpenRegular } from "@fluentui/react-icons";
import { SiGooglemaps } from "react-icons/si";
import { exportToGoogleMaps } from "../../../utils/googleMapsExport";
import { trackEvent } from "../../../telemetry/telemetry";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    minWidth: 0,
    padding: jauntSpacing[4],
    rowGap: jauntSpacing[5],
  },
  heading: { display: "grid", rowGap: jauntSpacing[1] },
  eyebrow: {
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.caption,
    fontWeight: jauntTypography.weight.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  supporting: {
    color: tokens.colorNeutralForeground2,
    lineHeight: jauntTypography.lineHeight.standard,
  },
  route: {
    display: "grid",
    padding: jauntSpacing[4],
    rowGap: jauntSpacing[3],
    backgroundColor: jauntColors.neutral.backgroundTinted,
    borderRadius: jauntRadius.surface,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  routeEndpoints: {
    display: "grid",
    gridTemplateColumns: "max-content minmax(4rem, 1fr) max-content",
    alignItems: "center",
    gap: jauntSpacing[2],
  },
  endpoint: {
    display: "grid",
    minWidth: 0,
    maxWidth: "7.5rem",
    rowGap: jauntSpacing[1],
  },
  destinationEndpoint: {
    justifyItems: "end",
    textAlign: "right",
  },
  endpointLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.caption,
    textTransform: "uppercase",
  },
  endpointValue: {
    overflowWrap: "anywhere",
    fontWeight: jauntTypography.weight.semibold,
  },
  routeConnector: {
    position: "relative",
    display: "block",
    width: "calc(100% - 0.75rem)",
    minWidth: "3.25rem",
    height: "0.25rem",
    alignSelf: "center",
    justifySelf: "center",
    transform: `translateY(${jauntSpacing[3]})`,
    backgroundColor: jauntColors.brand.accentStrong,
    borderRadius: jauntRadius.round,
    boxShadow: `0 1px 2px ${jauntColors.brand.accentSubtle}`,
    ":after": {
      position: "absolute",
      top: "50%",
      right: "-0.125rem",
      width: "0.625rem",
      height: "0.625rem",
      transform: "translateY(-50%) rotate(45deg)",
      borderTop: `0.1875rem solid ${jauntColors.brand.accentStrong}`,
      borderRight: `0.1875rem solid ${jauntColors.brand.accentStrong}`,
      content: '""',
    },
  },
  routeBadge: { justifySelf: "start" },
  provider: {
    display: "grid",
    gridTemplateColumns: "2.75rem minmax(0, 1fr)",
    alignItems: "center",
    padding: jauntSpacing[4],
    gap: jauntSpacing[3],
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    boxShadow: tokens.shadow4,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  providerIcon: {
    display: "grid",
    width: "2.75rem",
    height: "2.75rem",
    placeItems: "center",
    color: "#4285f4",
    backgroundColor: jauntColors.neutral.background,
    borderRadius: jauntRadius.round,
    fontSize: jauntTypography.size.bodyLarge,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  providerCopy: { display: "grid", minWidth: 0, rowGap: jauntSpacing[1] },
  providerTitle: { fontWeight: jauntTypography.weight.bold },
  providerDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
    lineHeight: jauntTypography.lineHeight.standard,
  },
  open: {
    gridColumn: "1 / -1",
    width: "100%",
    marginTop: jauntSpacing[1],
  },
});

function endpointLabel(endpoint) {
  return typeof endpoint === "string" ? endpoint : endpoint?.address || "";
}

export default function ExportWorkspace({ destination, detourList, origin }) {
  const styles = useStyles();
  const stopCount = detourList.length;

  const handleExport = () => {
    trackEvent("trip_export_opened", {
      countBucket: stopCount === 0 ? "0" : stopCount <= 5 ? "1-5" : "6+",
      feature: "export",
      source: "planner",
    });
    exportToGoogleMaps(origin, destination, detourList);
  };

  return (
    <section className={styles.root} aria-labelledby="export-title">
      <div className={styles.heading}>
        <Text className={styles.eyebrow}>Route handoff</Text>
        <h3 className={styles.title} id="export-title">
          Take your Jaunt with you
        </h3>
        <Text className={styles.supporting}>
          Open the current jaunt in another app when you are ready to continue
          the drive.
        </Text>
      </div>

      <div className={styles.route} aria-label="Route to export">
        <div className={styles.routeEndpoints} data-testid="route-endpoints">
          <span className={styles.endpoint}>
            <Text className={styles.endpointLabel}>Start</Text>
            <Text className={styles.endpointValue}>
              {endpointLabel(origin)}
            </Text>
          </span>
          <span className={styles.routeConnector} aria-hidden="true" />
          <span
            className={mergeClasses(
              styles.endpoint,
              styles.destinationEndpoint
            )}
          >
            <Text className={styles.endpointLabel}>Destination</Text>
            <Text className={styles.endpointValue}>
              {endpointLabel(destination)}
            </Text>
          </span>
        </div>
        <span className={styles.routeBadge} data-testid="route-detour-count">
          <Badge appearance="tint" color="informative">
            {stopCount} {stopCount === 1 ? "detour" : "detours"}
          </Badge>
        </span>
      </div>

      <article className={styles.provider} aria-labelledby="google-maps-title">
        <span className={styles.providerIcon} aria-hidden="true">
          <SiGooglemaps />
        </span>
        <span className={styles.providerCopy}>
          <Text className={styles.providerTitle} id="google-maps-title">
            Google Maps
          </Text>
          <Text className={styles.providerDescription}>
            Opens your jaunt in a new tab with your current stops in itinerary
            order.
          </Text>
        </span>
        <Button
          className={styles.open}
          appearance="primary"
          icon={<OpenRegular />}
          onClick={handleExport}
        >
          Open in Google Maps
        </Button>
      </article>
    </section>
  );
}

ExportWorkspace.propTypes = {
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  detourList: PropTypes.array.isRequired,
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};
