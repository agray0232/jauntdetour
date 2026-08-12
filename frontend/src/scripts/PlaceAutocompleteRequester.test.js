import axios from "axios";
import config from "../config/config.js";
import PlaceAutocompleteRequester from "./PlaceAutocompleteRequester";
import log from "../utils/logger";

jest.mock("axios");
jest.mock("../utils/logger", () => ({ error: jest.fn() }));

describe("PlaceAutocompleteRequester", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requests and returns normalized suggestions", async () => {
    const suggestions = [{ placeId: "place-ohio", text: "Ashland, OH, USA" }];
    axios.get.mockResolvedValue({ data: { suggestions } });
    const requester = new PlaceAutocompleteRequester();

    await expect(requester.getSuggestions("Ashland")).resolves.toEqual(
      suggestions
    );
    expect(axios.get).toHaveBeenCalledWith(
      config.BACKEND_URL + "/api/places/autocomplete",
      { params: { input: "Ashland" } }
    );
  });

  it("returns an empty list when suggestions are omitted", async () => {
    axios.get.mockResolvedValue({ data: {} });

    await expect(
      new PlaceAutocompleteRequester().getSuggestions("zzzz")
    ).resolves.toEqual([]);
  });

  it("logs and propagates request failures", async () => {
    const error = new Error("offline");
    axios.get.mockRejectedValue(error);

    await expect(
      new PlaceAutocompleteRequester().getSuggestions("Ashland")
    ).rejects.toThrow("offline");
    expect(log.error).toHaveBeenCalledWith(
      "Failed to load place suggestions:",
      error
    );
  });
});
