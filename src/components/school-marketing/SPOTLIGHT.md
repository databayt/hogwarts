---
feature: school-marketing
title: School Website
status: partial
pillar: product-proof
personas: [owner, principal, registrar, parent]
routes: [/ar/s/{school}, /ar/s/{school}/admissions, /ar/s/{school}/application, /ar/s/{school}/application/status, /ar/s/{school}/inquiry, /ar/s/{school}/tour, /ar/s/{school}/academic, /ar/s/{school}/about]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# School Website — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every school on Balqalam gets its own public web address, in Arabic and English, where families read about admissions and apply online.

## The school's day without it

A parent who wants a place calls the office, or drives over to collect a paper form. The registrar answers the same five questions on WhatsApp all week, then retypes each handwritten form into a spreadsheet. A parent who wants to know "did we get in?" has to call again.

## What happens in Balqalam

1. The school's site is live at its own address (for example `{school}.balqalam.com`) with the school's name and logo in the top bar. Arabic is the default; English is one click away.
2. A parent opens the admissions page: how applying works, what documents each step needs, key dates, common questions, and an "Apply" button.
3. The parent signs in and fills the online application step by step (documents, the child's details with father and mother tabs, address, previous school, then a preview of the grade's fees). They can stop halfway and come back to a saved draft. Applying is free — there is no payment step.
4. The school's admissions team is told about new inquiries on their dashboard, and the application lands in the school's admissions list.
5. Later, the parent checks where the application stands on the status page using a one-time code sent to their email — no account needed for that. A signed-in parent also sees a status banner across the top of the school's site.
6. The admissions team can switch each public piece off (the whole portal, the inquiry form, visit booking, the status checker) from admission settings.

## Who it is for

- **Owner**: a real public web presence on day one, with admissions attached, without hiring a web designer.
- **Principal**: the school's name and logo in front of families, in Arabic first.
- **Registrar**: applications arrive already typed, with documents attached, instead of on paper.
- **Parent**: apply from a phone in the evening, save and come back, and check the status without calling the school.

## Real screens to show

None yet — capture with /record. Do not use `docs/evidence/demo-home-ar.png`: it shows an old homepage design that has since been removed.
Routes to capture (Arabic, on the demo school):

- `/ar/s/{school}/admissions` — the admissions page (safest page to show)
- `/ar/s/{school}/application` — the step-by-step application form
- `/ar/s/{school}/application/status` — status check by email code
- The top bar with a school's logo and name (crop out the homepage body below it; see "Do not say")

## What you can say

- Each school gets its own public address with its name and logo, served in Arabic by default and in English. [src/app/[lang]/s/[subdomain]/(school-marketing)/layout.tsx]
- Parents apply online through a step-by-step form and can save a draft and return to it later. [README.md; ISSUE.md "Apply" checklist]
- Applying is always free; the fees step only shows the grade's expected fees, and payment comes after acceptance. [README.md "Applying is always free"; ISSUE.md product decision 2026-06-13]
- A family can check an application's status with a one-time code sent to their email, without creating an account. [README.md "OTP status tracking"; application/status/page.tsx]
- When someone sends an inquiry, the school's admins and staff get a notification in their dashboard. [admission/actions/inquiry.ts]
- The Arabic application form was tested end to end: right-to-left on every step, Arabic grade names, a real application submitted. [ISSUE.md "Arabic (/ar) QA pass — apply wizard"]
- The school can turn the public portal, inquiry form, visit booking and status checker on or off. [admission/actions/portal-flags.ts]

## Do not say

- Do not show or quote the homepage body, the About page or the Academic page as a school's own content. The homepage copy is the same template text for every school, adapted from another company's website; only the name and logo change. [ISSUE.md, zenda-home/]
- The parent testimonials on the homepage are written copy, not real feedback, and the portraits are photos of real people from another company. Never quote them, screenshot them, or call them "our parents". [ISSUE.md "The copy is zenda's product"]
- The About page still shows third-party partner and accreditation logos and another company's team photos. It is a known blocker; never show it. [ISSUE.md "BLOCKER — third-party imagery"]
- The Academic page carries invented figures (acceptance and graduation rates) and names "Advanced Placement". Do not repeat any of those numbers. [ISSUE.md "Stats row is still four invented figures"]
- Do not promise a response time. "Five minutes to apply", "two days to hear back" and "an answer within two weeks" are template wording, not a school's commitment, and they disagree with each other. [dictionaries en.json marketing.site]
- Do not say families can book a campus visit online at any school: the booking page only offers times a school has set up, and there is no screen yet for a school to create those times.
- Do not say "the school designs its own website" or "fully customizable site" — the homepage text cannot be edited by the school today.
- The footer's social icons still link to another company's pages. Crop the footer out of any screenshot. [ISSUE.md]
- Do not say parents apply "without an account": filling the form requires signing in; only the status check works without one.
- Global: no invented numbers, no "works offline", no app-store app, never the product's old codename.

## Post angles

1. "The admission form used to be a photocopy. Now it's a link." — registrar — school-operations — The paper-form-and-retyping scene, replaced by applications that arrive already typed.
2. "Your school's name, your logo, your own web address — in Arabic first." — owner — product-proof — Show the top bar and admissions page on a school's own address.
3. "How a parent applies in the evening, from the sofa." — parent — product-proof — Walk the application steps, the saved draft, and the free-to-apply rule.
4. "Did we get in? Parents check with a code, not a phone call." — parent — school-operations — The status check by email code, and the calls it spares the office.
5. "How many times this week did someone ask your office how to apply?" — principal — school-operations — A question to the reader that leads to one shareable admissions link.

## Connects to

- [Admissions](../school-dashboard/admission/SPOTLIGHT.md) — where the applications land and get reviewed
- [School configuration](../school-dashboard/school/SPOTLIGHT.md) — name, logo and visibility of the school
- [Onboarding](../onboarding/SPOTLIGHT.md) — setting up the school that the website belongs to

## Sources

- src/components/school-marketing/README.md
- src/components/school-marketing/ISSUE.md
- src/components/school-marketing/zenda-home/content.tsx, zenda-home/hero.tsx, zenda-home/testimonials.tsx
- src/components/school-marketing/zenda-about/content.tsx
- src/components/school-marketing/admission/content.tsx, admission/sections/stats.tsx
- src/components/school-marketing/admission/application-status-banner.tsx
- src/components/school-marketing/admission/actions/portal-flags.ts, inquiry.ts, tour.ts
- src/app/[lang]/s/[subdomain]/(school-marketing)/page.tsx, layout.tsx, about/page.tsx, inquiry/page.tsx
- src/app/[lang]/s/[subdomain]/application/(auth)/layout.tsx, application/status/page.tsx
- src/app/[lang]/s/[subdomain]/(tour-standalone)/tour/page.tsx
- src/components/template/zenda-footer/footer.tsx
- src/components/internationalization/en.json (marketing.site)
- prisma/seeds/admission.ts (tour time slots exist only as seed data)
- content/docs-en/pilot.mdx, content/docs-en/marketing-brief.mdx
- docs/evidence/demo-home-ar.png (checked: shows the retired design)
