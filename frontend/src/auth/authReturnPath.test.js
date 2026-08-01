import {
  AUTH_RETURN_PATH_KEY,
  consumeAuthReturnPath,
  getSafeReturnPath,
  rememberAuthReturnPath,
} from "./authReturnPath";

describe("auth return paths", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/plan?task=discover#results");
  });

  it.each([
    ["https://example.com/account"],
    ["//example.com/account"],
    [["javascript", "alert(1)"].join(":")],
    ["account"],
    [null],
  ])("rejects unsafe or non-application path %p", (value) => {
    expect(getSafeReturnPath(value)).toBeNull();
  });

  it("preserves a same-origin path, query, and hash", () => {
    expect(getSafeReturnPath("/trips/123?from=list#summary")).toBe(
      "/trips/123?from=list#summary"
    );
  });

  it("stores the current application path by default", () => {
    expect(rememberAuthReturnPath()).toBe("/plan?task=discover#results");
    expect(sessionStorage.getItem(AUTH_RETURN_PATH_KEY)).toBe(
      "/plan?task=discover#results"
    );
  });

  it("consumes a stored path only once", () => {
    sessionStorage.setItem(AUTH_RETURN_PATH_KEY, "/account");

    expect(consumeAuthReturnPath()).toBe("/account");
    expect(consumeAuthReturnPath()).toBeNull();
  });
});
