---
feature: attendance
title: Attendance
status: partial
pillar: school-operations
personas: [teacher, principal, registrar, parent, student]
routes: [/ar/s/{school}/attendance, /ar/s/{school}/attendance/manual, /ar/s/{school}/attendance/excuses, /ar/s/{school}/attendance/early-warning, /ar/s/{school}/attendance/reports, /ar/s/{school}/attendance/records]
screenshots: [quick-mobile-ar.png, quick-mobile-saved.png, attendance-overview-ar-after.png, attendance-excuses.png, attendance-manual-loaded.png, attendance-settings-ar-after.png]
readme: ./README.md
docs: content/docs-en/attendance.mdx
updated: 2026-09-27
---

# Attendance — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Teachers take the register on their phone in a few taps, parents hear about an absence, and the office sees at a glance which classes have not been marked yet.

## The school's day without it

Each teacher fills a paper register, a runner carries the sheets to the office, and someone retypes them into a spreadsheet by the end of the week. Parents learn about an absence days later, if at all, usually from a phone call or a WhatsApp message someone remembered to send. Sick notes arrive on scraps of paper and get lost. Nobody notices a student slipping into chronic absence until it shows up in the term report.

## What happens in Balqalam

1. A teacher opens Attendance on their phone and lands straight on the quick register. Their own classes are already there, with the class for the current period first.
2. Everyone starts as present. The teacher taps only the exceptions: one tap marks absent, a second tap marks late, a third sets them back to present. A search box jumps to a name.
3. One Save sends the whole class. The screen confirms the count (for example "27 present, 2 absent, 1 late"), says how many guardians were notified, and offers a "Message guardian" button next to each absent child.
4. Parents of absent children get a notification in the app. A parent can send an excuse (medical, family emergency, religious, school activity, transport, weather, other) and staff approve or reject it; an approved excuse turns the absence into an excused one.
5. The principal's overview shows today's present, absent and late counts, the classes not yet marked, and a "needs attention" list. On a non-school day it simply says there is no school today.
6. Staff can also mark by class and date on a desktop table, by QR code, by barcode card, or by uploading a spreadsheet, and export reports as CSV, Excel or a branded PDF.
7. An early-warning list sorts students by attendance risk, and staff can log follow-up actions (parent contact, home visit, counsellor referral and others) against each student.

## Who it is for

- **Teacher**: the register in seconds on a phone, only tapping the absent and late students, plus a check-in and check-out card for their own working day.
- **Principal**: one screen showing who is missing today, which classes are still unmarked, and which students are drifting into chronic absence.
- **Registrar**: reports filtered by class, student, status and date, exported to Excel, CSV or PDF.
- **Parent**: a notification when their child is marked absent, the child's attendance history, and a way to send an excuse.
- **Student**: their own attendance record and history.

## Real screens to show

- `quick-mobile-ar.png` — the teacher's quick register on a phone, in Arabic, with one student tapped absent (red "غائب" tag) and the Save button.
- `quick-mobile-saved.png` — the confirmation after saving: 27 present, 2 absent, 1 late, "2 guardians notified", Message guardian buttons (English interface).
- `attendance-overview-ar-after.png` — the principal's overview in Arabic: today's counts, "no school today" note, the needs-attention list, quick-access tiles.
- `attendance-excuses.png` — pending excuse requests from parents with reason tags and a Review button (English interface, Arabic names).
- `attendance-manual-loaded.png` — the desktop class register with All Present / All Absent / All Late buttons.
- `attendance-settings-ar-after.png` — the school's attendance settings in Arabic.
- Note: most of these show a small red development badge ("1 Issue") in a corner — crop it out before posting.
- To capture more (with /record, Arabic): `/ar/s/{school}/attendance` as a teacher on a phone, `/ar/s/{school}/attendance/early-warning`, `/ar/s/{school}/attendance/reports`, and the parent view at `/ar/s/{school}/attendance/records`.

## What you can say

- Teachers only tap the absent and late students — everyone else is marked present with one Save. [quick/content.tsx, ISSUE.md "Quick Attendance"]
- After saving, the teacher sees how many guardians were notified and can message each absent child's guardian directly. [ISSUE.md "Quick Attendance", quick-mobile-saved.png]
- The register opens on the class the teacher is teaching right now, based on the timetable. [README.md "Quick Attendance"]
- Parents can send an excuse from their side; the school reviews it and an approved excuse marks the absence as excused. [docs-en/attendance.mdx "Parent engagement"]
- The principal sees which classes have not been marked today. [README.md, ISSUE.md item 12]
- Several ways to take attendance: phone register, desktop table, QR code, barcode card, spreadsheet upload. [docs-en/attendance.mdx "Capture methods"]
- Attendance reports export to Excel, CSV and a branded PDF. [docs-en/attendance.mdx "Analytics & reports", reports/]
- An early-warning list groups students by attendance risk so staff can step in early. [docs-en/attendance.mdx "Early warning"]

## Do not say

- "Automatically submits attendance to ADEK" or any regulator. The system builds the daily ADEK file; the school registrar uploads it. The connector runs in dry-run mode. [docs-en/compliance.mdx]
- "Handles the 2-hour parent-contact rule automatically" — the mechanism exists for regulated UAE schools but is not proven in production; leave it out.
- "Works offline." A dropped-connection fallback exists for the quick register, but offline is on the global banned list. Say "built for slow connections" at most.
- "Absence letters go out on their own." The letters screen prepares letters, but email sending is not wired yet. [letters/actions.ts]
- "Parents get an SMS / WhatsApp for every absence." The guaranteed channel is the in-app notification; SMS depends on configuration, WhatsApp only for compliance-enabled schools. [actions/core.ts]
- "Geofence / GPS attendance" and "absence intentions" — present in the code but not localized and not in the menus; do not feature them. [ISSUE.md P2.3]
- "Biometric", "fingerprint" or "face recognition" attendance — not built. [ISSUE.md "Enhancements"]
- "AI predicts absences" or "advanced analytics" — the analytics and AI pages are not a finished marketing surface; say "reports on attendance".
- Any time or percentage saving ("saves X hours", "improves attendance by X%"), and any claim that a roster can be locked or finalized after submission — that is not built. [ISSUE.md "Enhancements"]
- Student faces or real student names from a live school without consent; the screenshots use demo names only.

## Post angles

1. "The register used to be a paper round. Now it's two taps." — teacher — school-operations — Pain scene: the sheet carried to the office versus the phone register where only absentees are tapped.
2. "27 present, 2 absent, 1 late — and both families already know." — principal — product-proof — Show the save confirmation with the guardians-notified line and Message guardian buttons.
3. "How to take attendance in Balqalam: open, tap the absent, save." — teacher — product-proof — A three-step how-to screen recording of the quick register in Arabic.
4. "Which of your classes hasn't been marked yet today?" — principal — school-operations — Question to the reader, answered by the overview's unmarked-classes view.
5. "Your child was absent. You can send the reason from your phone." — parent — school-operations — The parent's view: absence notification, then the excuse form and the school's review.

## Connects to

- [Timetable](../timetable/SPOTLIGHT.md) — the register opens on the class of the current period.
- [Dashboard](../dashboard/SPOTLIGHT.md) — today's attendance feeds the principal's home screen.
- [Announcements](../listings/announcements/SPOTLIGHT.md) — school-wide messages to the same families who receive absence notices.

## Sources

- src/components/school-dashboard/attendance/README.md
- src/components/school-dashboard/attendance/ISSUE.md
- src/components/school-dashboard/attendance/quick/ (content.tsx, clock-card.tsx)
- src/components/school-dashboard/attendance/letters/actions.ts
- src/components/school-dashboard/attendance/kiosk/actions.ts
- src/components/school-dashboard/attendance/actions/core.ts (absence notification channels)
- src/components/school-dashboard/attendance/reports/ (excel-generator.ts, pdf-generator.tsx, export-button.tsx)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/page.tsx and its sub-route folders
- content/docs-en/attendance.mdx
- content/docs-en/compliance.mdx
- content/docs-en/marketing-brief.mdx
- Repo-root screenshots: quick-mobile-ar.png, quick-mobile-saved.png, quick-attendance-teacher-mobile.png, attendance-overview-ar-after.png, attendance-excuses.png, attendance-manual-loaded.png
