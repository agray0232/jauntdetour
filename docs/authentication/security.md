# Authentication Security

**Applies to:** Microsoft Entra External ID + Express backend
**Last Updated:** June 2, 2026

Hardening guidance that sits alongside the [authentication decision](authentication.md) and [implementation guide](implementation-guide.md). Entra hosts sign-in and handles password storage, hashing, MFA, and lockout; everything here covers what **our** app is still responsible for.

---

## Protocol

Use **OAuth 2.0 / OpenID Connect, authorization-code flow with PKCE** — the standard for browser apps. PKCE prevents authorization-code interception, and MSAL implements it for us. We never handle raw passwords.

---

## Token storage

| Token | Where | Lifetime | Why |
|-------|-------|----------|-----|
| **Access token** | Browser memory (React state/context) | 15–60 min | Lost on refresh; not readable by injected scripts |
| **Refresh token** | `httpOnly` + `secure` + `sameSite` cookie, or held by MSAL | 7–30 days | Not reachable from JavaScript (XSS-resistant) |

**Never** store tokens in `localStorage` or `sessionStorage` — both are readable by any script and are a classic XSS exfiltration target.

```javascript
// Refresh-token cookie (when the backend manages it)
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth',
});
```

> With MSAL, Entra issues and rotates refresh tokens for us, so a hand-rolled refresh-token store is optional. See [session-management.md](session-management.md).

---

## Token validation

Every protected request validates the JWT against the tenant's published keys (JWKS). The [implementation guide](implementation-guide.md#4-protecting-api-routes) uses `jose`; always check **signature, expiry, audience, and issuer**, and require `RS256`.

- Issuer/JWKS host is `https://<tenant>.ciamlogin.com/...` (External ID), **not** `b2clogin.com`.
- Audience must equal our `ENTRA_CLIENT_ID`.

---

## Transport security

- **HTTPS everywhere.** Redirect HTTP→HTTPS; Azure Web Apps terminate TLS.
- **HSTS** via `helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true })`.
- TLS 1.2+ only.

```javascript
const helmet = require('helmet');
app.use(helmet()); // sets HSTS, CSP defaults, X-Content-Type-Options, etc.
```

---

## CSRF protection

- **SameSite cookies** are the first line of defense for cookie-based auth.
- Add **anti-CSRF tokens** for state-changing routes (`POST/PUT/DELETE`) if cookies are used to authenticate them.
- Validate the `Origin`/`Referer` header on sensitive operations.

---

## CORS

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,   // never '*' with credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token'],
}));
```

Never combine `origin: '*'` with `credentials: true`. Whitelist explicit origins.

---

## Rate limiting

Throttle auth endpoints to blunt brute-force and token-abuse:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,                   // per IP per window
  message: 'Too many authentication attempts, please try again later',
});

app.use('/auth', authLimiter);
```

Back the limiter with Redis (`rate-limit-redis`) when running multiple instances. Note Entra already applies smart lockout on its hosted sign-in pages.

---

## MFA

MFA is configured in the **Entra user flow**, not in our code. Recommended policy:

- Optional for regular users, **required** for any admin/elevated role.
- Authenticator app (TOTP) is included free; SMS carries per-message cost.

Enforce role-sensitive operations in the app by checking the resolved user's role before allowing the action.

---

## Secrets

- `ENTRA_CLIENT_SECRET`, the DB password, and the Google Maps API key live in **Azure Key Vault** in production — never in committed `.env` files.
- Restrict the Google Maps API key to specific APIs and HTTP referrers.

---

## Logging & monitoring

Log security-relevant events (without logging tokens or secrets):

- Sign-in success/failure, token refresh, logout
- Session revocation, role changes
- Failed authorization (`403`) attempts

```javascript
securityLogger.info({
  event: 'login_success',
  userId: user.user_id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  at: new Date().toISOString(),
});
```

Export Entra sign-in/audit logs to **Azure Monitor** if you need more than the 7-day external-tenant retention.

---

## Pre-production checklist

- [ ] All traffic over HTTPS; HSTS enabled
- [ ] `helmet` security headers configured
- [ ] JWT signature/expiry/audience/issuer validated on every request
- [ ] Rate limiting on `/auth` routes
- [ ] CORS locked to known origins; no `*` with credentials
- [ ] CSRF protection on cookie-authenticated state changes
- [ ] No tokens in `localStorage`/`sessionStorage`
- [ ] Secrets sourced from Key Vault
- [ ] MFA enforced for admin roles
- [ ] Security event logging in place
- [ ] Dependencies scanned for known vulnerabilities

---

## Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [Microsoft Entra External ID](https://learn.microsoft.com/entra/external-id/)
