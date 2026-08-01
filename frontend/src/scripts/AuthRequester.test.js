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

  it("still redirects when setting the logout flag throws", async () => {
    axios.post.mockResolvedValue({
      data: { logoutUrl: "http://entra.test/logout" },
    });
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage disabled");
      });

    try {
      await new AuthRequester().logout();

      expect(window.location.assign).toHaveBeenCalledWith(
        "http://entra.test/logout"
      );
    } finally {
      setItemSpy.mockRestore();
    }
  });
});

describe("AuthRequester.login", () => {
  let originalLocation;

  beforeEach(() => {
    sessionStorage.clear();
    originalLocation = window.location;
    delete window.location;
    window.location = {
      assign: jest.fn(),
      hash: "",
      origin: "http://localhost",
      pathname: "/",
      search: "",
    };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("stores a safe return path before starting sign in", () => {
    new AuthRequester().login("/trips?page=2");

    expect(sessionStorage.getItem("jaunt.authReturnPath")).toBe(
      "/trips?page=2"
    );
    expect(window.location.assign).toHaveBeenCalledWith(
      "http://backend.test/auth/login"
    );
  });

  it("does not store an external return URL", () => {
    new AuthRequester().login("https://example.com/steal-session");

    expect(sessionStorage.getItem("jaunt.authReturnPath")).toBeNull();
  });
});
