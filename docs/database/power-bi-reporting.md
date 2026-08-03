---
title: Power BI Reporting for Jaunt
description: Secure Power BI connection and dashboard specification for aggregate Jaunt database metrics
author: JauntDetour Development Team
ms.date: 2026-08-02
ms.topic: how-to
keywords:
  - power bi
  - postgresql
  - reporting
  - dashboard
estimated_reading_time: 7
---

## Reporting Boundary

Power BI connects only to views in the `reporting` schema created by
`reporting.sql`. These views expose totals, daily trends, and distribution
buckets. They do not expose account, Jaunt, route, or place rows.

The reporting role has no access to `public.users`, `public.trips`, or
`public.detours`.

## Enable the Reporting Login

The schema script creates `jauntdetour_reporting` as `NOLOGIN`. Enable login in
production from an administrator session and supply the password through Azure
Key Vault or another approved secret channel:

```sql
ALTER ROLE jauntdetour_reporting
LOGIN PASSWORD '<generated-password>';
```

Do not reuse the database administrator or application credential.

## Connect Power BI

1. Open Power BI Desktop and select **Get data**.
2. Select **PostgreSQL database**.
3. Enter the Azure PostgreSQL fully qualified server name and the `jauntdetour`
   database.
4. Select **Import** mode.
5. Authenticate with the `jauntdetour_reporting` credential.
6. Select only views under the `reporting` schema.
7. Publish the semantic model to a restricted Power BI workspace.
8. Configure scheduled refresh and a refresh-failure notification.

Use Import mode to avoid repeated interactive queries against the production
`B_Standard_B1ms` server. Azure Database for PostgreSQL requires TLS. The
current public-network configuration also requires the Power BI cloud
connection to pass the server firewall rules.

## Dashboard Specification

### Overview

Source: `reporting.overview`

- Total accounts
- Active accounts
- Accounts with saved Jaunts
- Saved Jaunts
- Saved detours
- Average Jaunts per account

### Daily Trends

Sources:

- `reporting.daily_new_accounts`
- `reporting.daily_saved_jaunts`
- `reporting.daily_saved_detours`

Plot account creation, saved Jaunts, distinct Jaunt creators, and saved detours
by date. Database trends are persistence metrics, not site activity metrics.

### Distributions

Sources:

- `reporting.jaunts_per_account_distribution`
- `reporting.detours_per_jaunt_distribution`
- `reporting.jaunt_status_counts`
- `reporting.detour_category_counts`

Sort bucket visuals by `bucket_order`, not alphabetically.

## Known Limitations

- `users.last_login` stores only the latest login and cannot reconstruct DAU,
  WAU, or MAU
- Hard deletion changes historical database totals
- Database creation dates measure persistence, not route searches or exports
- Signed-in active-user trends and feature funnels come from Application
  Insights
- Anonymous unique users are unavailable in storage-free telemetry mode

## Access Review

Restrict the Power BI workspace to operators who need aggregate business
metrics. Report authors must not replace the reporting views with raw tables,
add PII, or publish the reporting credential in a PBIX/PBIP artifact.
