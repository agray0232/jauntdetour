let initialState = {
  origin: "",
  destination: "",
  detourList: [],
  baseTripSummary: {},
  route: [],
  routeOptions: [],
  detourOptions: [],
  detourHighlight: [],
  detourSearchLocation: 50,
  detourSearchRadius: 20000,
  showRoute: false,
  showDetourButton: false,
  showDetourForm: false,
  showDetourOptions: false,
  showDetourSearchPoint: false
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
    case "SET_BASE_TRIP_SUMMARY":
      return {
        ...state,
        baseTripSummary: action.data.baseTripSummary
      };
    case "GET_DETOUR_FORM":
      return {
        ...state,
        showDetourForm: true,
        showDetourSearchPoint: true
      };
    case "SET_DETOUR_SEARCH_LOCATION":
      return {
        ...state,
        detourSearchLocation: action.data.detourSearchLocation
      };
    case "SET_DETOUR_SEARCH_RADIUS":
      return {
        ...state,
        detourSearchRadius: action.data.detourSearchRadius
      };
    case "SET_DETOUR_OPTIONS":
      return {
        ...state,
        detourOptions: action.data.detourOptions,
        showDetourOptions: true
      };
    case "SET_DETOUR_HIGHLIGHT":
      return {
        ...state,
        detourHighlight: action.data.detourHighlight
      };
    case "CLEAR_DETOUR_OPTIONS":
      return {
        ...state,
        detourOptions: [],
        detourRadius: 0,
        showDetourOptions: false,
        showDetourForm: false,
        showDetourOptions: false,
        showDetourSearchPoint: false
      };
    case "ADD_DETOUR":
      return {
        ...state,
        detourList: [...state.detourList, action.data.detour]
      };
    case "REMOVE_DETOUR":
      var newDetourList = state.detourList.filter(function(detour, index) {
        return index != action.data.index;
      });
      return {
        ...state,
        detourList: newDetourList
      };
    case "CLEAR_ALL":
      return {
        origin: "",
        destination: "",
        detourList: [],
        baseTripSummary: {},
        route: [],
        routeOptions: [],
        detourOptions: [],
        detourHighlight: [],
        detourSearchLocation: 50,
        detourSearchRadius: 20000,
        showRoute: false,
        showDetourButton: false,
        showDetourForm: false,
        showDetourOptions: false,
        showDetourSearchPoint: false
      };
    default:
      return state;
  }
};

export default mainReducer;
