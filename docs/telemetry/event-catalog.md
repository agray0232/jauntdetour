---
title: Jaunt Telemetry Event Catalog
description: Complete reference for privacy-minimized product events emitted by Jaunt
author: JauntDetour Development Team
ms.date: 2026-08-02
ms.topic: reference
keywords:
  - application insights
  - telemetry
  - events
  - product analytics
estimated_reading_time: 4
---

## Event Rules

Events describe semantic workflow milestones rather than generic DOM clicks.
Properties are restricted to normalized page context, feature, source, category,
mode, failure class, coarse count buckets, and in-memory visit ordering.

No event may contain account email, display name, Jaunt or place identifiers,
addresses, coordinates, names, free text, request bodies, or API payloads.

## Catalog

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
| `detour_removed`           | A detour removal and reroute completed      |
| `trip_save_auth_required`  | Save intent reached the sign-in gate        |
| `sign_in_started`          | Sign-in began from a named product source   |
| `trip_save_started`        | Create or update persistence began          |
| `trip_save_succeeded`      | Create or update persistence completed      |
| `trip_save_failed`         | Create or update persistence failed         |
| `trip_list_viewed`         | A saved-Jaunt list loaded successfully      |
| `trip_detail_viewed`       | A saved Jaunt loaded successfully           |
| `trip_opened`              | A saved Jaunt was opened from the list      |
| `trip_resume_started`      | Resume Planning was selected                |
| `trip_duplicated`          | Duplication completed                       |
| `trip_duplicate_failed`    | Duplication failed                          |
| `trip_deleted`             | Deletion completed                          |
| `trip_delete_failed`       | Deletion failed                             |
| `trip_export_opened`       | Google Maps export was selected             |
| `page_engagement`          | Visible activity ended for a page instance  |
