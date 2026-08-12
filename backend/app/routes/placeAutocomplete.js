const express = require("express");
const logger = require("../utils/logger");

const MIN_INPUT_LENGTH = 2;
const MAX_INPUT_LENGTH = 200;

function createPlaceAutocompleteRouter({ placeAutocompleteAPI }) {
  if (!placeAutocompleteAPI?.getSuggestions) {
    throw new Error(
      "createPlaceAutocompleteRouter requires a placeAutocompleteAPI"
    );
  }

  const router = express.Router();

  router.get("/", async (req, res) => {
    const input =
      typeof req.query.input === "string" ? req.query.input.trim() : "";
    if (input.length < MIN_INPUT_LENGTH || input.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({
        error: `Input must be between ${MIN_INPUT_LENGTH} and ${MAX_INPUT_LENGTH} characters`,
      });
    }

    try {
      const suggestions = await placeAutocompleteAPI.getSuggestions(input);
      return res.json({ suggestions });
    } catch (error) {
      logger.error("GET /api/places/autocomplete failed", {
        message: error.message,
        status: error.response?.status,
      });
      return res
        .status(502)
        .json({ error: "Failed to load place suggestions" });
    }
  });

  return router;
}

module.exports = createPlaceAutocompleteRouter;
