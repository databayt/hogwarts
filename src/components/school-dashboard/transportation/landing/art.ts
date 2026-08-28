// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The school-bus line drawing shown on this landing page.
 *
 * Same object, same bucket, same hotlink style the tenant marketing homepage
 * already uses for the transport pill in its features section — see
 * `school-marketing/zenda-home/phone-mockup.tsx`, which loads its whole icon
 * set from this Webflow project. Deliberately NOT routed through `asset()`:
 * that helper has no fallback and an unpublished CDN key returns 403, not 404,
 * so an invented cdn.databayt.org path would render a blank tile.
 */
export const BUS_ART =
  "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/68256caf012087afc36967c5_transport-icon.webp"
