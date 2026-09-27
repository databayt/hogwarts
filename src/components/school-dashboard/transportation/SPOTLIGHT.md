---
feature: transportation
title: Transport
status: partial
pillar: school-operations
personas: [owner, principal, parent, student, finance, teacher]
routes: [/ar/s/{school}/transportation, /ar/s/{school}/transportation/dashboard, /ar/s/{school}/transportation/routes, /ar/s/{school}/transportation/trips, /ar/s/{school}/transportation/me, /ar/s/{school}/transportation/fees, /ar/s/{school}/transportation/settings]
screenshots: []
readme: ./README.md
docs: content/docs-en/transportation.mdx
updated: 2026-09-27
---

# Transport — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school's buses, drivers, routes and riders in one place — and parents get a message when their child boards the bus and when they get off.

## The school's day without it

The transport officer keeps a notebook of which child rides which bus, and drivers carry a paper list. Every morning parents phone the school or the driver to ask whether the bus has left, and whether their child got on. A driver's licence or a bus's insurance expires and nobody notices until it matters.

## What happens in Balqalam

1. The transport office adds its vehicles (with capacity and registration, insurance and inspection dates) and its drivers (with licence expiry). The overview flags documents that are about to expire.
2. It creates routes and pins each stop on a map, then assigns students to a route and a stop.
3. Each day's trips are scheduled per route, or built the night before automatically — leaving out students marked absent or whose parent asked to skip that day.
4. When a trip starts, a boarding list appears with every rider on it. Staff or a teacher on the bus mark each child as boarded, got off, missed or excused.
5. Each mark sends the child's parents a notification in the app, and a WhatsApp message when the parent's phone is on file — "Your child has boarded the bus on [route]", "Your child has gotten off the bus".
6. Parents open their own transport page to see the route, recent trips with their child's boarding status, a map of the bus during a trip, and a button to ask for a day off the bus (the school approves it).
7. The accountant sees each student's monthly transport fee and can turn it into fee records for the month.

## Who it is for

- **Owner / principal:** the whole fleet, every route and every rider on one screen, plus reports on route use and driver hours.
- **Transport office:** routes with map stops, daily trips, and an early warning on expiring licences and vehicle papers.
- **Parent:** a message when the child boards and gets off, a notice if the trip is cancelled or the child missed the bus, and a simple way to say "not today".
- **Teacher / bus staff:** a tap-through boarding list for the trip in progress.
- **Finance:** the monthly transport fee for each student, exportable to a spreadsheet.

## Real screens to show

None yet — capture with /record. Routes to capture (demo school, Arabic):

- `/ar/s/{school}/transportation` (landing with live fleet counts)
- `/ar/s/{school}/transportation/routes/{id}` (stops on the map)
- `/ar/s/{school}/transportation/trips/{id}` for a trip in progress (boarding list)
- `/ar/s/{school}/transportation/me` as parent on a phone (route, recent trips, skip request)
- `/ar/s/{school}/transportation/fees` as accountant

## What you can say

- Parents are notified when their child boards the bus and when they get off, in the school's language. [actions/trips.ts, actions/notifications.ts]
- Those parent alerts go to the app and are also sent over WhatsApp when the parent has a phone number on file. [actions/notifications.ts, docs-en/transportation.mdx]
- Parents also hear when the bus departs, when it arrives, when a trip is cancelled, and when their child missed the bus; the school can switch the departure, arrival and cancellation alerts off. [actions/notifications.ts, README.md]
- A parent can ask for a day off the bus from their phone; it only takes effect once the school approves it. [docs-en/transportation.mdx, me/skip-control.tsx]
- The night before, tomorrow's trips are built without the students who are absent or excused. [lib/absence.ts, docs-en/transportation.mdx]
- The overview warns about driver licences and vehicle papers that expire within the next 30 days. [README.md]
- Stops are pinned on a map and the route distance is worked out automatically. [docs-en/transportation.mdx]
- The accountant sees each student's monthly transport fee and can export it to a spreadsheet that opens correctly in Arabic. [ISSUE.md, fees/export-button.tsx]

## Do not say

- "Real-time GPS tracking" as a headline. The live map works only while the driver keeps the trip open with location sharing on, and it updates about every ten seconds rather than instantly. No school has run it on real buses yet. [docs-en/transportation.mdx]
- "Automatic boarding detection" or "RFID cards" — boarding is marked by staff; hardware can be connected but none is shipped. [docs-en/transportation.mdx]
- "Weather-aware delays" — designed, not built. [ISSUE.md, docs-en/transportation.mdx]
- "Traffic-aware routes" or "saves fuel / time" — traffic-aware ordering needs an extra paid map key, and no saving has been measured.
- That King Fahad Schools (or any named school) runs its buses on Balqalam — only the demo school has transport data today.
- "Download the driver app" — there is no store app; it opens in the phone's browser. [marketing-brief.mdx]
- "Works offline", any hours or money saved, any percentage.

## Post angles

1. "7:10 a.m. Forty parents call to ask if the bus has left." — parent — school-operations — The morning phone scene, answered by the departure and boarding messages.
2. "'Your child has boarded the bus.' The message every parent waits for." — parent — product-proof — Show the boarding list being tapped and the resulting notification.
3. "How to set up your first bus route: pin the stops, assign the children." — principal — school-operations — A how-to from route creation to a trip's boarding list.
4. "The transport officer's view: every bus, every driver, every expiring licence." — owner — school-operations — The fleet overview and the 30-day expiry warning.
5. "How does your school tell parents the bus is running late today?" — parent — school-operations — A question post about the current routine, pointing to boarding and cancellation alerts.

## Connects to

- [Attendance](../attendance/SPOTLIGHT.md) — absent students are left off tomorrow's trips.
- [Finance](../finance/SPOTLIGHT.md) — monthly transport fees become fee records.
- [Notifications](../notifications/SPOTLIGHT.md) — boarding and trip alerts reach parents in the app and on WhatsApp.
- [Parent portal](../parent-portal/SPOTLIGHT.md) — parents' own transport page sits alongside the rest of their child's information.

## Sources

- src/components/school-dashboard/transportation/README.md
- src/components/school-dashboard/transportation/ISSUE.md
- src/components/school-dashboard/transportation/CLAUDE.md
- src/components/school-dashboard/transportation/actions/trips.ts
- src/components/school-dashboard/transportation/actions/notifications.ts
- src/components/school-dashboard/transportation/lib/absence.ts
- src/components/school-dashboard/transportation/me/content.tsx
- src/components/school-dashboard/transportation/trips/detail-content.tsx, driver-tracker.tsx
- src/components/school-dashboard/transportation/fees/provision-button.tsx
- src/components/internationalization/dictionaries/en/transportation.json (notification wording)
- cf/crons.json (nightly trip builder, WhatsApp sender)
- content/docs-en/transportation.mdx
- content/docs-en/marketing-brief.mdx
- Production database check (read-only): transport tables present; routes exist for one school only
