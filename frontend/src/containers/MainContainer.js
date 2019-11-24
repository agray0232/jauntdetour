import Main from "../components/Main";
import { connect } from "react-redux";

let matchStateToProps = state => {
  return { ...state };
};

let matchDispatchToProps = dispatch => {
  return {
    setOrigin: origin =>
      dispatch({
        type: "SET_ORIGIN",
        data: {
          origin: origin
        }
      }),
    setDestination: destination =>
      dispatch({
        type: "SET_DESTINATION",
        data: {
          destination: destination
        }
      }),
    setRoute: route =>
      dispatch({
        type: "SET_ROUTE",
        data: {
          route: route
        }
      }),
    setTripSummary: summary =>
      dispatch({
        type: "SET_TRIP_SUMMARY",
        data: {
          tripSummary: summary
        }
      }),
    getDetourForm: () =>
      dispatch({
        type: "GET_DETOUR_FORM"
      }),
    setDetourType: detourType =>
      dispatch({
        type: "SET_DETOUR_TYPE",
        data: {
          detourType: detourType
        }
      }),
    setDetourSearchLocation: detourSearchLocation =>
      dispatch({
        type: "SET_DETOUR_SEARCH_LOCATION",
        data: {
          detourSearchLocation: detourSearchLocation
        }
      }),
    setDetourSearchRadius: detourSearchRadius =>
      dispatch({
        type: "SET_DETOUR_SEARCH_RADIUS",
        data: {
          detourSearchRadius: detourSearchRadius
        }
      }),
    setDetourOptions: detourOptions =>
      dispatch({
        type: "SET_DETOUR_OPTIONS",
        data: {
          detourOptions: detourOptions
        }
      }),
    setDetourHighlight: detourHighlight =>
      dispatch({
        type: "SET_DETOUR_HIGHLIGHT",
        data: {
          detourHighlight: detourHighlight
        }
      }),
    clearDetourOptions: () =>
      dispatch({
        type: "CLEAR_DETOUR_OPTIONS"
      }),
    addDetour: detour =>
      dispatch({
        type: "ADD_DETOUR",
        data: {
          detour: detour
        }
      }),
    removeDetour: index =>
      dispatch({
        type: "REMOVE_DETOUR",
        data: {
          index: index
        }
      }),
    setDetourList: detourList =>
      dispatch({
        type: "SET_DETOUR_LIST",
        data: {
          detourList: detourList
        }
      }),
    clearAll: () =>
      dispatch({
        type: "CLEAR_ALL"
      })
  };
};

export default connect(matchStateToProps, matchDispatchToProps)(Main);
