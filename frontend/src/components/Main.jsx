import React from "react";
import PropTypes from "prop-types";
import PlannerWorkspace from "./planner/PlannerWorkspace";

function Main(props) {
  return <PlannerWorkspace {...props} />;
}

Main.propTypes = {
  origin: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  destination: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  tripSummary: PropTypes.object,
  route: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  detourList: PropTypes.array,
  detourOptions: PropTypes.array,
  detourHighlight: PropTypes.array,
  detourType: PropTypes.string,
  detourSearchLocation: PropTypes.number,
  detourSearchRadius: PropTypes.number,
  showRoute: PropTypes.bool,
  showDetourButton: PropTypes.bool,
  showDetourForm: PropTypes.bool,
  showDetourOptions: PropTypes.bool,
  showDetourSearchPoint: PropTypes.bool,
  setOrigin: PropTypes.func,
  setDestination: PropTypes.func,
  setRoute: PropTypes.func,
  setTripSummary: PropTypes.func,
  setTripName: PropTypes.func,
  setDetourType: PropTypes.func,
  setDetourSearchLocation: PropTypes.func,
  setDetourSearchRadius: PropTypes.func,
  setDetourOptions: PropTypes.func,
  setDetourHighlight: PropTypes.func,
  setDetourList: PropTypes.func,
  addDetour: PropTypes.func,
  removeDetour: PropTypes.func,
  getDetourForm: PropTypes.func,
  clearAll: PropTypes.func,
  clearDetourOptions: PropTypes.func,
  user: PropTypes.object,
  setUser: PropTypes.func,
  clearUser: PropTypes.func,
};

export default Main;
