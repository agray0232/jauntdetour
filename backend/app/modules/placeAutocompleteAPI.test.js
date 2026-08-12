jest.mock("axios");

const axios = require("axios");
const config = require("../../config/config.js");
const placeAutocompleteAPI = require("./placeAutocompleteAPI");

describe("placeAutocompleteAPI", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requests and normalizes place predictions", async () => {
    axios.post.mockResolvedValue({
      data: {
        suggestions: [
          {
            placePrediction: {
              placeId: "place-ohio",
              text: { text: "Ashland, OH, USA" },
              structuredFormat: {
                mainText: { text: "Ashland" },
                secondaryText: { text: "OH, USA" },
              },
            },
          },
          { queryPrediction: { text: { text: "Ashland hotels" } } },
        ],
      },
    });

    await expect(
      placeAutocompleteAPI.getSuggestions("Ashland")
    ).resolves.toEqual([
      {
        placeId: "place-ohio",
        text: "Ashland, OH",
        mainText: "Ashland",
        secondaryText: "OH",
      },
    ]);
    expect(axios.post).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:autocomplete",
      { input: "Ashland" },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.GOOGLE_API_KEY,
          "X-Goog-FieldMask": expect.stringContaining(
            "suggestions.placePrediction.placeId"
          ),
        },
      }
    );
  });

  it("preserves countries outside the United States", async () => {
    axios.post.mockResolvedValue({
      data: {
        suggestions: [
          {
            placePrediction: {
              placeId: "place-ontario",
              text: { text: "London, ON, Canada" },
              structuredFormat: {
                mainText: { text: "London" },
                secondaryText: { text: "ON, Canada" },
              },
            },
          },
        ],
      },
    });

    await expect(
      placeAutocompleteAPI.getSuggestions("London")
    ).resolves.toEqual([
      {
        placeId: "place-ontario",
        text: "London, ON, Canada",
        mainText: "London",
        secondaryText: "ON, Canada",
      },
    ]);
  });

  it("returns an empty list when Google has no predictions", async () => {
    axios.post.mockResolvedValue({ data: {} });

    await expect(placeAutocompleteAPI.getSuggestions("zzzz")).resolves.toEqual(
      []
    );
  });

  it("limits normalized predictions to five results", async () => {
    axios.post.mockResolvedValue({
      data: {
        suggestions: Array.from({ length: 6 }, (_, index) => ({
          placePrediction: {
            placeId: `place-${index}`,
            text: { text: `Place ${index}` },
          },
        })),
      },
    });

    const result = await placeAutocompleteAPI.getSuggestions("Place");

    expect(result).toHaveLength(5);
  });

  it("propagates Google request failures", async () => {
    axios.post.mockRejectedValue(new Error("Google unavailable"));

    await expect(
      placeAutocompleteAPI.getSuggestions("Ashland")
    ).rejects.toThrow("Google unavailable");
  });
});
