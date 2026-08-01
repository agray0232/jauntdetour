import React from "react";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import { jauntRadius, jauntSpacing } from "../../design-system/tokens";
import tripSample from "../../assets/home/trip-sample.png";

const useStyles = makeStyles({
  root: {
    width: "min(58rem, 100%)",
    margin: 0,
    "@media (max-width: 21rem), (max-height: 31.25rem)": {
      display: "none",
    },
  },
  image: {
    display: "block",
    width: "100%",
    height: "auto",
    aspectRatio: "1857 / 1293",
    objectFit: "contain",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.surface,
    boxShadow: tokens.shadow28,
    ...shorthands.border("1px", "solid", "rgba(255, 255, 255, 0.55)"),
  },
  caption: {
    display: "block",
    width: "fit-content",
    marginTop: `-${jauntSpacing[3]}`,
    marginRight: jauntSpacing[4],
    marginLeft: "auto",
    padding: `${jauntSpacing[2]} ${jauntSpacing[3]}`,
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: jauntRadius.control,
    boxShadow: tokens.shadow16,
    fontSize: tokens.fontSizeBase200,
    "@media (max-width: 35rem)": {
      display: "none",
    },
  },
});

export default function ProductPreview() {
  const styles = useStyles();

  return (
    <figure className={styles.root}>
      <img
        className={styles.image}
        src={tripSample}
        alt="JauntDetour planner preview showing a saved Atlanta to Charlotte route with a Paris Mountain State Park detour"
      />
      <figcaption className={styles.caption}>
        Saved Jaunt with one detour
      </figcaption>
    </figure>
  );
}
