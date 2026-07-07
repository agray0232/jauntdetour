let initialState = {
  user: null,
  origin: "",
  destination: "",
  // The name the user has given the in-progress trip (bound to the sidebar
  // name field). currentTrip identifies which saved trip, if any, is loaded —
  // null means an unsaved/new trip. Both persist to sessionStorage (see
  // index.js) so they survive the sign-in redirect.
  tripName: "",
  currentTrip: null,
  // Bumped whenever a trip is created/updated/deleted/duplicated so an open
  // "My Trips" list can refresh itself without being closed and reopened.
  tripsRevision: 0,
  detourType: "Hike",
  detourList: [],
  tripSummary: {},
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
  showDetourSearchPoint: false,
};

const mainReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.data.user,
      };
    case "CLEAR_USER":
      return {
        ...state,
        user: null,
      };
    case "SET_ORIGIN":
      return {
        ...state,
        origin: action.data.origin,
      };
    case "SET_DESTINATION":
      return {
        ...state,
        destination: action.data.destination,
      };
    case "SET_TRIP_NAME":
      return {
        ...state,
        tripName: action.data.tripName,
      };
    case "SET_CURRENT_TRIP":
      return {
        ...state,
        currentTrip: action.data.currentTrip,
      };
    case "BUMP_TRIPS_REVISION":
      return {
        ...state,
        tripsRevision: (state.tripsRevision || 0) + 1,
      };
    case "SET_ROUTE":
      return {
        ...state,
        showRoute: true,
        showDetourButton: true,
        route: action.data.route,
      };
    case "SET_TRIP_SUMMARY":
      return {
        ...state,
        tripSummary: action.data.tripSummary,
      };
    case "GET_DETOUR_FORM":
      return {
        ...state,
        detourType: "Hike",
        showDetourForm: true,
        showDetourSearchPoint: true,
      };
    case "SET_DETOUR_TYPE":
      return {
        ...state,
        detourType: action.data.detourType,
      };
    case "SET_DETOUR_SEARCH_LOCATION":
      return {
        ...state,
        detourSearchLocation: action.data.detourSearchLocation,
      };
    case "SET_DETOUR_SEARCH_RADIUS":
      return {
        ...state,
        detourSearchRadius: action.data.detourSearchRadius,
      };
    case "SET_DETOUR_OPTIONS":
      return {
        ...state,
        detourOptions: action.data.detourOptions,
        showDetourOptions: true,
      };
    case "SET_DETOUR_HIGHLIGHT":
      return {
        ...state,
        detourHighlight: action.data.detourHighlight,
      };
    case "CLEAR_DETOUR_OPTIONS":
      return {
        ...state,
        detourOptions: [],
        detourRadius: 0,
        showDetourForm: false,
        showDetourOptions: false,
        showDetourSearchPoint: false,
      };
    case "ADD_DETOUR":
      return {
        ...state,
        detourList: [...state.detourList, action.data.detour],
      };
    case "REMOVE_DETOUR":
      var newDetourList = state.detourList.filter(function (detour, index) {
        return index !== action.data.index;
      });
      return {
        ...state,
        detourList: newDetourList,
      };
    case "SET_DETOUR_LIST":
      return {
        ...state,
        detourList: action.data.detourList,
      };
    case "CLEAR_ALL":
      return {
        user: state.user,
        origin: "",
        destination: "",
        tripName: "",
        currentTrip: null,
        // Preserve the revision counter so clearing the planner doesn't look
        // like a trip mutation to an open list.
        tripsRevision: state.tripsRevision,
        detourType: "Hike",
        detourList: [],
        tripSummary: {},
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
        showDetourSearchPoint: false,
      };
    default:
      return state;
  }
};

export default mainReducer;
