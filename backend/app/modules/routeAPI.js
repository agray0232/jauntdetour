/**
 * Import the config file
 */
var config = require("../../config/config.js");

/**
 * Import axios
 */
const axios = require("axios");

/**
 * Import polyline encoding utility
 */
const polylineEncoder = require("polyline-encoded");

/**
 * Expose the functions that we need in other files
 *
 * @param input - Origin and destination input recieved from client
 */
module.exports = {
  getRoute: function(input) {
    var promise = new Promise(function(resolve, reject) {
      // Create the URL
      const url = createURL(input);

      // Send an axios GET request to the Google Directions api
      axios
        .get(url)
        .then(response => {
          // Decode and send the response
          var decodedData = decodePolylines(response.data);
          resolve(decodedData);
        })
        .catch(error => {
          console.log(
            "ERROR: Unable to get response from the Google Directions API\n User input may be formatted incorrectly" +
              error.response
          );
          reject(error);
        });
    });

    return promise;
  }
};

/**
 *
 * @param input - Origin and destination input data recieved from the client. Supported types are "address" and "coordinates"
 * @returns - Formatted url call containing origin and destination data
 */
function createURL(input) {
  // Create the base of the url
  let urlBase = `https://maps.googleapis.com/maps/api/directions/json?`;

  // Get the google api key from the configuration
  const key = config.GOOGLE_API_KEY;

  // Grab the origin/destination user input
  var originInput = input.origin;
  var destinationInput = input.destination;

  // Create the empty formatted inputs
  var formattedOrigin = "";
  var formattedDestination = "";

  // Format the user input based on the input type
  switch (input.type) {
    case "Address":
      // Replace spaces with "+"s
      formattedOrigin = originInput.replace(" ", "+");
      formattedDestination = destinationInput.replace(" ", "+");
      break;
    case "Coordinates":
      // Remove spaces and place lat and lon side by side
      formattedOrigin = originInput.lat.replace(" ", "");
      formattedOrigin.concat(",");
      formattedOrigin.concat(originInput.lon.replace(" ", ""));
      break;
    default:
      console.log(
        "ERROR: Unsupported user input\n Input must be address or coordinates in degrees"
      );
  }

  // Create the final url
  const url = `${urlBase}origin=${formattedOrigin}&destination=${formattedDestination}&key=${key}`;

  return url;
}

/**
 * Decodes all of the encoded polyline strings in the routes
 *
 * @param data - Raw data containing encoded polyline strings
 * @return Data containing decoded lat/lon arrays representing the encoded polyline strings
 */
function decodePolylines(data) {
  // Extract the routes
  var decodedData = {
    routes: data.routes
  };

  // For each route option that was returned
  decodedData.routes.forEach(function(route) {
    // Create an empty array to contain the summary
    var routeSummary = [];

    // The route is made of many legs
    route.legs.forEach(function(leg) {
      // Each leg has a series of small steps
      leg.steps.forEach(function(step) {
        // Decode the encoded polyline point string
        step.polyline.decodedPoints = polylineEncoder.decode(
          step.polyline.points
        );
        // Add this leg to the route summary
        routeSummary.push(step.polyline.decodedPoints);
      });
    });
    // Decode the encoded overview polyline point string
    route.overview_polyline.decodedPoints = polylineEncoder.decode(
      route.overview_polyline.points
    );
  });

  return decodedData;
}
