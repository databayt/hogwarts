---
feature: welcome
title: Welcome Quick Guide
status: not-shipped
pillar: product-proof
personas: [owner, principal]
routes: [/ar/s/{school}/dashboard]
screenshots: []
readme: none
docs: none
updated: 2026-09-27
---

# Welcome Quick Guide — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

**Current state: switched off.** This short "Quick Guide" pop-up used to open over the dashboard
the first time someone signed in on a computer. On 2026-09-19 it was removed from the dashboard so
the page opens straight onto its main content. The pop-up and its Arabic and English text still
exist in the code, so it can be switched back on, but no one sees it today. There is no README
for this folder; the history is in the dashboard's README.

## In one line

A three-page welcome card that showed a new user where everything is and what to do first — not
shown to anyone at the moment.

## The school's day without it

A new administrator signs in for the first time and faces a full sidebar with no idea where to
begin. Today the dashboard itself fills that role: it opens on a greeting and quick-action tiles
instead of a pop-up.

## What happens in Balqalam

When it was switched on, it worked like this:

1. On the first sign-in on a computer (never on a phone), a card opened over the dashboard.
2. Page one, "Quick Guide": everything lives in the sidebar; tap a section to jump to it.
3. Page two, "Your Daily Tools": attendance, grades, timetable, messages, events and finance.
4. Page three, "Start Here": add students and staff, set up the timetable, configure attendance
   rules, send the first announcement, review school settings, invite teachers.
5. "Done" closed it, and it did not appear again for that person on that browser.

## Who it is for

- **Owner** — (when on) a first-day pointer to the six tools used most.
- **Principal** — (when on) a checklist of first tasks to get the school running.

## Real screens to show

None yet, and none can be captured today because the guide is not shown. The dashboard at
`/ar/s/{school}/dashboard` is the screen new users now land on. (Repo-root `settings-ar.png`
happens to show an old Quick Guide card, half covered by a settings sheet and a developer badge —
not usable, and the guide is no longer shown anyway.)

## What you can say

- Nothing about this pop-up. It is not on screen for any user. [dashboard/README.md,
  (school-dashboard)/layout.tsx]
- If you need a "first day" story, use the dashboard, the setup wizard, or the pilot setup
  instead. [docs-en/pilot.mdx]

## Do not say

- Do not describe or show a welcome tour or guided first-login walkthrough. It is switched off.
- Do not say it appears on phones. Even when on, it was desktop only. [welcome-dialog.tsx]
- Do not repeat its "three things to do first" line: the card said three but listed six steps.
  [school-en.json "welcomeDialog"]
- Global bans apply: no time saved, no percentages, no "works offline", no app-store app.

## Post angles

Do not post about this yet. If the guide is switched back on, candidate angles:

1. "Your first sign-in tells you where everything is." — principal — product-proof — the three-page
   guide on first login.
2. "Six tools, one sidebar." — owner — school-operations — attendance, grades, timetable, messages,
   events and finance, one click each.
3. "Day one on balqalam: six first tasks." — principal — product-proof — the Start Here checklist
   as a how-to.
4. "What was the first thing you did in a new school system?" — owner — trust — a question post.
5. "No manual needed." — owner — product-proof — a new admin finds their way from the guide alone.

## Connects to

- [Dashboard](../dashboard/SPOTLIGHT.md) — where the guide used to open, and what new users see instead
- [School Setup Wizard](../../onboarding/SPOTLIGHT.md) — the step before a new admin reaches the dashboard

## Sources

- src/components/school-dashboard/welcome/welcome-dialog.tsx
- src/components/school-dashboard/welcome/welcome-dialog-lazy.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/layout.tsx
- src/components/school-dashboard/dashboard/README.md (entry dated 2026-09-19)
- src/components/school-dashboard/admission/ISSUE.md (untriaged note on the guide's illustrations)
- src/components/internationalization/school-en.json and school-ar.json ("welcomeDialog")
- content/docs-en/marketing-brief.mdx
- content/docs-en/pilot.mdx
