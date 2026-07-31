import React from "react";
import PropTypes from "prop-types";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import {
  EditRegular,
  TimerRegular,
  VehicleCarRegular,
} from "@fluentui/react-icons";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    margin: `0 ${jauntSpacing[4]}`,
    padding: jauntSpacing[4],
    rowGap: jauntSpacing[4],
    backgroundColor: jauntColors.neutral.backgroundTinted,
    borderRadius: jauntRadius.surface,
    borderLeft: `4px solid ${jauntColors.support.sky}`,
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: jauntSpacing[3],
  },
  metric: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    alignItems: "center",
    columnGap: jauntSpacing[2],
  },
  metricIcon: {
    gridRow: "1 / 3",
    color: jauntColors.brand.primary,
  },
  metricLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.caption,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: jauntTypography.size.bodyLarge,
    fontWeight: jauntTypography.weight.bold,
  },
  edit: {
    gridColumn: "1 / -1",
    justifySelf: "end",
  },
});

export default function RouteSummary({ onEditRoute, tripSummary }) {
  const styles = useStyles();
  const hours = tripSummary.time?.hours || 0;
  const minutes = tripSummary.time?.min || 0;
  const timeText = `${hours ? `${hours} hr ` : ""}${minutes} min`;

  return (
    <section className={styles.root} aria-label="Route summary">
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <VehicleCarRegular className={styles.metricIcon} aria-hidden="true" />
          <Text className={styles.metricLabel}>Distance</Text>
          <Text className={styles.metricValue}>{tripSummary.distance} mi</Text>
        </div>
        <div className={styles.metric}>
          <TimerRegular className={styles.metricIcon} aria-hidden="true" />
          <Text className={styles.metricLabel}>Drive time</Text>
          <Text className={styles.metricValue}>{timeText}</Text>
        </div>
        <Button
          className={styles.edit}
          appearance="subtle"
          icon={<EditRegular />}
          onClick={onEditRoute}
        >
          Edit route
        </Button>
      </div>
    </section>
  );
}

RouteSummary.propTypes = {
  onEditRoute: PropTypes.func.isRequired,
  tripSummary: PropTypes.object.isRequired,
};
