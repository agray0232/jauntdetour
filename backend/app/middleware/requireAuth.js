/**
 * requireAuth — session-based authorization middleware.
 *
 * The server session is the authorization boundary: a successful sign-in stores
 * the user's primary key in `req.session.userId`. This middleware promotes that
 * value to `req.userId` for downstream handlers (so they never read the session
 * directly) and rejects unauthenticated requests with 401.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = requireAuth;
