import axios from "axios";
import config from "../config/config.js";

export default class DetourRequester {
  getDetours(lat, lng, radius, type) {
    // Initialize the parameters to pass in
    var parameters = {
      searchText: type,
      lat: lat,
      lng: lng,
      radius: radius
    };

    // Get the url base
    var requestURL = this.getUrlBase() + "/places";

    var promise = new Promise(function(resolve, reject) {
      // Send an axios GET request to the server
      axios
        .get(requestURL, {
          headers: {
            "Content-Type": "application/json"
          },
          params: parameters
        })
        .then(response => {
          // Decode and send the response
          resolve(response.data);
        })
        .catch(error => {
          console.log(
            "ERROR: Unable to get response from the server\n User input may be formatted incorrectly" +
              error.response
          );
          reject(error);
        });
    });

    return promise;
  }

  /**
   * Sets the URL base based on the environment
   *
   * @returns - URL base for axios request
   */
  getUrlBase() {
    var urlBase = "";

    switch (config.NODE_ENV) {
      case "development":
        urlBase = "http://localhost:8080";
        break;
      case "environment":
        urlBase = "https://www.jauntdetour.com/backend";
        break;
      default:
        urlBase = "https://www.jauntdetour.com/backend";
    }

    return urlBase;
  }
}
