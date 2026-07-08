import axios from "axios";
import AuthRequester from "./AuthRequester";

jest.mock("axios");

jest.mock("../utils/logger", () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../config/config.js", () => ({
  BACKEND_URL: "http://backend.test",
}));

describe("AuthRequester.logout", () => {
  let originalLocation;

  beforeEach(() => {
    sessionStorage.clear();
    // jsdom's window.location.assign is not implemented, so swap in a mock.
    originalLocation = window.location;
    delete window.location;
    window.location = { assign: jest.fn(), reload: jest.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("flags a pending logout and redirects to the Entra logout URL on success", async () => {
    axios.post.mockResolvedValue({
      data: { logoutUrl: "http://entra.test/logout" },
    });

    await new AuthRequester().logout();

    expect(sessionStorage.getItem("jaunt.pendingLogout")).toBe("1");
    expect(window.location.assign).toHaveBeenCalledWith(
      "http://entra.test/logout"
    );
  });

  it("flags a pending logout and reloads when no logout URL is returned", async () => {
    axios.post.mockResolvedValue({ data: {} });

    await new AuthRequester().logout();

    expect(sessionStorage.getItem("jaunt.pendingLogout")).toBe("1");
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("does not flag a logout when the request fails", async () => {
    axios.post.mockRejectedValue(new Error("network down"));

    await new AuthRequester().logout();

    expect(sessionStorage.getItem("jaunt.pendingLogout")).toBeNull();
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
