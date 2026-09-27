---
feature: activity
title: Co-curricular Activities
status: not-shipped
pillar: school-operations
personas: [principal, teacher, parent, student]
routes: []
screenshots: []
readme: none
docs: none
updated: 2026-09-27
---

# Co-curricular Activities — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A planned screen for sports teams, clubs and their members — not available to schools today.

## The school's day without it

The football coach keeps the team list on his phone. The debate club's members are in a WhatsApp group. When a parent asks which club their child joined, the office has to ask the teacher.

## What happens in Balqalam

1. Nothing yet. There is no page a school can open for this.
2. A draft screen exists in the code with three tabs (sports, clubs, events), but every team, club, member count and date on it is example text written into the screen.
3. Its "Add Sport", "Add Club" and "Add Event" buttons do nothing, and the screen is not linked from any page or menu.

## Who it is for

- Principal / teacher / parent / student: would one day see teams, clubs and who belongs to them. Not available now.

## Real screens to show

- None yet — and do not capture this one: it shows made-up teams and 2024 dates.
- Routes to capture: none exist.

## What you can say

- Nothing about sports teams or clubs. This feature is not shipped. [content.tsx]
- For school events (sports day, science fair), use the Events feature, which is real. [../listings/events/]

## Do not say

- "Manage clubs and sports teams", "track club membership", "practice schedules" — none of this works.
- Any example from the draft screen (15 students per team, 20 members per club, the listed event dates) — placeholders.
- Do not describe this as a separate events tool; events live in the Events feature.
- Global bans: no hours or money saved, no percentages, no "advanced analytics", never the old codename.

## Post angles

Do not post about this yet.

1. (Reserved) "The football team list lives on the coach's phone" — teacher — school-operations — Only once clubs and teams ship.
2. (Reserved) "Every club, every member, one screen" — principal — product-proof — Only once the feature ships.
3. (Reserved) "How a parent sees which club their child joined" — parent — school-operations — Only once the feature ships.
4. (Reserved) "A student's week beyond the classroom" — student — school-operations — Only once the feature ships.
5. (Reserved) "Which club at your school has the longest waiting list?" — principal — school-operations — Question post; only once the feature ships.

## Connects to

- [Events](../listings/events/SPOTLIGHT.md) — where school events are actually created today.

## Sources

- src/components/school-dashboard/activity/content.tsx (the only file; hard-coded example data)
- grep of src/app for imports of this component — none found; no activity route exists under src/app/[lang]/s/[subdomain]/
- content/docs-en/marketing-brief.mdx
