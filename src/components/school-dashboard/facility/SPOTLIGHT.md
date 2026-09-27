---
feature: facility
title: Facility Management
status: not-shipped
pillar: school-operations
personas: [owner, principal]
routes: []
screenshots: []
readme: none
docs: none
updated: 2026-09-27
---

# Facility Management — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A planned screen for tracking a school's rooms, labs, equipment and buses — not available to schools today.

## The school's day without it

The admin office keeps a list of halls and labs on paper or in a spreadsheet. Booking the hall means asking whoever holds the key. Nobody knows how many projectors actually work until one is needed.

## What happens in Balqalam

1. Nothing yet. There is no page a school can open for this.
2. A draft screen exists in the code with four tabs (rooms, labs, equipment, vehicles), but every figure and name on it is example text written into the screen, not the school's own data.
3. Its buttons ("Add Room", "Add Lab", "Add Vehicle") do nothing, and the screen is not linked from any page or menu.

## Who it is for

- Owner / principal: would one day see what rooms, labs and equipment the school has and what is free. Not available now.

## Real screens to show

- None yet — and do not capture this one: it shows made-up numbers.
- Routes to capture: none exist.

## What you can say

- Nothing about this feature. It is not shipped. [content.tsx]
- If a school asks about room use: rooms and their capacity are set up through Classrooms, and the timetable stops a room being double-booked. [../listings/classrooms/, docs-en/timetable.mdx]

## Do not say

- "Manage your facilities", "book the hall", "equipment inventory", "maintenance tracking" — none of this works.
- Any number from the draft screen (42 facilities, 35 available, and so on) — they are placeholders, not data.
- Global bans: no hours or money saved, no percentages, no "advanced analytics", never the old codename.

## Post angles

Do not post about this yet.

1. (Reserved) "Who has the key to the science lab?" — principal — school-operations — Only once facility tracking ships.
2. (Reserved) "Every projector, every laptop, one list" — owner — product-proof — Only once equipment tracking ships.
3. (Reserved) "How to book the school hall without a phone call" — teacher — school-operations — Only once booking ships.
4. (Reserved) "What does the admin office do when the lab is under repair?" — principal — school-operations — Only once maintenance status ships.
5. (Reserved) "How does your school keep track of its rooms today?" — owner — school-operations — Question post; only once the feature ships.

## Connects to

- [Timetable](../timetable/SPOTLIGHT.md) — the live feature that already keeps rooms from being double-booked.
- [Transportation](../transportation/SPOTLIGHT.md) — where school buses are actually managed today.

## Sources

- src/components/school-dashboard/facility/content.tsx (the only file; hard-coded example data)
- grep of src/app for imports of this component — none found; no facility route exists under src/app/[lang]/s/[subdomain]/
- content/docs-en/marketing-brief.mdx
