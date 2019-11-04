import axios from "axios";

export default class DetourRequester {
  getDetours(lat, lng, radius, type) {
    // Initialize the parameters to pass in
    var parameters = {
      searchText: type,
      lat: lat,
      lng: lng,
      radius: radius
    };

    var promise = new Promise(function(resolve, reject) {
      // Send an axios GET request to the server
      axios
        .get("http://localhost:3001/places", {
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
}
