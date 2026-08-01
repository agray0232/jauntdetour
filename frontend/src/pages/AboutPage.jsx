import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightRegular,
  MapRegular,
  OpenRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import SiteFooter from "../components/home/SiteFooter";
import heroImage from "../assets/home/open-road.jpg";
import {
  jauntColors,
  jauntRadius,
  jauntSpacing,
  jauntTypography,
} from "../design-system/tokens";

const useStyles = makeStyles({
  page: {
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  intro: {
    display: "grid",
    gridTemplateColumns: "minmax(18rem, 0.8fr) minmax(24rem, 1.2fr)",
    padding: `${jauntSpacing[9]} max(${jauntSpacing[5]}, calc((100vw - 80rem) / 2))`,
    gap: jauntSpacing[8],
  },
  eyebrow: {
    margin: `0 0 ${jauntSpacing[3]}`,
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.bodySmall,
    fontWeight: jauntTypography.weight.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    maxWidth: "12ch",
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.display,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  copy: {
    display: "grid",
    minWidth: 0,
    alignContent: "start",
    justifyItems: "start",
    rowGap: jauntSpacing[5],
  },
  lead: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
    lineHeight: jauntTypography.lineHeight.standard,
  },
  paragraph: {
    maxWidth: "42rem",
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodyLarge,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  action: {
    display: "inline-flex",
    minHeight: "2.625rem",
    alignItems: "center",
    padding: `0 ${jauntSpacing[4]}`,
    columnGap: jauntSpacing[2],
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.brand.primary,
    fontWeight: jauntTypography.weight.bold,
    textDecorationLine: "none",
    borderRadius: jauntRadius.control,
    ":hover": {
      backgroundColor: jauntColors.brand.primaryHover,
    },
  },
  photo: {
    minHeight: "26rem",
    backgroundColor: jauntColors.neutral.foreground,
    backgroundImage: `url(${heroImage})`,
    backgroundPosition: "center 60%",
    backgroundSize: "cover",
  },
  capabilities: {
    padding: `${jauntSpacing[9]} max(${jauntSpacing[5]}, calc((100vw - 80rem) / 2))`,
    backgroundColor: jauntColors.neutral.backgroundTinted,
  },
  sectionTitle: {
    maxWidth: "18ch",
    margin: `0 0 ${jauntSpacing[7]}`,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  capabilityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
  },
  capability: {
    display: "grid",
    minHeight: "14rem",
    alignContent: "start",
    padding: jauntSpacing[6],
    rowGap: jauntSpacing[4],
    ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
    ":last-child": {
      borderRightStyle: "none",
    },
  },
  icon: {
    width: "2rem",
    height: "2rem",
    color: jauntColors.brand.primary,
  },
  capabilityTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  capabilityText: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  boundary: {
    display: "grid",
    gridTemplateColumns: "0.8fr 1.2fr",
    padding: `${jauntSpacing[9]} max(${jauntSpacing[5]}, calc((100vw - 80rem) / 2))`,
    gap: jauntSpacing[8],
    backgroundColor: tokens.colorNeutralBackground1,
  },
  boundaryList: {
    display: "grid",
    margin: 0,
    padding: 0,
    rowGap: jauntSpacing[3],
    color: tokens.colorNeutralForeground2,
    listStylePosition: "inside",
    lineHeight: jauntTypography.lineHeight.reading,
  },
  ultraCompactAction: {
    "@media (max-width: 20rem)": {
      width: "100%",
      boxSizing: "border-box",
      justifyContent: "center",
      paddingRight: jauntSpacing[2],
      paddingLeft: jauntSpacing[2],
    },
  },
  ultraCompactTitle: {
    "@media (max-width: 20rem)": {
      fontSize: jauntTypography.size.titleSmall,
    },
  },
  ultraCompactSection: {
    "@media (max-width: 20rem)": {
      paddingRight: jauntSpacing[2],
      paddingLeft: jauntSpacing[2],
    },
  },
  compactIntro: {
    "@media (max-width: 48.75rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      padding: `${jauntSpacing[8]} ${jauntSpacing[4]}`,
      gap: jauntSpacing[6],
    },
    "@media (max-width: 20rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
  compactTitle: {
    "@media (min-width: 20.001rem) and (max-width: 48.75rem)": {
      fontSize: jauntTypography.size.title,
    },
  },
  compactSection: {
    "@media (max-width: 48.75rem)": {
      padding: `${jauntSpacing[8]} ${jauntSpacing[4]}`,
    },
  },
  compactCapabilities: {
    "@media (max-width: 48.75rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
    "@media (max-width: 20rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
  compactCapability: {
    "@media (max-width: 48.75rem)": {
      minHeight: "auto",
      borderRightStyle: "none",
      ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
      ":last-child": {
        borderBottomStyle: "none",
      },
    },
  },
  compactBoundary: {
    "@media (max-width: 48.75rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
      padding: `${jauntSpacing[8]} ${jauntSpacing[4]}`,
      gap: jauntSpacing[5],
    },
    "@media (max-width: 20rem)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
});

const capabilities = [
  {
    icon: MapRegular,
    title: "Build the route",
    text: "Create a drive between an origin and destination, then see distance and travel time.",
  },
  {
    icon: SearchRegular,
    title: "Discover along it",
    text: "Choose a point on the route and search nearby for places worth considering.",
  },
  {
    icon: OpenRegular,
    title: "Keep or export it",
    text: "Save a Jaunt to your account or open the finished itinerary in Google Maps.",
  },
];

export default function AboutPage() {
  const styles = useStyles();

  return (
    <div className={styles.page}>
      <section
        className={`${styles.intro} ${styles.compactIntro} ${styles.ultraCompactSection}`}
        aria-labelledby="about-title"
      >
        <div>
          <p className={styles.eyebrow}>About JauntDetour</p>
          <h1
            className={`${styles.title} ${styles.compactTitle} ${styles.ultraCompactTitle}`}
            id="about-title"
          >
            Make room for the unexpected.
          </h1>
        </div>
        <div className={styles.copy}>
          <p className={styles.lead}>
            JauntDetour turns the drive between two places into part of the
            experience.
          </p>
          <p className={styles.paragraph}>
            Start with a route, explore places along the way, shape the
            itinerary, and take the finished plan with you in Google Maps.
          </p>
          <Link
            className={`${styles.action} ${styles.ultraCompactAction}`}
            to="/plan"
          >
            Plan your Jaunt <ArrowRightRegular aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div
        className={styles.photo}
        role="img"
        aria-label="Open road crossing a desert landscape"
      />

      <section
        className={`${styles.capabilities} ${styles.compactSection} ${styles.ultraCompactSection}`}
        aria-labelledby="capabilities-title"
      >
        <p className={styles.eyebrow}>What it does today</p>
        <h2
          className={`${styles.sectionTitle} ${styles.ultraCompactTitle}`}
          id="capabilities-title"
        >
          A focused toolkit for planning the drive.
        </h2>
        <div
          className={`${styles.capabilityGrid} ${styles.compactCapabilities}`}
        >
          {capabilities.map(({ icon: Icon, title, text }) => (
            <article
              className={`${styles.capability} ${styles.compactCapability}`}
              key={title}
            >
              <Icon className={styles.icon} aria-hidden="true" />
              <h3 className={styles.capabilityTitle}>{title}</h3>
              <p className={styles.capabilityText}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.boundary} ${styles.compactBoundary} ${styles.ultraCompactSection}`}
        aria-labelledby="boundaries-title"
      >
        <div>
          <p className={styles.eyebrow}>Deliberately focused</p>
          <h2
            className={`${styles.sectionTitle} ${styles.ultraCompactTitle}`}
            id="boundaries-title"
          >
            Plan before the wheels turn.
          </h2>
        </div>
        <div>
          <p className={styles.paragraph}>
            JauntDetour is a pre-trip planning tool. It does not provide live
            navigation, reservations, collaboration, or multi-day scheduling.
          </p>
          <ul className={styles.boundaryList}>
            <li>Use the complete planner without signing in.</li>
            <li>Sign in only when you want to save and revisit a Jaunt.</li>
            <li>Export the route when you are ready to travel.</li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
