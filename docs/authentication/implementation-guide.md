# Entra External ID — Node.js Implementation Guide

**Target:** Microsoft Entra External ID (external tenant) + Express backend
**Last Updated:** June 2, 2026

How the JauntDetour frontend redirects users to the hosted login flow, and how the backend verifies the returned token and resolves it to a `users` row.

---

## Flow overview

```
Browser ──(1) redirect──▶ Entra hosted login (*.ciamlogin.com)
        ◀─(2) auth code──
Browser ──(3) code──▶ Backend ──(4) exchange for tokens──▶ Entra
Backend  ─(5) verify JWT, upsert user, issue app session ──▶ Browser
Browser ──(6) call API with bearer token ──▶ Backend (verify + scope by user_id)
```

We use **OpenID Connect / authorization-code + PKCE**. Most teams use **MSAL** (`@azure/msal-node`) so they don't hand-roll the OAuth exchange.

---

## 1. Configuration

`backend/.env.example`:

```bash
ENTRA_TENANT_SUBDOMAIN=jauntdetour           # <subdomain>.ciamlogin.com
ENTRA_CLIENT_ID=00001111-aaaa-2222-bbbb-3333cccc4444
ENTRA_CLIENT_SECRET=                          # from Key Vault in production
ENTRA_REDIRECT_URI=https://app.jauntdetour.com/auth/callback
```

Authority URL format for external tenants:
`https://<ENTRA_TENANT_SUBDOMAIN>.ciamlogin.com/`

---

## 2. MSAL client — `backend/config/auth.js`

```javascript
const { ConfidentialClientApplication } = require("@azure/msal-node");
require("dotenv").config();

const authority = `https://${process.env.ENTRA_TENANT_SUBDOMAIN}.ciamlogin.com/`;

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.ENTRA_CLIENT_ID,
    clientSecret: process.env.ENTRA_CLIENT_SECRET, // from Key Vault in prod
    authority,
    knownAuthorities: [`${process.env.ENTRA_TENANT_SUBDOMAIN}.ciamlogin.com`],
  },
});

module.exports = { msalClient, authority };
```

---

## 3. Login + callback routes

```javascript
const express = require("express");
const { msalClient } = require("../config/auth");
const UserRepository = require("../app/repositories/UserRepository");
const db = require("../app/db/pool");

const userRepository = new UserRepository(db);
const router = express.Router();
const SCOPES = ["openid", "profile", "email"];

// (1) Redirect the browser to the hosted Entra login flow.
router.get("/auth/login", async (req, res) => {
  const url = await msalClient.getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri: process.env.ENTRA_REDIRECT_URI,
  });
  res.redirect(url);
});

// (3-5) Exchange the code, verify the token, upsert the user.
router.get("/auth/callback", async (req, res, next) => {
  try {
    const result = await msalClient.acquireTokenByCode({
      code: req.query.code,
      scopes: SCOPES,
      redirectUri: process.env.ENTRA_REDIRECT_URI,
    });

    // MSAL validates the token signature/issuer/audience for us.
    const { sub, email, name } = result.idTokenClaims;

    const user = await userRepository.upsertByExternalId({
      externalId: sub, // stable subject claim → users.external_id
      email,
      displayName: name,
    });

    req.session.userId = user.user_id; // or issue your own signed JWT
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

---

## 4. Protecting API routes

For APIs called with a bearer access token, validate it against the tenant's JWKS. `jose` keeps this small:

```javascript
const { createRemoteJWKSet, jwtVerify } = require("jose");
const { authority } = require("../config/auth");

const JWKS = createRemoteJWKSet(new URL(`${authority}discovery/v2.0/keys`));

async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const { payload } = await jwtVerify(token, JWKS, {
      audience: process.env.ENTRA_CLIENT_ID,
    });

    const user = await userRepository.upsertByExternalId({
      externalId: payload.sub,
      email: payload.email,
      displayName: payload.name,
    });

    req.userId = user.user_id; // the authorization boundary
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = requireAuth;
```

Usage — every data route is scoped to `req.userId`:

```javascript
router.get("/api/trips", requireAuth, async (req, res) => {
  const trips = await tripRepository.getTripsByUserId(req.userId); // WHERE user_id = $1
  res.json(trips);
});
```

---

## 5. Production checklist

- [ ] `ENTRA_CLIENT_SECRET` and DB credentials injected from **Azure Key Vault**.
- [ ] Redirect URIs registered for every environment (dev, staging, prod).
- [ ] Sessions/cookies set `httpOnly`, `secure`, `sameSite`.
- [ ] Token `audience` and `issuer` validated on every request.
- [ ] Brand the hosted user flow (logo, colors) in the Entra admin center.
- [ ] Export auth logs to Azure Monitor if >7-day retention is needed.

---

## Resources

- [Microsoft Entra External ID](https://learn.microsoft.com/entra/external-id/)
- [Add Google as an identity provider](https://learn.microsoft.com/entra/external-id/customers/how-to-google-federation-customers)
- [MSAL for Node.js](https://learn.microsoft.com/entra/identity-platform/msal-node-overview)
