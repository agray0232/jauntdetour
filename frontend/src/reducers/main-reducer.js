let initialState = {
  origin: "",
  destination: "",
  route: [],
  routeOptions: [],
  showRoute: false,
  showHikesButton: false
};

const mainReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_ORIGIN":
      return {
        ...state,
        origin: action.data.origin
      };
    case "SET_DESTINATION":
      return {
        ...state,
        destination: action.data.destination
      };
    case "SET_ROUTE":
      return {
        ...state,
        showRoute: true,
        showHikesButton: true,
        route: action.data.route
      };
    default:
      return state;
  }
};

export default mainReducer;
