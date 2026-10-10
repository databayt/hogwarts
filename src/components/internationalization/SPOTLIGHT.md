---
feature: internationalization
title: Arabic-First Interface
status: live
pillar: product-proof
personas: [owner, principal, registrar, teacher, parent, student]
routes: [/ar/s/{school}/dashboard, /en/s/{school}/dashboard]
screenshots: [docs/evidence/attendance-overview-ar.png, docs/evidence/attendance-overview-en.png]
readme: ./README.md
docs: content/docs-en/internationalization.mdx
updated: 2026-09-27
---

# Arabic-First Interface — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Balqalam is built in Arabic first, right-to-left, with English one tap away, so a school can run on it from day one without an English-speaking administrator.

## The school's day without it

The school bought a system made for English. The menus are in English, the layout runs the wrong way, and Arabic names come out jumbled. One staff member who reads English becomes the only person who can use it, and everyone else goes back to paper and WhatsApp.

## What happens in Balqalam

1. Anyone opening the school's address with no language chosen yet lands in Arabic, unless their browser is set to English.
2. The whole screen reads right-to-left: the menu sits on the right, arrows point the Arabic way, tables and forms run in Arabic order.
3. One button in the top bar switches the whole system to English, left-to-right, and back. The choice is remembered.
4. Report cards and transcripts print in the school's own language, Arabic unless the school chose English.
5. When the school installs Balqalam on a phone, the icon and name appear in Arabic too.

## Who it is for

- **Owner**: staff can use the system on day one without training in English.
- **Principal and registrar**: every screen they work in all day reads naturally in Arabic.
- **Teacher**: registers, marks and messages in their own language and direction.
- **Parent and student**: an Arabic phone view, with English available for families who prefer it.

## Real screens to show

- `docs/evidence/attendance-overview-ar.png` — the attendance overview in Arabic, menu on the right, right-to-left layout. Note: one tab ("Early Warning") and a line under each student still show English; crop or re-capture before posting.
- `docs/evidence/attendance-overview-en.png` — the same screen in English, mirrored left-to-right. Pair it with the Arabic one for a side-by-side.

To capture more (with /record): the same page in Arabic and English at `/ar/s/{school}/dashboard` and `/en/s/{school}/dashboard`, and a printed Arabic report card. Avoid the student-profile screenshots in docs/evidence/: they show a real face and film-character demo data.

## What you can say

- Arabic is the default language, not a translation added later. [config.ts, marketing-brief.mdx]
- The whole interface turns right-to-left in Arabic and left-to-right in English. [config.ts, docs-en/internationalization.mdx]
- One tap in the top bar switches the entire system between Arabic and English. [language-switcher.tsx, template/platform-header/content.tsx]
- The interface carries 2,247 Arabic strings and 2,243 English ones. [marketing-brief.mdx, safe-to-cite list]
- Every new piece of screen text has to exist in both Arabic and English, or the build fails; the two languages cannot drift apart unnoticed. [CLAUDE.md, README.md]
- Report cards and transcripts print in Arabic unless the school chooses English. [file/generate/render-report-card-pdf.ts]
- It works in Khartoum or Riyadh from the first day without an English-speaking administrator. [marketing-brief.mdx]

## Do not say

- "Every word is in Arabic" or "100% Arabic". Some English still shows: a few tabs and status lines, the filter menu on list pages, and the grade-template builder (open items in ISSUE.md).
- "Hijri calendar support". It does not exist.
- "Supports many languages" or naming a third language. There are two: Arabic and English. Adding a third is an untested plan.
- "The only Arabic school system". Madrasati, Noon, Edraak, Classera and Alef all render Arabic correctly. Against Classera or Alef, lead with price and the whole-school operations, not with Arabic.
- Anything about Arabic numerals or date formats beyond what you can show on screen.
- "Hogwarts" — also avoid screenshots with the old demo names.

## Post angles

1. "Your staff shouldn't need English to run their own school." — owner — product-proof — the scene of one English reader holding the whole system hostage, then the Arabic screen.
2. "Same screen, two directions." — principal — product-proof — the Arabic and English attendance screens side by side, mirrored.
3. "How to switch Balqalam to English in one tap" — parent — product-proof — a short how-to for families who prefer English.
4. "A registrar's day, in Arabic from the first click" — registrar — school-operations — walk through a morning's work, every screen right-to-left.
5. "Which language does your school's system think in?" — owner — product-proof — ask the reader, answer: Arabic first, with the string counts from the safe list.

## Connects to

- [Content translation](../translation/SPOTLIGHT.md)
- [Slow connections and home screen install](../offline/SPOTLIGHT.md)
- [Reports](../school-dashboard/reports/SPOTLIGHT.md)
- [Parent portal](../school-dashboard/parent-portal/SPOTLIGHT.md)

## Sources

- src/components/internationalization/README.md
- src/components/internationalization/ISSUE.md
- src/components/internationalization/CLAUDE.md
- src/components/internationalization/config.ts
- src/components/internationalization/locale-detect.ts
- src/components/internationalization/language-switcher.tsx
- src/components/template/platform-header/content.tsx
- src/components/file/generate/render-report-card-pdf.ts
- src/app/manifest.ts
- content/docs-en/internationalization.mdx
- content/docs-en/marketing-brief.mdx
- docs/evidence/attendance-overview-ar.png, docs/evidence/attendance-overview-en.png, docs/evidence/profile-student-ar.png
