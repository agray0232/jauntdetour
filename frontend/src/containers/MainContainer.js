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
    getDetourForm: () =>
      dispatch({
        type: "GET_DETOUR_FORM"
      }),
    setDetourLocation: detourLocation =>
      dispatch({
        type: "SET_DETOUR_LOCATION",
        data: {
          detourLocation: detourLocation
        }
      }),
    setDetourRadius: detourRadius =>
      dispatch({
        type: "SET_DETOUR_RADIUS",
        data: {
          detourRadius: detourRadius
        }
      })
  };
};

export default connect(
  matchStateToProps,
  matchDispatchToProps
)(Main);
