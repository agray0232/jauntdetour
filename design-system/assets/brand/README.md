---
title: JauntDetour Brand Assets
description: Canonical source and generated application assets for the selected JauntDetour mark
author: JauntDetour Development Team
ms.date: 2026-07-26
ms.topic: reference
---

## Status

These assets represent the selected design-spike mark: the existing route glyph
inside a pine badge, white endpoints, and one heritage-orange discovery point on
the upper-left route bend.

## Canonical Sources

* `jauntdetour-mark.svg` is the canonical transparent-background source for web,
  favicon, and general brand use.
* `jauntdetour-mark-maskable.svg` provides a full-bleed pine background for PWA
  maskable icons.

Never edit generated PNG or ICO files directly. Update the canonical SVG, review
it at 16, 32, 180, 192, and 512 pixels, then regenerate all derivatives.

## Generated Assets

| Asset | Size | Intended production use |
| --- | --- | --- |
| `favicon-16x16.png` | 16 × 16 | Browser favicon fallback |
| `favicon-32x32.png` | 32 × 32 | Browser favicon fallback |
| `favicon.ico` | 16, 32, and 48 | Primary legacy/browser favicon |
| `apple-touch-icon.png` | 180 × 180 | Apple home-screen icon |
| `android-chrome-192x192.png` | 192 × 192 | Web app manifest icon |
| `android-chrome-512x512.png` | 512 × 512 | Web app manifest icon |
| `maskable-icon-512x512.png` | 512 × 512 | Web app manifest maskable icon |
| `jauntdetour-mark-512.png` | 512 × 512 | General raster export |

## Production Adoption

A follow-up implementation should:

1. Copy the favicon and Apple assets into `frontend/public/`.
2. Add the 192, 512, and maskable entries to `frontend/public/manifest.json`.
3. Set the manifest and HTML theme color to pine `#12664f`.
4. Add the Apple touch icon link to `frontend/public/index.html` if it is absent.
5. Use the SVG mark in the React application header rather than duplicating its
   paths inside a component.
6. Verify all icon requests in the production build and installed-app previews.

The design spike does not replace production assets directly, which keeps the
visual adoption reviewable as its own implementation change.
