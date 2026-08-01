import React from "react";
import PropTypes from "prop-types";
import { Text, makeStyles, tokens } from "@fluentui/react-components";
import { Link } from "react-router-dom";
import { jauntSpacing, jauntTypography } from "../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    justifyItems: "start",
    alignContent: "start",
    maxWidth: "54rem",
    margin: "0 auto",
    padding: `${jauntSpacing[8]} ${jauntSpacing[5]}`,
    rowGap: jauntSpacing[4],
  },
  title: {
    maxWidth: "14ch",
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.display,
    lineHeight: jauntTypography.lineHeight.tight,
  },
  body: {
    maxWidth: "42rem",
    fontSize: jauntTypography.size.bodyLarge,
    lineHeight: jauntTypography.lineHeight.reading,
  },
  action: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "2.625rem",
    padding: `0 ${jauntSpacing[4]}`,
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    fontWeight: jauntTypography.weight.semibold,
    textDecorationLine: "none",
    borderRadius: tokens.borderRadiusMedium,
    ":hover": {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  compact: {
    "@media (max-width: 48.75rem)": {
      padding: `${jauntSpacing[7]} ${jauntSpacing[4]}`,
    },
    "@media (max-width: 30rem)": {
      fontSize: jauntTypography.size.title,
    },
  },
});

export default function RoutePlaceholderPage({
  actionLabel,
  actionTo,
  children,
  title,
}) {
  const styles = useStyles();

  return (
    <section className={styles.root} aria-labelledby="route-page-title">
      <h1 className={`${styles.title} ${styles.compact}`} id="route-page-title">
        {title}
      </h1>
      <Text className={styles.body}>{children}</Text>
      {actionLabel && actionTo ? (
        <Link className={styles.action} to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

RoutePlaceholderPage.propTypes = {
  actionLabel: PropTypes.string,
  actionTo: PropTypes.string,
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

RoutePlaceholderPage.defaultProps = {
  actionLabel: undefined,
  actionTo: undefined,
};
