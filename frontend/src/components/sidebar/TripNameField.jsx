import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Field, Input } from "@fluentui/react-components";

/**
 * TripNameField — the editable trip name, shown above the trip timeline.
 *
 * Reads/writes Redux `tripName` directly so it can sit anywhere in the sidebar
 * without prop threading. When a saved trip is loaded its name populates here;
 * the value is picked up by SaveTrip when saving/updating.
 */
export default function TripNameField() {
  const tripName = useSelector((state) => state.tripName);
  const dispatch = useDispatch();

  return (
    <div className="trip-name-section">
      <Field className="trip-name-field" label="Trip name">
        <Input
          size="large"
          className="trip-name-input"
          value={tripName || ""}
          placeholder="e.g. Coastal weekend"
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
