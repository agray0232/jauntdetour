let initialState = {
  origin: "",
  destination: "",
  route: [],
  routeOptions: [],
  detourLocation: 0,
  detourRadius: 0,
  showRoute: false,
  showDetourButton: false,
  showDetourForm: false
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
        showDetourButton: true,
        route: action.data.route
      };
    case "GET_DETOUR_FORM":
      return {
        ...state,
        showDetourForm: true
      };
    default:
      return state;
  }
};

export default mainReducer;
