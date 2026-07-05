const requireAuth = require("./requireAuth");

describe("requireAuth", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { session: {} };
    res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    next = jest.fn();
  });

  it("promotes session.userId to req.userId and calls next when authenticated", () => {
    req.session.userId = "user-123";

    requireAuth(req, res, next);

    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  it("responds 401 when there is no session", () => {
    req.session = undefined;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("responds 401 when the session has no userId", () => {
    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});
