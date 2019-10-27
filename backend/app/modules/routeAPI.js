/**
 * Import the config file
 */
var config = require("../../config/config.js");

/**
 * Import axios
 */
const axios = require("axios");

/**
 * Import polyline encoding utlity
 */
const polylineEncoder = require("polyline-encoded");

/**
 * Expose the functions that we need in other files
 */
module.exports = {
  getRoute: function() {
    var promise = new Promise(function(resolve, reject) {
      // Get the google api key from the configuration
      const key = config.GOOGLE_API_KEY;

      // Create the URL
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=Disneyland&destination=Universal+Studios+Hollywood&key=${key}`;

      axios
        .get(url)
        .then(response => {
          var decodedData = decodePolylines(response.data);
          resolve(decodedData);
        })
        .catch(error => {
          console.log("error");
          console.error(error.response);
          reject(error);
        });
    });

    return promise;
  }
};

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

  // Format each route
  decodedData.routes.forEach(function(route) {
    // Format each leg
    route.legs.forEach(function(leg) {
      // Format each step
      leg.steps.forEach(function(step) {
        // Decode the encoded polyline point string
        step.polyline.decodedPoints = polylineEncoder.decode(
          step.polyline.points
        );
      });
    });
    // Decode the encoded overview polyline point string
    route.overview_polyline.decodedPoints = polylineEncoder.decode(
      route.overview_polyline.points
    );
  });

  return decodedData;
}
