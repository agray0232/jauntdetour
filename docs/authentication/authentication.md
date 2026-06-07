# Authentication for JauntDetour

**Status:** Decided
**Decision:** Microsoft Entra External ID (customer/external tenant)
**Last Updated:** June 2, 2026

---

## Decision

Use **Microsoft Entra External ID** as the managed identity provider for JauntDetour's end users. It hosts sign-up and sign-in, supports **email + password local accounts** and **social login (Google, Apple, Facebook, Microsoft)** in the same flow, and handles password storage, hashing, MFA, smart lockout, banned-password checks, and password reset on our behalf.

We do **not** build our own password authentication, and we do **not** store credentials in our database.

> **Note on naming:** Microsoft Entra External ID is the **successor to Azure AD B2C**. Microsoft stopped onboarding new B2C tenants (May 2025) and B2C is on a retirement path, so new builds use External ID. Earlier spike material that says "Azure AD B2C" refers to the same Azure CIAM platform — the recommendation is unchanged, only the product name and tenant URLs (`*.ciamlogin.com`, not `*.b2clogin.com`).

> Verified against Microsoft Learn (External ID supported features and Google federation, docs updated March 2026).

---

## Why a managed provider

Rolling our own username/password auth means owning hashing/salting, reset flows, MFA, brute-force protection, breach response, and session security — the most common source of security incidents. A managed provider removes that entire surface area. For a new consumer app, this is the strong default.

| Option | Verdict |
|--------|---------|
| **Microsoft Entra External ID** ✅ | Azure-native, one ecosystem, email/password + social in one hosted flow. **Chosen.** |
| Auth0 / Clerk | Excellent DX and free tiers; viable, but adds a separate vendor outside Azure. |
| Social OAuth directly (e.g. Google only) | Simple if we only ever want Google; we own more plumbing and no local accounts. |
| Roll your own password auth | Avoid — high security burden, easy to get wrong. |

### Detailed comparison

| Capability | **Entra External ID** ✅ | Auth0 | Firebase Auth | Custom JWT |
|------------|:---:|:---:|:---:|:---:|
| Azure-native | ✅ | ❌ 3rd-party | ❌ Google | ⚠️ self-hosted |
| Email/password + social in one flow | ✅ | ✅ | ✅ | ❌ build |
| MFA built in | ✅ | ✅ | ⚠️ limited | ❌ build |
| GDPR tooling (DPA, residency) | ✅ | ✅ | ⚠️ config | ❌ build |
| Cost at 50K MAU | ✅ free | ❌ paid | ✅ free | ⚠️ dev/maint |
| Build effort | ⚠️ moderate | ✅ fast | ✅ fast | ❌ weeks |
| Maintenance burden | ✅ minimal | ✅ minimal | ✅ minimal | ❌ high |

Firebase is ruled out by the Azure-first preference; Auth0 is a viable non-Azure fallback; custom auth is rejected on security and maintenance grounds.

---

## Cost

External ID bills on **monthly active users (MAU)** — a user counts once no matter how many times they sign in. JauntDetour's expected volume sits comfortably in the free tier.

| MAU | Indicative monthly cost |
|-----|------------------------|
| Up to 50,000 | **$0** (free tier) |
| 50,001 – 100,000 | low per-MAU tiered rate |
| 100,000+ | progressively lower per-MAU rate |

- The first **50,000 MAU are free**; MFA via the Authenticator app is included.
- SMS-based MFA and some premium (P1/P2) features carry add-on charges.
- Figures are **point-in-time** — confirm current rates on the [Azure pricing page](https://azure.microsoft.com/pricing/details/microsoft-entra-external-id/) before a budget decision.

For comparison, Auth0 starts charging well before 50K MAU and a custom build costs roughly $19K+/year in development and maintenance — External ID is both the cheapest and the lowest-effort option.

---

## What users see

A single hosted **user flow** can present local accounts and social providers together:

```
┌─────────────────────────────────────┐
│         Sign in to JauntDetour      │
│   Email    [____________________]   │
│   Password [____________________]   │
│                  [ Sign in ]        │
│   ──────────  or  ──────────        │
│   [  🔵  Continue with Google  ]    │
│   No account?  Sign up              │
└─────────────────────────────────────┘
```

The page is **hosted by Microsoft** on `*.ciamlogin.com`, brandable with our logo and colors. The app redirects users there using **OpenID Connect / authorization-code + PKCE**.

---

## How it connects to the database

Whether a user signs in with a password or Google, the backend receives the **same kind of token (JWT)**. From the app's perspective the path is identical:

1. Verify the token.
2. Read the stable subject (`sub`) claim and email.
3. Upsert the matching row in `users`, keyed by `external_id` (= the `sub`).

This is why the schema stores **`external_id`, not `password_hash`** (see [../database/schema.sql](../database/schema.sql)). A Google user and an email/password user both become a `users` row identified by their token subject.

### Authorization boundary

Authentication proves *who* the user is; **authorization stays in our app/DB**. Every trip/detour query is scoped:

```sql
WHERE user_id = <id resolved from the verified token>
```

The same boundary protects both the REST API and a future Foundry agent tool — the agent calls a parameterized, `user_id`-scoped function, never raw data access.

---

## Setup overview

One-time, in the Microsoft Entra admin center:

1. Create an **external tenant**.
2. Create a **sign-up and sign-in user flow** (generates the hosted login page).
3. Enable identity providers:
   - Email + password is available out of the box.
   - For Google: create an OAuth client in Google Cloud Console, copy the **Client ID + secret** into Entra (*External Identities → All identity providers → Google*), then add Google to the user flow.
4. Register the app and point it at the authority `https://<tenant-name>.ciamlogin.com/`.

See [implementation-guide.md](implementation-guide.md) for the Node.js redirect and token-verification code.

---

## Scope notes

- JauntDetour's needs (email/password + Google for consumers) are in the **GA core** of External ID.
- During the current preview, some premium features are unavailable in external tenants; a few items (Azure Monitor log export, invited-user MFA) are preview/limited.
- External-tenant auth **log retention is 7 days** on the free side — export to Azure Monitor if longer auth audit history is required.

---

## Security essentials (beyond login)

These matter as much as authentication for a public app:

- **Secrets in Azure Key Vault** — DB password, Google API key, Entra client secret. Not in `.env` for production.
- **Always parameterized queries** — `$1, $2` placeholders; never concatenate user input into SQL.
- **TLS in transit** — Azure databases enforce SSL by default; keep it on.
- **Network isolation** — DB behind a VNet/private endpoint in production.
- **Restrict the Google Maps API key** — scope to specific APIs and referrers.

See [security.md](security.md) for the full hardening detail (token storage, CSRF, CORS, rate limiting, MFA, logging), [session-management.md](session-management.md) for the session lifecycle, and [compliance.md](compliance.md) for GDPR/privacy.

---

## Impact on the database decision

**None.** PostgreSQL, Azure SQL, and Cosmos all sit behind the provider identically — they never see credentials, only the resolved user ID. Authentication was decided independently and can change later without touching the data store.
