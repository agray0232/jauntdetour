var config = require("../../config/config.js");
const axios = require("axios");

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const FIELD_MASK = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text.text",
  "suggestions.placePrediction.structuredFormat.mainText.text",
  "suggestions.placePrediction.structuredFormat.secondaryText.text",
].join(",");

function formatLocationLabel(value) {
  return (value || "").replace(/,?\s+USA$/i, "");
}

function normalizeSuggestions(data) {
  return (data.suggestions || [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction) => prediction && prediction.placeId)
    .slice(0, 5)
    .map((prediction) => ({
      placeId: prediction.placeId,
      text: formatLocationLabel(prediction.text?.text),
      mainText: prediction.structuredFormat?.mainText?.text || "",
      secondaryText: formatLocationLabel(
        prediction.structuredFormat?.secondaryText?.text
      ),
    }));
}

async function getSuggestions(input) {
  const response = await axios.post(
    AUTOCOMPLETE_URL,
    { input },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": config.GOOGLE_API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    }
  );

  return normalizeSuggestions(response.data);
}

module.exports = { getSuggestions };
