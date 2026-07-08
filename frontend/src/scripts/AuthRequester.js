import axios from "axios";
import config from "../config/config.js";
import log from "../utils/logger";

/**
 * AuthRequester — talks to the backend auth endpoints.
 *
 * The backend owns the OAuth flow and issues an http-only session cookie, so
 * every call must send credentials. Login is a full-page redirect (not XHR)
 * because it navigates to the Entra hosted pages.
 */
export default class AuthRequester {
  getUrlBase() {
    return config.BACKEND_URL;
  }

  /**
   * Start sign-in by navigating the browser to the backend login endpoint,
   * which redirects on to Entra.
   */
  login() {
    window.location.assign(this.getUrlBase() + "/auth/login");
  }

  /**
   * Fetch the currently authenticated user. Resolves to the user object, or
   * null when not signed in (the backend returns 401).
   *
   * @returns {Promise<object|null>}
   */
  getCurrentUser() {
    return axios
      .get(this.getUrlBase() + "/auth/me", { withCredentials: true })
      .then((response) => response.data.user)
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          return null;
        }
        log.error("Unable to fetch current user:", error);
        return null;
      });
  }

  /**
   * Sign out: clear the backend session, then navigate to the Entra logout URL
   * returned by the server to end the IdP SSO session.
   *
   * @returns {Promise<void>}
   */
  logout() {
    return axios
      .post(this.getUrlBase() + "/auth/logout", {}, { withCredentials: true })
      .then((response) => {
        // Mark that a sign-out completed so the app discards the previous
        // user's persisted planning state on the next load (see loadState in
        // index.js) — deferred so nothing is visibly erased before the
        // redirect, and set only after the backend session is actually
        // destroyed so a failed logout doesn't wipe an in-progress trip.
        sessionStorage.setItem("jaunt.pendingLogout", "1");
        const logoutUrl = response.data && response.data.logoutUrl;
        if (logoutUrl) {
          window.location.assign(logoutUrl);
        } else {
          window.location.reload();
        }
      })
      .catch((error) => {
        log.error("Logout failed:", error);
      });
  }
}
