## Repo-wide: revalidatePath paths never match a cache tag (2026-08-14)

`pnpm build`: **691 of 692 routes are `ƒ` (dynamic)**, one is static. So this is
latent, not a live bug — dynamic routes re-render per request and there is
nothing cached to bust. It becomes real the moment any route adopts
`'use cache'` / Cache Components, which the next-16 rules push toward.

Counts (`src/components`, `src/lib`, `src/app`):

|                                     | calls   |
| ----------------------------------- | ------- |
| total `revalidatePath(...)`         | 791     |
| pass a `type` (`"page"`/`"layout"`) | 61      |
| path starts with `/[lang]`          | 26      |
| **neither — cannot match any tag**  | **765** |

Three ways they are wrong, all found while fixing the 8 in lumos/finance/bulk:

1. **No locale/tenant prefix.** Every page lives under `src/app/[lang]/…`, most
   under `[lang]/s/[subdomain]/…`. A call like `revalidatePath("/exams")` matches
   neither the route pattern (`/[lang]/s/[subdomain]/exams`) nor a concrete URL
   (`/en/s/demo/exams`). This is the bulk of the 765.
2. **Route groups included.** `finance/receipt` used
   `/s/[subdomain]/(school-dashboard)/finance/receipt` — route groups are not
   part of the page path, so the group alone kills the match.
3. **Blended paths.** A real id interpolated into a bracketed path
   (`` `/[lang]/…/courses/${slug}` ``) matches neither form, even with `"page"`.
   See `next/dist/server/lib/implicit-tags.js`: a page registers its route
   PATTERN or its CONCRETE url, never a mix.

Fixed so far (8 sites + 4 test assertions that had encoded the bug):
`lumos/*` (13 calls), `finance/receipt` (5), `finance/banking` (2),
`school/bulk` (1).

Not swept: the remaining ~765 span a dozen blocks (exams ~120, onboarding ~20,
finance/fees ~25, listings, library, catalog, saas-dashboard, auth). That is a
mechanical but wide change — one PR per block, each needing its target route
verified to exist, and each block's records updated per the block protocol.
`saas-dashboard/.audit-findings.json` already flagged its own slice of this.
