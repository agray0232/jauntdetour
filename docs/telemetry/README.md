---
title: Jaunt Telemetry Operations
description: Product telemetry definitions, privacy controls, Azure configuration, and analysis queries
author: JauntDetour Development Team
ms.date: 2026-08-02
ms.topic: how-to
keywords:
  - application insights
  - telemetry
  - product analytics
  - privacy
estimated_reading_time: 8
---

## Measurement Model

Jaunt uses Application Insights for first-party product analytics and service
observability. Browser telemetry is storage-free. The SDK has cookies, local
storage, session storage, generic click collection, and automatic request
collection disabled.

The measurements have distinct meanings:

- Anonymous visits count SPA loads and reloads, not unique people
- Registered accounts come from PostgreSQL and are exact at query time
- Signed-in active users use the internal account UUID as a pseudonymous
  Application Insights identifier
- Page engagement counts visible-tab milliseconds and remains approximate
- Saved Jaunts count successful persistence, not unsaved route creation

Anonymous unique visitors, anonymous returning users, and anonymous retention
are unavailable because those measurements require a persistent identifier.

## Data Boundaries

Allowed browser dimensions include normalized page name, feature, outcome,
source, category, mode, failure class, coarse count buckets, in-memory visit
and page IDs, and action ordinal.

Telemetry must not include:

- Email, display name, or Entra subject
- Jaunt IDs, names, addresses, polylines, or coordinates
- Place IDs, place names, notes, or search text
- Request or response bodies and headers
- Raw Redux state, API payloads, SQL text, or SQL parameter values
- Advertising identifiers, heatmaps, or session recordings

The backend sanitizer removes query strings and UUID path segments. PostgreSQL
statement text is replaced with `[REDACTED]` before export.

## Configuration

Set the backend App Service application setting:

```text
APPLICATIONINSIGHTS_CONNECTION_STRING=<Terraform output>
```

Set the GitHub Actions secret used by the frontend image build:

```text
APPLICATIONINSIGHTS_CONNECTION_STRING=<Terraform output>
```

The frontend receives the value as
`REACT_APP_APPLICATIONINSIGHTS_CONNECTION_STRING`. Missing values disable
telemetry without preventing startup or builds.

## Product Events

| Event                      | Meaning                                     |
| -------------------------- | ------------------------------------------- |
| `route_search_started`     | A valid route request began                 |
| `route_search_succeeded`   | A route was committed to the planner        |
| `route_search_failed`      | A route request failed or returned no route |
| `detour_category_selected` | A discovery category changed                |
| `detour_search_started`    | A Places search began                       |
| `detour_search_succeeded`  | A Places search returned results            |
| `detour_search_empty`      | A Places search returned no results         |
| `detour_search_failed`     | A Places search failed                      |
| `detour_add_started`       | Rerouting for a selected detour began       |
| `detour_added`             | A detour was committed to the route         |
| `detour_add_failed`        | Detour rerouting failed                     |
| `trip_save_auth_required`  | Save intent reached the sign-in gate        |
| `trip_save_started`        | Create or update persistence began          |
| `trip_save_succeeded`      | Create or update persistence completed      |
| `trip_save_failed`         | Create or update persistence failed         |
| `trip_opened`              | A saved Jaunt was opened from the list      |
| `trip_resume_started`      | Resume Planning was selected                |
| `trip_duplicated`          | Duplication completed                       |
| `trip_deleted`             | Deletion completed                          |
| `trip_export_opened`       | Google Maps export was selected             |
| `page_engagement`          | Visible activity ended for a page instance  |

## Application Insights Queries

Run these queries from the Application Insights Logs pane.

### Anonymous Visits by Day

```kusto
customEvents
| where timestamp > ago(30d)
| extend visitId = tostring(customDimensions.visitId)
| where isnotempty(visitId)
| summarize visits = dcount(visitId) by bin(timestamp, 1d)
| order by timestamp asc
```

This query counts in-memory visits. A reload starts another visit.

### Signed-In Daily Active Users

```kusto
union customEvents, pageViews
| where timestamp > ago(30d)
| where isnotempty(user_AuthenticatedId)
| summarize activeUsers = dcount(user_AuthenticatedId) by bin(timestamp, 1d)
| order by timestamp asc
```

### Popular Pages

```kusto
pageViews
| where timestamp > ago(30d)
| summarize views = count() by name
| order by views desc
```

### First Action on Each Page

```kusto
customEvents
| where timestamp > ago(30d)
| extend ordinal = toint(customDimensions.actionOrdinal)
| extend pageInstanceId = tostring(customDimensions.pageInstanceId)
| where ordinal == 1 and isnotempty(pageInstanceId)
| summarize firstActions = count()
    by page = tostring(customDimensions.pageName), name
| order by page asc, firstActions desc
```

### Visible Page Engagement

```kusto
customEvents
| where timestamp > ago(30d) and name == "page_engagement"
| extend durationMs = todouble(customMeasurements.activeDurationMs)
| summarize medianSeconds = percentile(durationMs, 50) / 1000,
            p90Seconds = percentile(durationMs, 90) / 1000
    by page = tostring(customDimensions.pageName)
| order by medianSeconds desc
```

### Planning Funnel Counts

```kusto
customEvents
| where timestamp > ago(30d)
| where name in (
    "route_search_succeeded",
    "detour_search_succeeded",
    "detour_added",
    "trip_save_succeeded",
    "trip_export_opened"
  )
| summarize events = count(),
            visits = dcount(tostring(customDimensions.visitId)) by name
| order by events desc
```

Use the Application Insights Funnels experience for ordered conversion. Use
the event order above and a visit-scoped conversion window.

## Retention and Review

Detailed telemetry is retained for 90 days and capped at 1 GB of ingestion per
day. Review event usefulness, unexpected dimensions, ingestion volume, and
access permissions 30 days after launch. Adding persistent identifiers,
analytics cookies, Clarity, or replay requires a separate privacy decision.
