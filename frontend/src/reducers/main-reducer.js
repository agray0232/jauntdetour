let initialState = {
  origin: "",
  destination: "",
  route: [],
  routeOptions: [],
  detourOptions: [],
  detourLocation: 50,
  detourRadius: 20000,
  showRoute: false,
  showDetourButton: false,
  showDetourForm: false,
  showDetourOptions: false,
  showDetourPoint: false
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
        showDetourForm: true,
        showDetourPoint: true
      };
    case "SET_DETOUR_LOCATION":
      return {
        ...state,
        detourLocation: action.data.detourLocation
      };
    case "SET_DETOUR_RADIUS":
      return {
        ...state,
        detourRadius: action.data.detourRadius
      };
    case "SET_DETOUR_OPTIONS":
      return {
        ...state,
        detourOptions: action.data.detourOptions,
        showDetourOptions: true
      };
    case "CLEAR_DETOUR_OPTIONS":
      return {
        ...state,
        detourOptions: [],
        detourRadius: 0,
        showDetourOptions: false,
        showDetourForm: false,
        showDetourOptions: false
      };
    default:
      return state;
  }
};

export default mainReducer;
