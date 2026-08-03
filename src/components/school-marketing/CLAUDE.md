---
epic: 14
sprint: Q3-2026
title: School Marketing
file_type: claude
owner: Samia
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/327
docs: https://databayt.org
last_audited: 2026-06-13
---

# School Marketing Block

## Context

Public-facing school website on subdomain (e.g., `demo.databayt.org`). Includes homepage sections, admission portal, multi-step application form, visit booking, academic pages (93% complete). No blockers.

## Before You Start

1. Read `README.md` here for full file structure and key patterns
2. Read `ISSUE.md` here for priorities
3. If working on admission/application, also read the cross-block rule at `.claude/rules/blocks/admission.md`

## Key Decisions

- **Homepage is a verbatim zenda.com clone (2026-08-03)**: the tenant homepage is now a copy-paste of zenda.com's homepage — `src/components/school-marketing/zenda-home/` (8 sections + 5 GSAP scroll drivers), with `src/components/template/zenda-nav/` and `zenda-footer/` as the chrome for the whole block, replacing `SiteHeader`. Copy and imagery are zenda's, unchanged and in English; the deviations are all in the chrome, all requested: the hero's single EXPLORE pill is two (`/tour`, `/admissions`); nav links come from `marketingConfig.mainNav`; the logo is a small mark with the school name beside it (zenda's is a 10.8rem wordmark that needs no label); links and hamburger group at the end of the bar; and the hamburger is on at every width, opening a panel that holds the search / language / theme / account controls inherited from `SiteHeader`. Those nav overrides live in `zenda-shell.css` and **must** carry a `.zenda-clone` prefix — the generated sheet styles the nav at `.zenda-clone .nav_*`, so a bare selector loses on specificity regardless of load order. The previous real-school template (`content.tsx` + its 16 sections) is untouched on disk and still serves every sibling page — do not delete it. **Three constraints govern any edit here:**
  1. **`.zenda-clone` must never wrap `<main>`.** `src/styles/zenda-clone.css` carries unlayered bare-tag rules (`.zenda-clone a`, `h1`, `p`, `button`, `img`, `label`) and unlayered CSS beats Tailwind's `@layer utilities`, so any sibling page under that class gets silently restyled with no opt-out. The class sits on three small wrappers only: the nav, the footer slot, and the homepage body.
  2. **The page shell is hand-ported unscoped** into `src/styles/zenda-shell.css` (`.page-wrapper`, `.main-wrapper`, `.zenda-footer-slot`, `.nav_utility-wrap`) for exactly that reason — the scoped originals at `zenda-clone.css:24193-24238` would force the class onto an ancestor of `<main>`. Regenerating `zenda-clone.css` does not regenerate the shell; keep them in step by hand.
  3. **English/LTR only.** The Webflow CSS has no RTL handling, so the three wrappers force `dir="ltr"` and `/ar` renders the same English page. `<html dir>` is untouched, so the RTL assertions on sibling pages still hold.
  4. **Three things carry the clone's typography, and each failed silently at first.** All three were found by measuring against zenda running locally, not by looking at screenshots — the page looked plausible while being wrong. Verified fixed: section geometry is now identical to zenda at 1440px and 390px, total page height included.
     - **DM Sans and Poppins come from `next/font`** (`src/components/template/zenda-fonts.ts`), not from the `@import url(fonts.googleapis.com/…)` the generator used to emit. Next concatenates `zenda-clone.css` after `globals.css`, and an `@import` that is not at the top of the resulting stylesheet is invalid and gets dropped — so it never worked and the whole clone rendered in system Helvetica. They are deliberately **not** in `@/components/atom/fonts`: the root layout imports that module, which would ship both families on every page in the app.
     - **The fluid root scale must sit on `html`** (`zenda-home/root-scale.tsx`). Zenda sizes everything in `rem` off a viewport-derived root font size; the scope script rewrites `html` → `.zenda-clone`, and `rem` resolves against the document root, never an ancestor, so the whole system was inert. The clone matched only at ≥1440px — at 1200px every rem-based size was ~20% too large. It cannot be class-scoped, so it is rendered from the page and applies to the homepage alone.
     - **No `LoadingWrapper` on this block.** It held the page at `visibility: hidden` behind a full-screen "0%…100%" counter for ~2s, then faded it in from `scale(0.98)`. Zenda has no preloader, and the two fought: the hero's GSAP intro starts on mount, so it played its whole 1.8s centred hold while still hidden and the page arrived mid-split, 2% undersized and offset ~98px down. The zenda intro is the entrance here. Re-adding it silently breaks the first screen.
     - **The intro's logo travel is measured, not the reference's `x: "318%"`.** That percentage is of the element's _own_ width, so it only centres zenda's 173px wordmark. `hero-intro.tsx` computes the distance to viewport centre instead, which holds for any logo. Anything that should be absent during the centred splash needs a `hero-link` attribute to join the staggered fade — the hamburger carries one for exactly this reason.
     - **`scripts/scope-zenda.mjs` concatenates globals.css FIRST, then the Webflow sheet.** Measured on zenda: its Next bundle is `document.styleSheets[0]` and the Webflow CDN `<link>` is `[2]`, so the CDN loads last and wins ties — which is why zenda's globals.css reaches for `!important` twenty times. The original order inverted the cascade for every tie; correcting it also halved `.section_services` on `/features/[id]`, which had been rendering at 7225px against zenda's 3595px.
- **Homepage was a real-school template, not themed (2026-08-03)**: the homepage used to carry Harry Potter copy — Gryffindor/Ravenclaw "houses", Dumbledore as faculty, a trust strip citing the Ministry of Magic — which shipped verbatim on **every tenant's** public website. It is now generic-but-warm copy any school can publish. Two rules follow: (1) never reintroduce a named theme here, because this block renders for all tenants; (2) **never invent a person or an institution** — no named faculty with stock portraits, no fake accreditation logos. Faculty shows departments and figures; the trust strip lists subjects actually taught. A school with no `branding.heroImageUrl` gets a typographic ink panel rather than someone else's campus photo. Design primitives live in `src/styles/school-marketing.css` (`.display-*`, `.eyebrow`, `.section-y`, `.band-*`, `.capsule-*`, `.tile`) — use them instead of raw `text-*`/hex colors. The old version is preserved on the **`hogwarts` branch** and tag `harry-potter-homepage-2026-08-02`.
- **Mobile edge-to-edge uses `--page-px`, not `--marketing-px` (2026-08-02)**: a marketing page carries TWO stacked gutters — the root `.layout-container` (`--container-px`) plus `.marketing-container` (`--marketing-px`). Negating only one leaves a visible strip. `src/styles/container.css` defines `--page-px` as the sum, plus `.bleed-page` (escape to the viewport edge), `.px-page` (realign content inside a bleed), and `.bleed-bg` (paint a sticky header's background full-width via an absolutely positioned `::before`, so the nav stays on the page rails and no scrollable width is added). Prefer these over `.full-bleed` / `100vw` here — `100vw` overshoots by the scrollbar width on desktop.
- **Applying is ALWAYS FREE (2026-06-13)**: The wizard fees step is an informational free-application preview — payment method selection and gateway icons (Bankak/Kashi) are removed. Payment only happens post-acceptance: registration fee on offer acceptance + tuition invoices. Never add a payment gate to the application wizard.
- Single application flow via `application/` (context-based, 5 form steps: attachments → personal → location → academic → fees-preview + submit)
- Campaign-based admission: applications tied to `AdmissionCampaign` records with date windows
- Session-based drafts via `saveApplicationSession` / `resumeApplicationSession`; the apply wizard is auth-gated (login required), while OTP status tracking stays account-less
- OTP status tracking: sha256-hashed OTP; enumeration-oracle closed; atomic attempt counter. Applicants check status via email OTP (no account needed)
- Offer flow: callbackUrl preserves full token'd offer path through login; registration-fee success/fail banners shown post-acceptance
- All public portal writes (inquiry, tour, OTP, submit) are rate-limited
- Tour bookings: TOCTOU-safe seat counter; cancel/reschedule decrements by attendee count; `enableTourBooking` flag gates all entry points
- New-lead notifications (inquiry + tour booking) fire to ADMIN and STAFF roles
- All actions use `getTenantContext()` for schoolId resolution from subdomain
- Homepage sections are composed in `content.tsx` -- order matters for visual flow

## Danger Zones

- `visit/actions.ts` calls `sendEmail()` -- verify template exists in `@/lib/email` before modifying
- Session persistence in `application/` -- breaking auto-save loses applicant progress
- ALL UI text must use dictionary keys -- no hardcoded English. Forms: `dictionary.school.*.form.*`, toasts: `ToastHelper`, validation: `ValidationHelper`, server errors: error codes.

## Related Blocks

- [Dashboard Admission](../school-dashboard/admission/CLAUDE.md) -- admin reviews applications submitted here
- [Application](./application/CLAUDE.md) -- the multi-step application wizard (sub-block)
- [School Dashboard](../school-dashboard/CLAUDE.md) -- admin side of the same school

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if file structure changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: visit `demo.localhost:3000` as anonymous user
