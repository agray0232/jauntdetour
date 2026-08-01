import React from "react";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { jauntRadius } from "../../design-system/tokens";
import detourOptions from "../../assets/home/detour-options.png";

const useStyles = makeStyles({
  frame: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    boxShadow: tokens.shadow16,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  image: {
    display: "block",
    width: "100%",
    height: "auto",
    aspectRatio: "1834 / 1392",
    objectFit: "contain",
  },
});

export default function DiscoverPreview() {
  const styles = useStyles();

  return (
    <div className={styles.frame}>
      <img
        className={styles.image}
        src={detourOptions}
        alt="JauntDetour Discover workspace showing Hike criteria, search controls, result options, and numbered places on the route map"
      />
    </div>
  );
}
