/**
 * Authentication routes — Entra External ID OAuth 2.0 (authorization-code + PKCE).
 *
 * A confidential-client, backend-driven flow. The browser is redirected to the
 * Entra hosted pages for sign-up/sign-in; Entra redirects back to /auth/callback
 * with an authorization code, which the server exchanges (with the PKCE verifier
 * and client secret) for tokens. The user is upserted into the local `users`
 * table and their primary key is stored in the server session.
 *
 * Exported as a factory so the UserRepository can be injected (keeps the routes
 * unit-testable with a mock repository and a mocked MSAL client).
 */

const express = require("express");
const {
  msalClient,
  authority,
  redirectUri,
  scopes,
  cryptoProvider,
} = require("../../config/auth");
const logger = require("../utils/logger");

// Where to send the browser after login/logout completes.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

/**
 * @param {object} deps
 * @param {import('../repositories/UserRepository')} deps.userRepository
 * @returns {import('express').Router}
 */
function createAuthRouter({ userRepository }) {
  if (!userRepository) {
    throw new Error("createAuthRouter requires a userRepository");
  }

  const router = express.Router();

  /**
   * Begin sign-in: generate PKCE + state, stash them in the session, and
   * redirect the browser to the Entra authorization endpoint.
   */
  router.get("/login", async (req, res) => {
    try {
      const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
      const state = cryptoProvider.createNewGuid();

      // Persist PKCE verifier + state server-side to validate the callback.
      req.session.pkceVerifier = verifier;
      req.session.authState = state;

      const authCodeUrl = await msalClient.getAuthCodeUrl({
        scopes,
        redirectUri,
        codeChallenge: challenge,
        codeChallengeMethod: "S256",
        state,
      });

      return res.redirect(authCodeUrl);
    } catch (err) {
      logger.error("/auth/login failed", err);
      return res.status(500).json({ error: "Failed to start login" });
    }
  });

  /**
   * Handle the redirect back from Entra: validate state, exchange the code for
   * tokens, upsert the user, and establish the session.
   */
  router.get("/callback", async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }
      if (!state || state !== req.session.authState) {
        logger.warn("/auth/callback: state mismatch");
        return res.status(400).json({ error: "Invalid state" });
      }

      const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes,
        redirectUri,
        codeVerifier: req.session.pkceVerifier,
      });

      const claims = tokenResponse.idTokenClaims || {};
      const externalId = claims.sub;
      const email = claims.email || claims.preferred_username || null;
      const displayName = claims.name || null;

      if (!externalId) {
        logger.error("/auth/callback: ID token missing sub claim");
        return res.status(400).json({ error: "Invalid identity token" });
      }

      // email is NOT NULL (and format-checked) in the users table, so a missing
      // email claim would fail the upsert. Reject before touching the DB.
      if (!email) {
        logger.error("/auth/callback: ID token missing email claim");
        return res.status(400).json({ error: "Invalid identity token" });
      }

      const user = await userRepository.upsertByExternalId({
        externalId,
        email,
        displayName,
      });

      // Clear the one-time login artifacts, then bind the session to the user.
      delete req.session.pkceVerifier;
      delete req.session.authState;
      req.session.userId = user.user_id;

      return res.redirect(FRONTEND_URL);
    } catch (err) {
      logger.error("/auth/callback failed", err);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });

  /**
   * Return the currently authenticated user, or 401 if not signed in. Lets the
   * SPA determine login state on load.
   */
  router.get("/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const user = await userRepository.getUserById(req.session.userId);
      if (!user) {
        // Session references a user that no longer exists — clear it.
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.json({ user });
    } catch (err) {
      logger.error("/auth/me failed", err);
      return res.status(500).json({ error: "Failed to load user" });
    }
  });

  /**
   * Sign out: destroy the local session and redirect to the Entra logout
   * endpoint so the IdP SSO session is also ended (full logout).
   */
  router.post("/logout", (req, res) => {
    const logoutUrl =
      `${authority}/oauth2/v2.0/logout` +
      `?post_logout_redirect_uri=${encodeURIComponent(FRONTEND_URL)}`;

    if (!req.session) {
      return res.json({ logoutUrl });
    }
    req.session.destroy((err) => {
      if (err) {
        logger.error("/auth/logout: session destroy failed", err);
      }
      res.clearCookie("connect.sid");
      return res.json({ logoutUrl });
    });
  });

  return router;
}

module.exports = createAuthRouter;
