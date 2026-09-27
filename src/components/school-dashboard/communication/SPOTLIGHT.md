---
feature: communication
title: Communication centre
status: partial
pillar: school-operations
personas: [principal, owner, registrar]
routes: [/ar/s/{school}/school/communication, /ar/s/{school}/school/communication/broadcast, /ar/s/{school}/school/communication/templates, /ar/s/{school}/school/communication/settings]
screenshots: []
readme: ./README.md
docs: content/docs-en/notifications.mdx
updated: 2026-09-27
---

# Communication centre — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school office's control room for messages that go to many people at once: send a notice to all teachers or to one class, keep reusable message wording, and set the school's defaults for announcements.

## The school's day without it

The secretary types the same notice into five WhatsApp groups, forgets the sixth, and cannot tell who received it. A circular goes home on paper. Next term somebody writes the fee reminder from scratch again, with different wording.

## What happens in Balqalam

1. From the school settings area the administrator opens Communication and sees a summary: how many announcements exist and are active, how many message templates are set up, how many notifications went out this month, and the latest broadcasts.
2. On Broadcast they choose the kind of message, write a title and text, and pick who receives it — everyone with a given role (for example all teachers or all parents), or the students of one class.
3. They press Send. Each recipient gets it in their notification bell and, where their settings allow, by email. The broadcast list shows how many were sent and whether it completed.
4. On Templates they keep standard wording for recurring notices — fee due, grade posted, attendance alert, event reminder and others — per channel and language.
5. On Settings they set the school's defaults for announcements: default audience, priority, how long an announcement stays up, quiet hours, and when old ones are archived.

## Who it is for

- Principal / owner: one place to reach a whole group of the school at once, and a record of what was sent and how many received it.
- Registrar / school office: standard wording that does not have to be rewritten every term.

## Real screens to show

- None yet — capture with /record.
- Routes to capture (log in as admin@ on the demo): the summary at `/ar/s/{school}/school/communication` and the broadcast form at `/ar/s/{school}/school/communication/broadcast`. Note: these screens currently show English labels even in the Arabic interface — prefer showing Announcements for Arabic visuals.

## What you can say

- An administrator can send one message to everyone in a role — all teachers, all parents, all accountants — or to the students of a class. [school/communication/broadcast/actions.ts, notifications/email-service.ts]
- Each broadcast arrives in the recipient's notification bell and, where their settings allow, by email. [notifications/email-service.ts]
- The office sees each broadcast's result: how many were sent out of how many, and whether it completed or failed. [school/communication/content.tsx]
- The school can keep ready-made wording for recurring notices, per channel and in Arabic or English. [school/communication/templates/actions.ts, school/communication/validation.ts]
- The school sets its own defaults for announcements — audience, priority, expiry and archiving. [school/communication/settings/actions.ts]

## Do not say

- "SMS broadcasts" — there is no text-message provider; broadcasts go to the in-app bell and email only.
- "Send to the whole school in one click" — the broadcast form needs a role or a class; leaving both empty reaches no one.
- That a class broadcast reaches parents — picking a class reaches the students of that class. To reach parents, pick the parent role.
- "Schedule broadcasts for later" from this screen — the system can send scheduled broadcasts, but the form has no date picker yet.
- "Daily digest" — the setting exists but does nothing yet.
- That these admin screens are fully in Arabic — their labels are still English.
- "Unified inbox" or live chat here — the older all-in-one communication hub in this folder is a mock-up that no page uses. Chat lives in Messages.
- Any open-rate, reach or time-saved figure.

## Post angles

1. "One notice. Every parent. No copy-paste into six groups." — principal — school-operations — The secretary's six-WhatsApp-groups routine versus one broadcast to the parent role.
2. "Know how many people your notice actually reached." — owner — product-proof — Show the broadcast list with its sent count and status.
3. "Write the fee reminder once. Use it every term." — registrar — school-operations — Templates for recurring notices, in Arabic.
4. "How to send a notice to all teachers before the morning meeting." — principal — school-operations — Broadcast form, role = teachers, send.
5. "How many places does your school post the same announcement?" — owner — school-operations — A question post about duplicated notices across groups, paper and calls.

## Connects to

- [Announcements](../listings/announcements/SPOTLIGHT.md)
- [Notifications](../notifications/SPOTLIGHT.md)
- [Messages](../messaging/SPOTLIGHT.md)
- [WhatsApp](../whatsapp/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/communication/README.md
- src/components/school-dashboard/communication/ISSUE.md
- src/components/school-dashboard/communication/CLAUDE.md
- src/components/school-dashboard/communication/hub.tsx
- src/components/school-dashboard/school/communication/content.tsx
- src/components/school-dashboard/school/communication/validation.ts
- src/components/school-dashboard/school/communication/broadcast/actions.ts
- src/components/school-dashboard/school/communication/broadcast/form.tsx
- src/components/school-dashboard/school/communication/templates/actions.ts
- src/components/school-dashboard/school/communication/settings/actions.ts
- src/components/school-dashboard/school/communication/settings/form.tsx
- src/components/school-dashboard/notifications/email-service.ts
- src/components/school-dashboard/school/content.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/school/communication/
- content/docs-en/notifications.mdx
- content/docs-en/marketing-brief.mdx
