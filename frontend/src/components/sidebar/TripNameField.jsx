import React from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { Field, Input, makeStyles } from "@fluentui/react-components";
import { jauntSpacing } from "../../design-system/tokens";

const useStyles = makeStyles({
  root: {
    padding: `${jauntSpacing[5]} ${jauntSpacing[4]} 0`,
  },
  embedded: {
    padding: 0,
  },
  input: {
    width: "100%",
  },
});

/**
 * TripNameField — the editable trip name, shown above the trip timeline.
 *
 * Reads/writes Redux `tripName` directly so it can sit anywhere in the sidebar
 * without prop threading. When a saved trip is loaded its name populates here;
 * the value is picked up by SaveTrip when saving/updating.
 */
export default function TripNameField({ embedded = false }) {
  const styles = useStyles();
  const tripName = useSelector((state) => state.tripName);
  const dispatch = useDispatch();

  return (
    <div className={`${styles.root} ${embedded ? styles.embedded : ""}`}>
      <Field label="Jaunt name">
        <Input
          size="large"
          className={styles.input}
          value={tripName || ""}
          placeholder="e.g. Carolinas weekend"
          onChange={(event) =>
            dispatch({
              type: "SET_TRIP_NAME",
              data: { tripName: event.target.value },
            })
          }
        />
      </Field>
    </div>
  );
}

TripNameField.propTypes = {
  embedded: PropTypes.bool,
};
