import React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import SiteFooter from "../components/home/SiteFooter";
import { jauntSpacing, jauntTypography } from "../design-system/tokens";

const useStyles = makeStyles({
  page: {
    minHeight: "100%",
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  content: {
    display: "grid",
    maxWidth: "48rem",
    margin: "0 auto",
    padding: `${jauntSpacing[9]} ${jauntSpacing[5]}`,
    rowGap: jauntSpacing[6],
    "@media (max-width: 48.75rem)": {
      padding: `${jauntSpacing[8]} ${jauntSpacing[4]}`,
    },
  },
  heading: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  updated: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: jauntTypography.size.bodySmall,
  },
  section: {
    display: "grid",
    rowGap: jauntSpacing[3],
  },
  sectionHeading: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.titleSmall,
  },
  paragraph: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  list: {
    display: "grid",
    margin: 0,
    paddingLeft: jauntSpacing[6],
    rowGap: jauntSpacing[2],
    color: tokens.colorNeutralForeground2,
    lineHeight: jauntTypography.lineHeight.reading,
  },
});

export default function PrivacyPage() {
  const styles = useStyles();

  return (
    <div className={styles.page}>
      <article className={styles.content}>
        <header className={styles.section}>
          <h1 className={styles.heading}>Privacy</h1>
          <p className={styles.updated}>Last updated August 2, 2026</p>
          <p className={styles.paragraph}>
            Jaunt uses first-party product telemetry to understand whether the
            site works well and which planning features are useful.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>What telemetry includes</h2>
          <ul className={styles.list}>
            <li>Normalized page names and named feature actions</li>
            <li>Success, empty, and failure outcomes for planning tasks</li>
            <li>Approximate time while a page is visible</li>
            <li>Browser performance, application errors, and API timing</li>
            <li>
              An internal account identifier while signed in, without your email
              or display name
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>What telemetry excludes</h2>
          <p className={styles.paragraph}>
            Telemetry does not include route addresses, coordinates, Jaunt
            names, place names, search text, notes, request bodies, advertising
            identifiers, heatmaps, or session recordings.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Cookies and storage</h2>
          <p className={styles.paragraph}>
            The telemetry SDK does not create analytics cookies or store
            analytics identifiers in local storage or session storage. Jaunt
            still uses essential session technology for sign-in and to preserve
            an in-progress plan during navigation.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Retention and processing</h2>
          <p className={styles.paragraph}>
            Detailed telemetry is retained in Microsoft Azure for 90 days.
            Access is restricted to Jaunt operators. Aggregate account and saved
            Jaunt reports are produced from the application database without
            exposing account-level rows.
          </p>
        </section>
      </article>
      <SiteFooter />
    </div>
  );
}
