import React from "react";
import { Link } from "react-router-dom";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import BrandMark from "../../design-system/BrandMark";
import { jauntSpacing, jauntTypography } from "../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: `${jauntSpacing[6]} max(${jauntSpacing[5]}, calc((100vw - 80rem) / 2))`,
    columnGap: jauntSpacing[6],
    rowGap: jauntSpacing[4],
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
  },
  identity: {
    display: "flex",
    alignItems: "center",
    columnGap: jauntSpacing[3],
  },
  name: {
    display: "block",
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.bodyLarge,
    fontWeight: jauntTypography.weight.bold,
  },
  tagline: {
    display: "block",
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
    "@media (max-width: 20rem)": {
      display: "none",
    },
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: jauntSpacing[4],
  },
  link: {
    color: tokens.colorNeutralForeground2,
    fontWeight: jauntTypography.weight.medium,
    textDecorationLine: "none",
    ":hover": {
      color: tokens.colorNeutralForeground1,
      textDecorationLine: "underline",
    },
  },
  compact: {
    "@media (max-width: 40rem)": {
      gridTemplateColumns: "1fr",
    },
  },
  ultraCompact: {
    "@media (max-width: 20rem)": {
      paddingRight: jauntSpacing[4],
      paddingLeft: jauntSpacing[4],
    },
  },
  ultraCompactIdentity: {
    "@media (max-width: 20rem)": {
      columnGap: jauntSpacing[2],
      "& > img": {
        width: "2rem",
        height: "2rem",
      },
    },
  },
  compactNav: {
    "@media (max-width: 40rem)": {
      justifyContent: "flex-start",
    },
    "@media (max-width: 20rem)": {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: jauntSpacing[2],
    },
  },
});

export default function SiteFooter() {
  const styles = useStyles();

  return (
    <footer
      className={`${styles.root} ${styles.compact} ${styles.ultraCompact}`}
    >
      <div className={`${styles.identity} ${styles.ultraCompactIdentity}`}>
        <BrandMark decorative size={40} />
        <span>
          <span className={styles.name}>JauntDetour</span>
          <span className={styles.tagline}>
            Find the interesting way there.
          </span>
        </span>
      </div>
      <nav
        aria-label="Footer navigation"
        className={`${styles.nav} ${styles.compactNav}`}
      >
        <Link className={styles.link} to="/plan">
          Plan a Jaunt
        </Link>
        <Link className={styles.link} to="/about">
          About
        </Link>
        <Link className={styles.link} to="/privacy">
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
