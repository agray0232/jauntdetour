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
          resolve(response.data);
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
