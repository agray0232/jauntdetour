import axios from "axios";
import config from "../config/config.js";
import log from "../utils/logger";

export default class DetourRequester {
  getDetours(lat, lng, radius, type) {
    // Initialize the parameters to pass in
    var parameters = {
      searchText: type,
      lat: lat,
      lng: lng,
      radius: radius,
    };

    // Get the url base
    var requestURL = this.getUrlBase() + "/places";

    var promise = new Promise(function (resolve, reject) {
      // Send an axios GET request to the server
      axios
        .get(requestURL, {
          headers: {
            "Content-Type": "application/json",
          },
          params: parameters,
        })
        .then((response) => {
          // Decode and send the response
          resolve(response.data);
        })
        .catch((error) => {
          log.error(
            "Unable to get response from the server. User input may be formatted incorrectly:",
            error.response
          );
          reject(error);
        });
    });

    return promise;
  }

  /**
   * Returns the configured backend URL.
   *
   * @returns - URL base for axios request
   */
  getUrlBase() {
    return config.BACKEND_URL;
  }
}
