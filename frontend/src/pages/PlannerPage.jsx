import React from "react";
import { makeStyles } from "@fluentui/react-components";
import MainContainer from "../containers/MainContainer";

const useStyles = makeStyles({
  root: {
    position: "relative",
    height: "100%",
    minHeight: 0,
  },
  visuallyHidden: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
  },
});

export default function PlannerPage() {
  const styles = useStyles();

  return (
    <section className={styles.root} aria-labelledby="planner-page-title">
      <h1 className={styles.visuallyHidden} id="planner-page-title">
        Plan a Jaunt
      </h1>
      <MainContainer />
    </section>
  );
}
