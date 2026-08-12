import axios from "axios";
import config from "../config/config.js";
import log from "../utils/logger";

export default class PlaceAutocompleteRequester {
  getUrlBase() {
    return config.BACKEND_URL;
  }

  getSuggestions(input) {
    return axios
      .get(this.getUrlBase() + "/api/places/autocomplete", {
        params: { input },
      })
      .then((response) => response.data.suggestions || [])
      .catch((error) => {
        log.error("Failed to load place suggestions:", error);
        throw error;
      });
  }
}
