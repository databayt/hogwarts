---
epic: 12
sprint: Q3-2026
title: SaaS Marketing (sales surface)
file_type: claude
owner: Mutaz
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/316
docs: https://ed.databayt.org/en/docs/sales
last_audited: 2026-05-25
---

# SaaS Marketing Block

## Context

Public-facing landing pages for the Hogwarts SaaS platform: hero, features showcase, pricing, community resource hub, testimonials, FAQs (75% complete). Blocker: typography violations, legacy code cleanup.

## Before You Start

1. Read `README.md` here for file structure and integration points
2. Feature pages use a section renderer pattern in `features/sections/` -- understand it before adding new sections
3. Check `features/page-data/` for per-feature content definitions

## Key Decisions

- Feature showcase uses a generic `section-renderer.tsx` that renders different section types from data
- Page data is static TypeScript objects in `features/page-data/` (not database-driven)
- Grid grouping/order/tabs are driven by `FEATURE_GROUPS` in `constants.tsx` (6 consolidated client-facing groups — Academics, Learning, Finance, Communication, Operations, Insights & AI — ordered by importance; each lists its feature ids in display order). `GROUP_OF` maps id→group; `SHOWN_FEATURES` is sorted by group rank. The fine-grained `feature.category` field is now ONLY used by detail-page badges. To re-tab/reorder, edit `FEATURE_GROUPS` (no need to touch the big `FEATURES` array).
- **Dictionary cache GOTCHA:** the features hero `title`/`badge`/`subtitle` come from `marketing.features` in `en.json`/`ar.json`. `getDictionary` caches at dev-server start — editing the JSON does NOT hot-reload; you MUST restart `pnpm dev` (kill :3000 + relaunch) or the page keeps serving the old string (symptom: disk says "boring" but page renders "boarding").
- The public grid (`feature-tabs.tsx`) renders `SHOWN_FEATURES` — built + partially-built modules only (48 of 85). The full 85-item `FEATURES` list stays intact (detail pages + `relatedFeatures` still resolve); `PLANNED_FEATURE_IDS` in `constants.tsx` is the hide filter (not-yet-built + a few abstract platform attributes pulled out of the grid; audited 2026-06-16). Drop an id from that set when it should show.
- A few feature **titles** were shortened for the grid (display only — `id`/URL slug unchanged): `live-classroom`→"Conference", `online-appointment`→"Appointment", `whatsapp-integration`→"WhatsApp", `discussion`→"Message".
- Card icons: clean 512×512 PNG from `FEATURE_IMAGES`, served **locally from `public/feature/`** (NOT via `asset()`/CDN). CRITICAL: the flat CDN namespace (`cdn.databayt.org/hogwarts/<file>`) serves PHOTOS for some of these names — `events.png`=sack-race photo, `transport.png`=train, `library.png`=girl reading — because `/illustrations/*` and `/photos/*` collide once flattened. Always map feature icons to `/feature/<name>.png` and `git add` the file (untracked public assets don't deploy). All shown features now have an icon (0 category fallback). Brand conferencing icons: `meet.png` (Google Meet), `teams.png` (MS Teams, copied from a `office.png` download), `zoom.png`. The grid still uses the PNGs; the **detail pages** render the same `/feature/*.png` glyphs bare (via `sections/glyph.tsx`, `dark:invert`), mapping a card title → PNG with `sections/card-art.ts` and falling back to a bare Lucide icon (`icon-map.tsx`'s `getIconComponent`, keyed by `sections/card-icons.ts`) when there's no matching PNG.
- `/features/[id]` detail pages are PUBLIC — `src/proxy.ts` must match `/features` with `startsWith` (not exact `includes`), same as `/docs`/`/community`. Exact-match-only silently 307s sub-paths to login.
- **Detail-page UI kit (`features/sections/`, redesigned 2026-06-23):** the old wireframe look (empty `ImagePlaceholder` boxes + empty `bg-primary/10` icon circles) is gone. A first pass tried abstract gradient panels + floating Lucide tiles + `motion/react` scroll-reveals — it read as cheap/foreign and was scrapped. The shipped version **matches the app's own landing aesthetic**: bare `/feature/*.png` glyphs (`glyph.tsx`) on clean `Card`-style cards (`info-card.tsx`, mirroring the `@/components/atom/card` used by the grid), a text-focused hero, subtle `bg-muted/40` CTA bands, and related-features rendered with the real `Card` atom. **No motion, no gradients** — static + token-driven, shared across the `page-data` and `FEATURE_DETAILS` branches. Title→glyph resolution: `card-art.ts` (real PNG) → `card-icons.ts` + `getIconComponent` (Lucide fallback). Verified LTR/RTL/dark/mobile. (Deleted in the redesign: `feature-visual.tsx`, `card-icon.tsx`, `reveal.tsx`, `motion-provider.tsx`, `image-placeholder.tsx`.)
- **Imported demo sections (`features/imported/`, 2026-06-23):** six marketing sections re-implemented from the `~/zenda` + `~/apple` clones in the house stack (Tailwind + tokens), **static** (Webflow CSS / GSAP / Swiper / paddle-nav carousels all dropped) — rendered by `<ImportedSections />` BELOW the detail content in `details.tsx`, kept "as is" for later tweaking. zenda: how-it-works, parents-voice, smarter-transactions (+61/75/71), more-ease. apple: store (rail PNGs copied to `public/store/nav/`), why-apple-mac. Images: zenda categories/testimonials via Webflow CDN, apple value-props via apple.com, zenda service slides copied to `public/imported/zenda/`. All `<img>` (plain, eslint-disabled) so no `next.config` remote-domain allowlist is needed.
- Pricing component has its own README at `pricing/README.md`
- Dictionary-driven i18n via `src/components/internationalization/{en,ar}.json`
- Community is catalog-backed (textbooks/exams/qbank/videos/materials/books with curriculum + grade filters), public + anonymous — see `community/CLAUDE.md`

## Danger Zones

- Typography: several files have hardcoded `text-*` classes instead of semantic HTML (P2)
- `features/constants.tsx` -- feature list used across landing page; changes affect multiple sections
- `config.ts` -- static content config; mistranslations here affect the entire landing page

## Related Blocks

- [Auth](../auth/CLAUDE.md) -- conversion funnel leads to registration
- [Onboarding](../onboarding/CLAUDE.md) -- registered users enter onboarding to create a school
- [SaaS Dashboard](../saas-dashboard/CLAUDE.md) -- operator admin for the platform

## After You Finish

1. Update `README.md` if file structure changed
2. Run `pnpm tsc --noEmit` to verify no regressions
3. Test: visit `localhost:3000` as anonymous user
