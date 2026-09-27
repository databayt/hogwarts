---
feature: notifications
title: Notifications
status: live
pillar: school-operations
personas: [parent, teacher, student, principal, finance]
routes: [/ar/s/{school}/notifications, /ar/s/{school}/notifications/unread, /ar/s/{school}/notifications/preferences]
screenshots: []
readme: ./README.md
docs: content/docs-en/notifications.mdx
updated: 2026-09-27
---

# Notifications — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

When something happens that concerns you — your child is marked absent, a fee is due, a grade is posted, results are out — Balqalam tells you, in the app and by email, in your language.

## The school's day without it

The office phones a parent at noon about a morning absence, if someone remembers. Fee reminders go home in a schoolbag and never arrive. Report cards are ready but nobody knows until the next parents' meeting.

## What happens in Balqalam

1. Something happens in the school's system — a teacher marks a child absent, a fee becomes due or overdue, results or a report card are published, an exam is coming up.
2. The people it concerns get a notification: a red count appears on the bell at the top of the screen.
3. Tapping the bell shows the latest ones; the notification page lists them all, with an Unread view, each labelled with its type and marked if it is urgent.
4. Tapping a notification opens the exact page it is about.
5. Depending on the person's role and settings, the same notice also arrives by email.
6. On the Preferences page each person chooses, for every kind of notice, which channels they want, and can set quiet hours when nothing should be sent.
7. On a phone, a person can also switch on push notifications for that device, so notices appear on the lock screen.

## Who it is for

- Parent: hears about absences, fees, grades and report cards without waiting for a phone call.
- Teacher: gets reminders to take attendance and notices about class changes.
- Student: gets assignment, grade and fee notices.
- Principal / owner: attendance alerts and school-wide notices reach the right people automatically.
- Finance: fee-due and overdue reminders go out on a schedule, not by hand.

## Real screens to show

- None yet — capture with /record.
- Routes to capture: the bell with its open list (any dashboard page, e.g. `/ar/s/{school}/dashboard` as parent@ on the demo), the full list at `/ar/s/{school}/notifications`, and the preferences grid at `/ar/s/{school}/notifications/preferences`.

## What you can say

- Parents are told when their child is marked absent, when a fee is due, paid or overdue, and when grades or a report card are posted. [docs-en/notifications.mdx]
- Notices arrive in the app and by email; each person picks, per type of notice, how they want to receive it. [docs-en/notifications.mdx, preferences-form.tsx]
- Quiet hours: a person can set hours when no notice is sent. [docs-en/notifications.mdx, dictionaries/en/notifications.json]
- Tapping a notice takes you straight to the page it is about. [ISSUE.md]
- Notices display in Arabic or English, whichever the reader uses. [ISSUE.md]
- Fee reminders, event reminders and teachers' "take attendance" reminders go out on a daily or hourly schedule. [docs-en/notifications.mdx]
- On Android, or once the site is added to an iPhone home screen, notices can appear as phone notifications. [docs-en/notifications.mdx, docs-en/offline.mdx]

## Do not say

- SMS notifications — the text-message channel exists but is switched off; there is no SMS provider.
- "Daily digest" or "weekly summary" emails — the setting is on the screen but does nothing yet; people still get each notice individually.
- That phone push is proven on real devices — it works in testing, but a real phone delivery has not been confirmed yet. Say "can", not "does".
- "Instant" or "real-time" — without the live-push server the bell checks for new notices about every 30 seconds, and phone pushes go out on a 15-minute schedule.
- "Download our app" — push works through the browser or the home-screen shortcut, not an app store.
- That WhatsApp notices are on by default — WhatsApp is an opt-in channel and needs the school to link its number first.
- Any "parents informed within X minutes" or engagement figure.

## Post angles

1. "The parent finds out before lunch, not at the end of term." — parent — school-operations — Absence marked, parent notified, no phone call needed.
2. "Fee reminders that don't travel in a schoolbag." — finance — school-operations — Fee-due and overdue notices go to parents and students on a schedule.
3. "How to choose which notices you get — and when." — parent — school-operations — A walk through the preferences grid and quiet hours.
4. "Your bell, in Arabic, pointing at exactly what needs you." — teacher — product-proof — Show the bell, the type label and tap-through to the right page.
5. "How does a parent at your school hear about an absence today?" — principal — school-operations — A question to owners: call, paper note, or nothing?

## Connects to

- [Messages](../messaging/SPOTLIGHT.md)
- [WhatsApp](../whatsapp/SPOTLIGHT.md)
- [Communication](../communication/SPOTLIGHT.md)
- [Parent portal](../parent-portal/SPOTLIGHT.md)
- [Attendance](../attendance/SPOTLIGHT.md)
- [Offline and home-screen install](../../offline/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/notifications/README.md
- src/components/school-dashboard/notifications/ISSUE.md
- src/components/school-dashboard/notifications/config.ts
- src/components/school-dashboard/notifications/preferences-form.tsx
- src/components/school-dashboard/notifications/email-service.ts
- content/docs-en/notifications.mdx
- content/docs-en/offline.mdx
- content/docs-en/marketing-brief.mdx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/notifications/
- src/components/internationalization/dictionaries/en/notifications.json
