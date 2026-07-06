# Session Management

**Applies to:** Microsoft Entra External ID + Express backend
**Last Updated:** June 2, 2026

How JauntDetour keeps a user signed in after the [hosted login flow](implementation-guide.md), and how sessions end. **Default approach is lean** — let Entra/MSAL own the token lifecycle and keep only a thin app session. A heavier server-side store is described at the end as an optional upgrade.

---

## Default: lean, IdP-managed tokens

Entra (via MSAL) issues, validates, and **rotates** tokens for us. The backend's job is small:

1. After `/auth/callback`, store the resolved `user_id` in a signed, `httpOnly` session cookie (or issue our own short app JWT).
2. On each API call, verify the bearer/access token and scope every query to `user_id` (see [implementation guide](implementation-guide.md#4-protecting-api-routes)).
3. On logout, clear the app session and redirect through Entra's logout endpoint.

```
Browser ──login──▶ Entra hosted UI ──code──▶ Backend
Backend ──verify, upsert user, set httpOnly session cookie──▶ Browser
Browser ──API + access token──▶ Backend (verify JWT, scope by user_id)
```

This needs **no Redis** and no hand-rolled refresh logic.

---

## Token lifetimes

| Token         | Lifetime                                   | Storage                        |
| ------------- | ------------------------------------------ | ------------------------------ |
| Access token  | 15–60 min                                  | Browser memory                 |
| Refresh token | 7–30 days (rotated by Entra)               | MSAL cache / `httpOnly` cookie |
| App session   | Match refresh window; absolute cap 90 days | `httpOnly` cookie              |

The frontend refreshes the access token shortly before expiry (MSAL `acquireTokenSilent` handles this transparently).

---

## Logout & revocation

- **User logout** — clear the app session cookie and call Entra's `logout` endpoint to end the IdP session.
- **Password change / account deletion** — handled in the Entra user flow; our app simply stops accepting the old session on next verification.
- **Force sign-out everywhere** — see the optional server-side store below; without it, revocation is bounded by access-token lifetime (keep it short, 15 min).

```javascript
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    const logoutUrl =
      `${authority}oauth2/v2.0/logout` +
      `?post_logout_redirect_uri=${encodeURIComponent(process.env.FRONTEND_URL)}`;
    res.redirect(logoutUrl);
  });
});
```

---

## Timeouts

- **Idle timeout:** 30 minutes of inactivity.
- **Absolute timeout:** 12 hours for sensitive sessions, 90 days hard cap before forced re-authentication.

Short access-token lifetimes (15 min) mean a revoked or expired session is rejected quickly even in the lean model.

---

## Optional: server-side session store

> **Current build:** sessions use `express-session`'s default in-memory
> `MemoryStore`. That's fine for local dev and a single instance, but it loses
> sessions on restart and does not scale across instances. Before running more
> than one backend instance, switch to a persistent store — `connect-pg-simple`
> (reuses the existing Postgres pool) is the low-friction option; Redis (below)
> is the alternative when you also need global revocation.

Adopt this only if you need **immediate, global revocation** or **concurrent-session limits** — e.g. an admin "sign out all devices" feature. It adds a Redis dependency and rotation code.

```javascript
// Store session metadata for revocation
await redis.setex(
  `session:${userId}:${sessionId}`,
  7 * 24 * 60 * 60,
  JSON.stringify({
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ip: req.ip,
  })
);

// Revoke a single session or all of a user's sessions
async function revokeAllUserSessions(userId) {
  const keys = await redis.keys(`session:${userId}:*`);
  if (keys.length) await redis.del(...keys);
}
```

What it buys you:

- Revoke a refresh token **before** it expires (logout, password change, security incident).
- Enforce a max number of concurrent sessions per user (evict the oldest).
- Track last-activity for idle enforcement server-side.

For JauntDetour's MVP this is **not required** — the lean model is the default. Revisit if/when an admin console or strict device management is on the roadmap.

---

## Resources

- [MSAL token lifecycle](https://learn.microsoft.com/entra/identity-platform/msal-acquire-cache-tokens)
- [Entra External ID sign-out](https://learn.microsoft.com/entra/external-id/customers/how-to-user-flow-sign-up-sign-in-customers)
