# GDPR & Privacy Compliance

**Applies to:** Microsoft Entra External ID + JauntDetour backend
**Last Updated:** June 2, 2026

How JauntDetour meets GDPR obligations. Microsoft is the **data processor** for identity (under its Data Processing Agreement); JauntDetour is the **data controller** for user accounts, trips, and detours.

---

## Data we hold

We deliberately store the **minimum** (see [../database/schema.sql](../database/schema.sql)):

| Field | Purpose |
|-------|---------|
| `external_id` (Entra `sub`) | Link the account to the identity provider — **no password is ever stored** |
| `email` | Account identification and recovery |
| `display_name` | Personalization |
| `preferences` (JSONB) | Units, defaults |
| trips / detours | The user's saved plans |

We do **not** store credentials, payment data, or precise device location.

---

## Data subject rights

| Right | How we satisfy it |
|-------|-------------------|
| **Access** | Endpoint returns the user's profile, trips, and detours as JSON |
| **Portability** | Same data exported as a downloadable JSON file |
| **Erasure** | Delete the user's rows, then delete the user in Entra |
| **Rectification** | Profile editing; email changes go through Entra |
| **Restriction** | Allow disabling optional processing while keeping the account |

```javascript
// Right to access / portability — scoped to the authenticated user
router.get('/api/user/export', requireAuth, async (req, res) => {
  const data = {
    profile: await User.findById(req.userId),
    trips: await Trip.findByUserId(req.userId),
    exportedAt: new Date().toISOString(),
  };
  res.setHeader('Content-Disposition', 'attachment; filename=jauntdetour-data.json');
  res.json(data);
});

// Right to erasure
router.delete('/api/user/account', requireAuth, async (req, res) => {
  await Trip.deleteByUserId(req.userId);   // cascades to detours
  await User.deleteById(req.userId);
  await deleteEntraUser(req.userId);       // remove from the identity provider
  res.json({ message: 'Account deleted' });
});
```

Every request is scoped to `req.userId` — the same authorization boundary used everywhere else.

---

## Data minimization & retention

- Collect only what features require; optional fields (e.g. phone) only with explicit consent.
- **Active accounts:** retained while active.
- **Inactive accounts:** delete after 2 years of inactivity (with prior warning).
- **Deleted accounts:** purge within 30 days; remove from backups within 90 days.

---

## Cookie policy

| Category | Consent needed? | Examples |
|----------|:---:|----------|
| Essential | No | Auth session cookie (`httpOnly`), CSRF token |
| Non-essential | Yes | Analytics, UI preference cookies |

Show a consent banner before setting any non-essential cookie; only the essential auth/session cookies load without consent.

---

## Data residency & transfers

- Entra External ID offers **data residency** options; provision the tenant in the region matching the primary user base (EU vs US).
- Keep the PostgreSQL instance in the same geography as the identity tenant where practical.
- For transfers outside the EU, rely on Microsoft's Standard Contractual Clauses (covered by the DPA).

Recommended regions: **EU users** → West/North Europe; **US users** → East/West US.

---

## What Microsoft provides vs. what we implement

| Microsoft (Entra) | JauntDetour |
|-------------------|-------------|
| DPA, encryption at rest/in transit | Privacy policy & terms of service |
| Credential storage, MFA, lockout | Cookie consent banner |
| Identity audit logging | Data export & account-deletion endpoints |
| Data residency options | Retention enforcement (inactivity cleanup) |
| SOC 2 / ISO 27001 certifications | Breach-notification process |

---

## Compliance checklist

- [ ] Privacy policy and terms published
- [ ] Cookie consent banner for non-essential cookies
- [ ] `/api/user/export` (access + portability) implemented
- [ ] `/api/user/account` deletion implemented (app rows **and** Entra user)
- [ ] Retention policy automated (inactive-account cleanup)
- [ ] Tenant + database provisioned in the appropriate region
- [ ] Breach-notification procedure documented
- [ ] Data Protection Officer designated if required

---

## Resources

- [GDPR official text](https://gdpr-info.eu/)
- [Microsoft data protection & GDPR](https://learn.microsoft.com/compliance/regulatory/gdpr)
- [Entra External ID data residency](https://learn.microsoft.com/entra/external-id/)
