import axios from "axios";
import config from "../config/config.js";

export default class RouteRequester {
  getRoute(origin, destination, type, opts) {
    // Get the parameters
    var parameters = this.getParameters(origin, destination, type, opts);
    // Get the request URL
    var requestURL = this.getUrlBase() + "/route";

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
   * Creates the parameter object to pass in with the axios request
   *
   * @param {*} origin - Origin of the route
   * @param {*} destination - Destination of the route
   * @param {*} type - The origin/destination id type
   * @param {*} opts - Optional parameters
   *
   * @returns - Parameter object to set the axios 'params' key
   */
  getParameters(origin, destination, type, opts) {
    var parameters = {};

    // Switch on if this is an address or coordinates
    switch (type) {
      case "Address":
        parameters = {
          type: "Address",
          origin: origin,
          destination: destination
        };
        if (opts["waypoints"]) {
          parameters.waypoints = opts.waypoints;
        }
        break;

      case "Coordinates":
        break;

      default:
    }

    return parameters;
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
    }

    return urlBase;
  }
}
