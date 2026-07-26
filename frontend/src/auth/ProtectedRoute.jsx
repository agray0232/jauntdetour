import React from "react";
import PropTypes from "prop-types";
import { Button, Spinner, Text, makeStyles } from "@fluentui/react-components";
import { useLocation } from "react-router-dom";
import { useAuthSession } from "./AuthSessionProvider";
import { jauntSpacing, jauntTypography } from "../design-system/tokens";

const useStyles = makeStyles({
  root: {
    display: "grid",
    justifyItems: "start",
    alignContent: "start",
    maxWidth: "42rem",
    margin: "0 auto",
    padding: `${jauntSpacing[7]} ${jauntSpacing[5]}`,
    rowGap: jauntSpacing[4],
  },
  title: {
    margin: 0,
    fontFamily: jauntTypography.family.editorial,
    fontSize: jauntTypography.size.title,
    lineHeight: jauntTypography.lineHeight.tight,
  },
});

export default function ProtectedRoute({ children, title }) {
  const styles = useStyles();
  const location = useLocation();
  const { status, signIn } = useAuthSession();

  if (status === "checking") {
    return (
      <div className={styles.root} role="status">
        <Spinner label="Checking your account..." />
      </div>
    );
  }

  if (status === "signedOut") {
    const returnPath = `${location.pathname}${location.search}${location.hash}`;
    return (
      <section className={styles.root} aria-labelledby="sign-in-required-title">
        <h1 className={styles.title} id="sign-in-required-title">
          Sign in to view {title}
        </h1>
        <Text>
          Your in-progress Jaunt will stay in this browser while you sign in.
        </Text>
        <Button appearance="primary" onClick={() => signIn(returnPath)}>
          Sign in
        </Button>
      </section>
    );
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};
