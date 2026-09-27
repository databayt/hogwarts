---
feature: announcements
title: Announcements
status: partial
pillar: school-operations
personas: [principal, teacher, parent, student]
routes: [/ar/s/{school}/announcements, /ar/s/{school}/announcements/{id}, /ar/s/{school}/announcements/templates, /ar/s/{school}/parent/announcements]
screenshots: [demo-announcements-ar.png]
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Announcements — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school writes a notice once, chooses who it is for — the whole school, one class, or one group such as teachers — and it lands in those people's notifications and on their dashboard.

## The school's day without it

A notice about winter uniform or exam dates is printed, sent home in bags, pinned on a board, and forwarded through three WhatsApp groups. Some parents never see it; teachers get messages meant for parents; nobody can find last month's notice when a parent says "we were never told".

## What happens in Balqalam

1. An administrator presses the plus button on the Announcements page. A form opens in place: title, message, priority (low, normal, high, urgent), and who it is for — the whole school, one class, or one role such as teachers or parents.
2. The announcement is saved as a draft. It shows in the list with its scope and a draft or published label.
3. From the row's menu, the administrator publishes it. Everyone in the chosen audience gets a notification in the bell at the top of their screen, linking to the announcement.
4. Parents and students open Announcements and see only what was published for them — the whole school, their role, or their child's class. Drafts and staff-only notices stay hidden.
5. A notice written in Arabic is shown translated to English readers, and the reverse, so a bilingual school writes once.
6. On a phone the list turns into cards; on a computer it is a table that can be searched, filtered, and downloaded as a spreadsheet file.

## Who it is for

- **Principal / administrator:** one place to write, target and publish school notices, with a searchable history and a draft stage before anything goes out.
- **Teacher:** can write and publish announcements for their own class only.
- **Parent:** sees the notices meant for them and their child's class, with a notification when a new one is published.
- **Student:** sees school-wide notices and those for their class.

## Real screens to show

- `demo-announcements-ar.png` — the Arabic announcements list: Quran competition, welcome to the 2025-2026 year, winter holiday dates, exam schedule, teacher's day, each with scope (school, class, role) and published or draft label.
- Still to capture: the create form (`/ar/s/{school}/announcements`, plus button), a published announcement's reading page (`/ar/s/{school}/announcements/{id}`), the notification bell after publishing, and the parent view (`/ar/s/{school}/parent/announcements`) on a phone.

## What you can say

- Target an announcement to the whole school, one class, or one role (for example teachers or parents). [wizard/content/validation.ts]
- Four priority levels: low, normal, high, urgent. [wizard/content/validation.ts]
- Publishing sends a notification to everyone in the chosen audience, inside Balqalam. [actions.ts]
- Parents and students see only the published notices meant for them. [ISSUE.md 2026-09-13, queries.ts]
- Teachers can post to their own class; only administrators post to the whole school. [authorization.ts, README.md]
- Written once in Arabic or English, shown to each reader in their language. [content.tsx, actions.ts]
- The list downloads as a spreadsheet (CSV) file. [table.tsx]
- A templates tab lists ready-made announcement templates. [template-actions.ts, templates/page.tsx]

## Do not say

- No "sent by WhatsApp", "sent by email" or "push to phone" for announcements. Publishing creates an in-app notification only. WhatsApp exists in Messaging, not here. [actions.ts, ISSUE.md]
- No "see who read it", read receipts or unread counts — not built. [ISSUE.md]
- No "schedule it for next Monday": the scheduling fields are not in the live create form. [wizard/content/form.tsx]
- No bulk publish or bulk delete — not built.
- No attachments (PDF, images) and no rich text formatting — not built.
- Do not show or promote the Archived tab: it does not load anything yet. [ISSUE.md 2026-09-13]
- Do not say "templates fill the form for you" — templates are listed, not applied from the create form.
- No read-rate analytics, no percentages or time saved, no "works offline", no app-store app.

## Post angles

1. "The uniform notice went to three WhatsApp groups. Half the parents missed it." — parent — school-operations — One notice, the right audience, a notification on their screen.
2. "Write it once in Arabic. English-speaking parents read it in English." — principal — product-proof — Automatic translation on display for bilingual schools.
3. "How a teacher tells only Grade 5B that the physics class moved." — teacher — school-operations — Class-scoped announcement walkthrough.
4. "Draft first, publish when ready." — principal — trust — Nothing leaves the office until an administrator publishes it.
5. "How many channels does a notice pass through at your school before parents see it?" — owner — school-operations — A question post about today's paper, board and group chats.

## Connects to

- [Events](../events/SPOTLIGHT.md)
- [Dashboard](../../dashboard/SPOTLIGHT.md)
- [Notifications](../../notifications/SPOTLIGHT.md)
- [Parent portal](../../parent-portal/SPOTLIGHT.md)
- [Messaging](../../messaging/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/listings/announcements/README.md
- src/components/school-dashboard/listings/announcements/ISSUE.md
- src/components/school-dashboard/listings/announcements/actions.ts
- src/components/school-dashboard/listings/announcements/authorization.ts, guard.ts, queries.ts
- src/components/school-dashboard/listings/announcements/columns.tsx, table.tsx, content.tsx
- src/components/school-dashboard/listings/announcements/template-actions.ts
- src/components/school-dashboard/listings/announcements/wizard/actions.ts, wizard/modal.tsx
- src/components/school-dashboard/listings/announcements/wizard/content/form.tsx, validation.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/announcements/ (list, [id], templates)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/announcements
- src/components/school-dashboard/parent-portal/announcements/actions.ts
- src/lib/dispatch-notification.ts
- src/app/api/cron/publish-announcements/route.ts, cf/crons.json
- src/routes.ts
- content/docs-en/messages.mdx, content/docs-en/notifications.mdx, content/docs-en/marketing-brief.mdx
- demo-announcements-ar.png
