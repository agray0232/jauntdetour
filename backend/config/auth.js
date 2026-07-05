/**
 * Microsoft Entra External ID (CIAM) authentication configuration.
 *
 * Builds a single shared MSAL confidential-client application used by the auth
 * routes to run the OAuth 2.0 authorization-code + PKCE flow. The app registration
 * platform is "Web" and authenticates with a client secret. Configuration comes
 * from the ENTRA_* environment variables (see .devcontainer/devcontainer.env.example).
 *
 * Exposes:
 *   - msalClient:  ConfidentialClientApplication for getAuthCodeUrl / acquireTokenByCode.
 *   - authority:   the tenant authority base URL.
 *   - redirectUri: the registered callback URL.
 *   - scopes:      the default OIDC scopes requested at login.
 *   - cryptoProvider: MSAL CryptoProvider for generating PKCE codes and state.
 *   - getJwks:     lazily-created remote JWKS for future bearer-token verification.
 */

const {
  ConfidentialClientApplication,
  CryptoProvider,
} = require("@azure/msal-node");
const { createRemoteJWKSet } = require("jose");
const logger = require("../app/utils/logger");

const {
  ENTRA_TENANT_SUBDOMAIN,
  ENTRA_TENANT_ID,
  ENTRA_CLIENT_ID,
  ENTRA_CLIENT_SECRET,
  ENTRA_REDIRECT_URI,
} = process.env;

// Fail fast at startup if the auth environment is not configured. Without these,
// every login attempt would fail with a less obvious error deep inside MSAL.
const missing = [
  ["ENTRA_TENANT_SUBDOMAIN", ENTRA_TENANT_SUBDOMAIN],
  ["ENTRA_TENANT_ID", ENTRA_TENANT_ID],
  ["ENTRA_CLIENT_ID", ENTRA_CLIENT_ID],
  ["ENTRA_CLIENT_SECRET", ENTRA_CLIENT_SECRET],
  ["ENTRA_REDIRECT_URI", ENTRA_REDIRECT_URI],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  throw new Error(
    `Missing required Entra environment variables: ${missing.join(", ")}`
  );
}

// CIAM (Entra External ID) authority. Accept either the bare subdomain
// ("jauntdetour") or the full domain ("jauntdetour.onmicrosoft.com") and derive
// the ciamlogin host from the first label. The tenant ID must be in the
// authority path: the CIAM discovery document's `issuer` uses the tenant-GUID
// host, so MSAL's authority-alias validation rejects a tenant-less authority.
const subdomain = ENTRA_TENANT_SUBDOMAIN.split(".")[0];
const authorityHost = `${subdomain}.ciamlogin.com`;
const authority = `https://${authorityHost}/${ENTRA_TENANT_ID}`;

// OIDC scopes: openid for authentication, profile + email to populate the ID
// token claims (name, email) we persist to the users table.
const scopes = ["openid", "profile", "email"];

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: ENTRA_CLIENT_ID,
    clientSecret: ENTRA_CLIENT_SECRET,
    authority,
    knownAuthorities: [authorityHost],
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message) {
        logger.info(`MSAL: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: 3, // Warning
    },
  },
});

const cryptoProvider = new CryptoProvider();

// Remote JWKS for verifying bearer tokens (e.g. a future API-to-API path).
// Created lazily so importing this module never triggers a network call.
let jwks;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${authority}/discovery/v2.0/keys`));
  }
  return jwks;
}

module.exports = {
  msalClient,
  authority,
  redirectUri: ENTRA_REDIRECT_URI,
  scopes,
  cryptoProvider,
  getJwks,
};
