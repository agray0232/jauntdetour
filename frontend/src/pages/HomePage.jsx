import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightRegular,
  MapRegular,
  OpenRegular,
  SaveRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import ProductPreview from "../components/home/ProductPreview";
import DiscoverPreview from "../components/home/DiscoverPreview";
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
  hero: {
    position: "relative",
    display: "grid",
    minHeight: "calc(100dvh - 12rem)",
    alignItems: "center",
    overflow: "hidden",
    padding: `${jauntSpacing[8]} max(${jauntSpacing[5]}, calc((100vw - 108rem) / 2)) ${jauntSpacing[9]}`,
    color: jauntColors.neutral.foregroundOnDark,
    backgroundColor: jauntColors.neutral.foreground,
    backgroundImage: `url(${heroImage})`,
    backgroundPosition: "center 58%",
    backgroundSize: "cover",
    ":before": {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(8, 30, 32, 0.76)",
      content: '""',
    },
  },
  heroInner: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(20rem, 0.88fr) minmax(31rem, 1.12fr)",
    alignItems: "center",
    gap: jauntSpacing[8],
  },
  heroCopy: {
    display: "grid",
    justifyItems: "start",
    maxWidth: "38rem",
    rowGap: jauntSpacing[5],
  },
  eyebrow: {
    margin: 0,
    color: jauntColors.brand.accentOnDark,
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
  heroText: {
    maxWidth: "34rem",
    margin: 0,
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: jauntTypography.size.bodyLarge,
    lineHeight: jauntTypography.lineHeight.reading,
    "@media (max-height: 31.25rem)": {
      display: "none",
    },
  },
  heroAction: {
    display: "inline-flex",
    minHeight: "3.125rem",
    alignItems: "center",
    padding: `0 ${jauntSpacing[5]}`,
    columnGap: jauntSpacing[2],
    color: jauntColors.neutral.foreground,
    backgroundColor: jauntColors.brand.accent,
    fontWeight: jauntTypography.weight.bold,
    textDecorationLine: "none",
    borderRadius: jauntRadius.control,
    ":hover": {
      color: jauntColors.neutral.foregroundOnDark,
      backgroundColor: jauntColors.brand.accentStrong,
    },
  },
  section: {
    padding: `${jauntSpacing[8]} max(${jauntSpacing[5]}, calc((100vw - 80rem) / 2)) ${jauntSpacing[9]}`,
  },
  sectionHeading: {
    display: "grid",
    maxWidth: "44rem",
    marginBottom: jauntSpacing[7],
    rowGap: jauntSpacing[3],
  },
  sectionEyebrow: {
    margin: 0,
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.bodySmall,
    fontWeight: jauntTypography.weight.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  sectionTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  valueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
  },
  value: {
    position: "relative",
    display: "grid",
    minHeight: "16rem",
    alignContent: "start",
    padding: jauntSpacing[6],
    rowGap: jauntSpacing[3],
    ...shorthands.borderRight("1px", "solid", tokens.colorNeutralStroke1),
    ":last-child": {
      borderRightStyle: "none",
    },
  },
  valueNumber: {
    position: "absolute",
    top: jauntSpacing[4],
    right: jauntSpacing[4],
    color: jauntColors.brand.accentStrong,
    fontSize: jauntTypography.size.bodySmall,
    fontWeight: jauntTypography.weight.bold,
  },
  valueIcon: {
    width: "2rem",
    height: "2rem",
    marginTop: jauntSpacing[5],
    color: jauntColors.brand.primary,
  },
  valueTitle: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  valueText: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  walkthrough: {
    display: "grid",
    gridTemplateColumns: "minmax(18rem, 0.78fr) minmax(28rem, 1.22fr)",
    alignItems: "center",
    padding: `${jauntSpacing[9]} max(${jauntSpacing[5]}, calc((100vw - 80rem) / 2))`,
    gap: jauntSpacing[8],
    backgroundColor: jauntColors.neutral.backgroundTinted,
  },
  walkthroughCopy: {
    display: "grid",
    justifyItems: "start",
    rowGap: jauntSpacing[4],
  },
  walkthroughText: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodyLarge,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  textLink: {
    display: "inline-flex",
    alignItems: "center",
    columnGap: jauntSpacing[2],
    color: jauntColors.brand.primary,
    fontWeight: jauntTypography.weight.bold,
    textDecorationLine: "none",
    ":hover": {
      textDecorationLine: "underline",
    },
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
  compactHero: {
    "@media (min-width: 48.751rem) and (max-width: 65.625rem) and (min-height: 31.251rem)":
      {
        padding: `${jauntSpacing[7]} ${jauntSpacing[5]} ${jauntSpacing[8]}`,
      },
    "@media (min-width: 21.001rem) and (max-width: 48.75rem) and (min-height: 31.251rem)":
      {
        minHeight: "auto",
        padding: `${jauntSpacing[5]} ${jauntSpacing[4]}`,
      },
    "@media (max-width: 21rem) and (min-height: 31.251rem)": {
      minHeight: "auto",
      padding: `0 ${jauntSpacing[4]}`,
    },
    "@media (max-height: 31.25rem)": {
      padding: `${jauntSpacing[2]} ${jauntSpacing[4]}`,
    },
  },
  compactHeroInner: {
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      gridTemplateColumns: "1fr",
      gap: jauntSpacing[4],
    },
    "@media (max-height: 31.25rem)": {
      gridTemplateColumns: "1fr",
      gap: 0,
    },
  },
  compactHeroCopy: {
    "@media (max-width: 48.75rem) and (min-height: 31.251rem)": {
      rowGap: jauntSpacing[4],
    },
    "@media (max-height: 31.25rem)": {
      rowGap: jauntSpacing[2],
    },
  },
  compactTitle: {
    "@media (min-width: 20.001rem) and (max-width: 48.75rem) and (min-height: 31.251rem)":
      {
        fontSize: jauntTypography.size.title,
      },
    "@media (max-height: 31.25rem)": {
      fontSize: jauntTypography.size.titleSmall,
    },
  },
  compactSection: {
    "@media (min-width: 21.001rem) and (max-width: 48.75rem) and (min-height: 31.251rem)":
      {
        padding: `0 ${jauntSpacing[4]} ${jauntSpacing[8]}`,
      },
    "@media (max-width: 21rem) and (min-height: 31.251rem)": {
      padding: `0 ${jauntSpacing[4]} ${jauntSpacing[8]}`,
    },
    "@media (max-height: 31.25rem)": {
      padding: `${jauntSpacing[2]} ${jauntSpacing[4]} ${jauntSpacing[8]}`,
    },
  },
  compactValues: {
    "@media (max-width: 48.75rem)": {
      gridTemplateColumns: "1fr",
    },
  },
  compactValue: {
    "@media (max-width: 48.75rem)": {
      minHeight: "auto",
      borderRightStyle: "none",
      ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
      ":last-child": {
        borderBottomStyle: "none",
      },
    },
  },
  compactWalkthrough: {
    "@media (max-width: 48.75rem)": {
      gridTemplateColumns: "1fr",
      padding: `${jauntSpacing[8]} ${jauntSpacing[4]}`,
      gap: jauntSpacing[6],
    },
  },
});

const values = [
  {
    icon: MapRegular,
    title: "Set the route",
    text: "Start with the drive you already know you need to make.",
  },
  {
    icon: SearchRegular,
    title: "Explore the way",
    text: "Search around any point and compare discoveries in route context.",
  },
  {
    icon: SaveRegular,
    title: "Keep the plan",
    text: "Save your itinerary or open the finished route in Google Maps.",
  },
];

export default function HomePage() {
  const styles = useStyles();

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${styles.compactHero}`}
        aria-labelledby="home-title"
      >
        <div className={`${styles.heroInner} ${styles.compactHeroInner}`}>
          <div className={`${styles.heroCopy} ${styles.compactHeroCopy}`}>
            <p className={styles.eyebrow}>The interesting way there</p>
            <h1
              className={`${styles.title} ${styles.compactTitle} ${styles.ultraCompactTitle}`}
              id="home-title"
            >
              Find the stop that makes the drive.
            </h1>
            <p className={styles.heroText}>
              Turn the drive into a Jaunt worth remembering. Discover
              interesting places along the route.
            </p>
            <Link
              className={`${styles.heroAction} ${styles.ultraCompactAction}`}
              to="/plan"
            >
              Plan your Jaunt <ArrowRightRegular aria-hidden="true" />
            </Link>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.compactSection}`}
        aria-labelledby="value-title"
      >
        <div className={styles.sectionHeading}>
          <p className={styles.sectionEyebrow}>
            A better way to plan the drive
          </p>
          <h2
            className={`${styles.sectionTitle} ${styles.ultraCompactTitle}`}
            id="value-title"
          >
            The route is only the beginning.
          </h2>
        </div>
        <div className={`${styles.valueGrid} ${styles.compactValues}`}>
          {values.map(({ icon: Icon, title, text }, index) => (
            <article
              className={`${styles.value} ${styles.compactValue}`}
              key={title}
            >
              <span className={styles.valueNumber}>0{index + 1}</span>
              <Icon className={styles.valueIcon} aria-hidden="true" />
              <h3 className={styles.valueTitle}>{title}</h3>
              <p className={styles.valueText}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.walkthrough} ${styles.compactWalkthrough}`}
        aria-labelledby="walkthrough-title"
      >
        <div className={styles.walkthroughCopy}>
          <p className={styles.sectionEyebrow}>Built for the planning moment</p>
          <h2
            className={`${styles.sectionTitle} ${styles.ultraCompactTitle}`}
            id="walkthrough-title"
          >
            Stay oriented while the Jaunt takes shape.
          </h2>
          <p className={styles.walkthroughText}>
            The map remains the anchor. Focused Build and Discover tools help
            you shape the route without losing spatial context.
          </p>
          <Link className={styles.textLink} to="/plan">
            Open the planner <OpenRegular aria-hidden="true" />
          </Link>
        </div>
        <DiscoverPreview />
      </section>

      <SiteFooter />
    </div>
  );
}
