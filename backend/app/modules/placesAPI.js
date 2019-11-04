/**
 * Import the config file
 */
var config = require("../../config/config.js");

/**
 * Import axios
 */
const axios = require("axios");

/**
 * Expose the functions that we need in other files
 *
 * @param input - Place search text and parameters received from client
 */
module.exports = {
  getPlaces: function(input) {
    var promise = new Promise(function(resolve, reject) {
      // Create the URL
      const url = createURL(input);

      // Send an axios GET request to the Google Places api
      axios
        .get(url)
        .then(response => {
          resolve(response.data);
        })
        .catch(error => {
          console.log(
            "ERROR: Unable to get response from the Google Places API\n User input may be formatted incorrectly" +
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
 * @param input - Search text and location data recieved from client
 * @returns - Formatted url call containing origin and destination data
 */
function createURL(input) {
  // Create the base of the url
  let urlBase = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?`;

  // Get the google api key from the configuration
  const key = config.GOOGLE_API_KEY;

  // Grab the user input
  var searchText = input.searchText;
  var lat = input.lat;
  var lng = input.lng;
  var radius = input.radius;

  // Format the input
  var formattedSearchText = searchText.replace(" ", "%20");
  //var fields = "photos,formatted_address,name,opening_hours,rating";
  var location = `${lat},${lng}`;

  // Create the final url
  const url = `${urlBase}location=${location}&radius=${radius}&keyword=${formattedSearchText}&key=${key}`;

  return url;
}
