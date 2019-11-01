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
      })
  };
};

export default connect(
  matchStateToProps,
  matchDispatchToProps
)(Main);
