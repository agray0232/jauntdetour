import React from "react";
import PropTypes from "prop-types";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";
import RouteSummary from "./RouteSummary";
import JauntItinerary from "./JauntItinerary";
import SaveTrip from "../../sidebar/SaveTrip";
import { jauntSpacing } from "../../../design-system/tokens";

const useStyles = makeStyles({
  saveSection: {
    display: "grid",
    marginTop: jauntSpacing[5],
    padding: `${jauntSpacing[4]} ${jauntSpacing[4]} ${jauntSpacing[5]}`,
    rowGap: jauntSpacing[3],
    ...shorthands.borderTop("1px", "solid", tokens.colorNeutralStroke1),
  },
});

export default function BuildRouteDetails(props) {
  const styles = useStyles();

  if (!props.tripSummary || Object.keys(props.tripSummary).length === 0) {
    return null;
  }

  return (
    <div>
      <RouteSummary
        tripSummary={props.tripSummary}
        onEditRoute={props.onEditRoute}
      />
      <JauntItinerary
        origin={props.origin}
        destination={props.destination}
        detourList={props.detourList}
        failedMutation={props.failedMutation}
        onDiscover={props.onDiscover}
        pending={props.pending}
        actionsBusy={props.actionsBusy}
        retryMutation={props.retryMutation}
        runMutation={props.runMutation}
      />
      <div className={styles.saveSection}>
        <SaveTrip
          embedded
          onClear={props.onClear}
          onStatusChange={props.onSaveStateChange}
        />
      </div>
    </div>
  );
}

BuildRouteDetails.propTypes = {
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  detourList: PropTypes.array.isRequired,
  failedMutation: PropTypes.object,
  onClear: PropTypes.func.isRequired,
  onDiscover: PropTypes.func.isRequired,
  onEditRoute: PropTypes.func.isRequired,
  onSaveStateChange: PropTypes.func.isRequired,
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  pending: PropTypes.object,
  actionsBusy: PropTypes.bool,
  retryMutation: PropTypes.func.isRequired,
  runMutation: PropTypes.func.isRequired,
  tripSummary: PropTypes.object,
};
