---
feature: events
title: Events
status: partial
pillar: school-operations
personas: [principal, teacher, parent, student]
routes: [/ar/s/{school}/events, /ar/s/{school}/events/calendar, /ar/s/{school}/events/{id}, /ar/s/{school}/parent/events]
screenshots: [demo-events-ar.png, events-calendar-ar.png]
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Events — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every school event — exams week, graduation, sports day, a parents' meeting — sits in one list and one monthly calendar, and parents can sign up from their phone.

## The school's day without it

The events of the year live in a printed circular, a notice board and a few WhatsApp messages. A parent asks "when is graduation again?" and the office looks it up in a notebook. For a parents' meeting with limited seats, someone keeps a paper sign-up list and counts names by hand.

## What happens in Balqalam

1. An administrator or teacher presses the plus button on the Events page and fills three short steps: what it is (title, description, type), when and where (date, start and end time, place), and who it is for (organiser, audience, seat limit, whether sign-up is needed, public or not).
2. The event appears in the school's events list, with its type (academic, sports, cultural, parent meeting, celebration, workshop, other) and its status (planned, in progress, completed, cancelled, postponed). Staff can search, filter by type and status, switch to a card view, and download the list as a spreadsheet file.
3. The Calendar tab shows the month with each day's events; staff move month to month.
4. A parent opens the Events page in the parent area, sees upcoming and past events for the school, filters by type, and taps to register — or cancel.
5. When an event has a seat limit and it is full, a new sign-up goes on a waiting list instead of being refused.
6. Each day a scheduled job sends a reminder notification about events happening within the next 24 hours.

## Who it is for

- **Principal / administrator:** one place for the whole school year's events, exportable, with statuses that say what is planned, done, cancelled or postponed.
- **Teacher:** can create events and see the school calendar.
- **Parent:** sees what is coming, and registers for events that need a sign-up without calling the office.
- **Student:** can view the school's public events.

## Real screens to show

- `demo-events-ar.png` — the Arabic events list: holidays, exams, graduation, school trip, sports day, each with type badge, date, start time and status. Note: some seeded events appear twice in this capture; crop or recapture before posting.
- `events-calendar-ar.png` — the Arabic monthly calendar (July 2026). The month shown is empty, so it proves the layout, not the content; recapture on a month with events.
- Still to capture: an event detail page (`/ar/s/{school}/events/{id}`), the three-step create form, and the parent events page with a Register button (`/ar/s/{school}/parent/events`).

## What you can say

- Creating an event takes three short steps: what, when and where, and who it is for. [wizard/config.ts, config.ts]
- Seven event types: academic, sports, cultural, parent meeting, celebration, workshop, other. [config.ts]
- Parents can register for an event, or cancel, from the parent area. [parent-portal/events/content.tsx, actions.ts]
- When an event is full, new sign-ups go to a waiting list automatically. [actions.ts]
- The events list downloads as a spreadsheet (CSV) file. [table.tsx, actions.ts]
- A monthly calendar view shows each day's events. [calendar/calendar-client.tsx]
- Events and their labels show in Arabic or English, following the reader's language. [ISSUE.md 2026-07-17, content.tsx]
- A reminder notification goes out the day before an event. [app/api/cron/event-reminders/route.ts, cf/crons.json]

## Do not say

- Do not promise the Attendance, Categories, Recurring or Settings tabs: today they show only a heading and a one-line description, nothing works behind them. [attendance/, categories/, recurring/, settings/ content.tsx]
- No recurring events ("set it once, repeats every week") — not built.
- No check-in at the door, no QR codes for events, no photo gallery for events — listed as future ideas in ISSUE.md.
- No adding events to Google or Apple calendar (no iCal export yet).
- No drag-and-drop rescheduling on the calendar.
- No "reminders by WhatsApp or SMS" — the reminder is a notification only.
- No warning about clashing events — conflict detection is not built.
- No invented numbers (events per year, sign-up rates). No "works offline", no app-store app.

## Post angles

1. "Graduation is on which day again?" — parent — school-operations — The circular got lost; the date is in the parent's phone, with a Register button.
2. "Forty seats, sixty parents: the waiting list runs itself." — principal — product-proof — A full event moves new sign-ups to a waiting list instead of a paper list.
3. "How to put sports day on the school calendar in three steps." — teacher — school-operations — Walk through what, when, and who it is for.
4. "The whole school year on one screen." — principal — product-proof — The events list with type and status badges, exams to holidays.
5. "Where does your school's event calendar live today — notice board, circular, or WhatsApp?" — owner — school-operations — A question post that invites schools to describe their current habit.

## Connects to

- [Announcements](../announcements/SPOTLIGHT.md)
- [Dashboard](../../dashboard/SPOTLIGHT.md)
- [Parent portal](../../parent-portal/SPOTLIGHT.md)
- [Notifications](../../notifications/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/listings/events/README.md
- src/components/school-dashboard/listings/events/ISSUE.md
- src/components/school-dashboard/listings/events/actions.ts
- src/components/school-dashboard/listings/events/authorization.ts
- src/components/school-dashboard/listings/events/config.ts
- src/components/school-dashboard/listings/events/table.tsx
- src/components/school-dashboard/listings/events/calendar/content.tsx, calendar/calendar-client.tsx
- src/components/school-dashboard/listings/events/attendance, categories, recurring, settings, create (content.tsx)
- src/components/school-dashboard/parent-portal/events/content.tsx, actions.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/events/layout.tsx and sub-routes
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/events/page.tsx
- src/app/api/cron/event-reminders/route.ts, cf/crons.json
- src/routes.ts
- content/docs-en/notifications.mdx, content/docs-en/marketing-brief.mdx
- demo-events-ar.png, events-calendar-ar.png
