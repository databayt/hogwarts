---
feature: messaging
title: Messages
status: live
pillar: school-operations
personas: [teacher, parent, student, principal]
routes: [/ar/s/{school}/messages, /ar/s/{school}/messages?conversation={id}]
screenshots: [student-messages.png]
readme: ./README.md
docs: content/docs-en/messages.mdx
updated: 2026-09-27
---

# Messages — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A private chat inside the school's own system, where teachers, parents, students and staff message each other one-to-one or in groups — and it looks and feels like WhatsApp.

## The school's day without it

A teacher's personal number sits in thirty parents' phones and the class WhatsApp group buzzes at 11 at night. A parent asks about homework in a group of forty families. When a teacher leaves, the conversation history leaves with her phone, and the school never saw any of it.

## What happens in Balqalam

1. The user taps the envelope icon in the top bar (it shows how many messages are unread) and a full-screen chat opens.
2. On a phone it looks like the WhatsApp app: a list of chats with filters for All, Unread, Favourites and Groups, and a tab bar along the bottom.
3. They pick a person from a contact list grouped by role — teachers, parents, students, staff — or start a group chat.
4. They type and send. The message appears instantly with a small clock, then a tick once the school's system has it; it turns blue when read.
5. On a computer the same chat opens as a split screen, with replies, reactions, file and photo attachments, editing, deleting and search.
6. The Updates tab on the phone shows the school's announcements meant for that reader; the Calls tab lists their live classes, marked attended, missed, upcoming or live.
7. Every conversation belongs to the school — people can only message members of their own school.

## Who it is for

- Teacher: talk to a parent without handing out a personal number; keep class groups in one place.
- Parent: message the child's teachers and the school office from the phone, in Arabic.
- Student: message teachers and classmates in a space the school runs.
- Principal / owner: school conversations stay on the school's system, not scattered across staff phones.

## Real screens to show

- `student-messages.png` — the phone chat list in Arabic: search bar, filter chips, named chats and a class group, bottom tab bar. Crop out the red "1 Issue" developer badge in the bottom corner.
- More to capture with /record: an open conversation on a phone at `/ar/s/{school}/messages` (log in as parent@ on the demo — the demo inboxes are seeded with real-looking threads), and the desktop split screen at the same route.

## What you can say

- Teachers, parents, students and staff can message one another one-to-one or in groups, inside the school's own system. [README.md, docs-en/messages.mdx]
- On a phone it looks and behaves like WhatsApp — chat list, filters, bubbles, ticks, day separators — and the whole thread mirrors correctly in Arabic. [docs-en/messages.mdx]
- A sent message appears on screen immediately, and a message that failed shows a red mark and can be resent with a tap. [ISSUE.md]
- Arabic messages are searchable. [ISSUE.md, docs-en/messages.mdx]
- A parent can only reach the school's own teachers and office; people only ever message within their own school. [README.md]
- A new message or a mention also lands in the person's notification bell. [docs-en/messages.mdx]
- Anyone can try it now on the public demo with the parent@, teacher@ or student@ login. [docs-en/marketing-brief.mdx, docs-en/messages.mdx]

## Do not say

- "End-to-end encrypted." The chat screen shows a WhatsApp-style encryption card, but messages are stored on the school's server and are searchable there. Never quote, crop or caption that card as a claim.
- "Voice and video calls." There are no call buttons and no calling; the Calls tab lists live classes, not phone calls.
- "Real-time" or "delivered" as a promise. The live-push server is not running yet; the app checks for new messages every few seconds instead, and the double "delivered" tick does not appear.
- Attachments, reactions, replies, editing and voice notes on the phone — these are desktop-only today.
- Class, department or announcement channels created from the chat — only one-to-one and group chats can be created.
- That every chat goes out on WhatsApp — that only happens when the school has linked its own WhatsApp number (see WhatsApp), and no school has done so yet.
- "Works offline", "download our app", or any usage or time-saved figure.

## Post angles

1. "Your teachers shouldn't have to give parents their personal number." — teacher — school-operations — The late-night class-group problem, answered by chat that belongs to the school.
2. "It looks like WhatsApp. It belongs to your school." — principal — product-proof — Show the phone chat list side by side with what parents already know.
3. "How a parent messages a teacher in three taps." — parent — school-operations — Envelope icon, pick the teacher from the list, send.
4. "A day in the inbox of a class teacher." — teacher — school-operations — Parent questions, a class group, and a colleague thread, all in one place in Arabic.
5. "Where do your school's conversations live today?" — owner — school-operations — A question post: staff phones, family groups, or the school's own system?

## Connects to

- [WhatsApp](../whatsapp/SPOTLIGHT.md)
- [Notifications](../notifications/SPOTLIGHT.md)
- [Communication](../communication/SPOTLIGHT.md)
- [Parent portal](../parent-portal/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/messaging/README.md
- src/components/school-dashboard/messaging/ISSUE.md
- src/components/school-dashboard/messaging/CLAUDE.md
- content/docs-en/messages.mdx
- content/docs-en/marketing-brief.mdx
- src/app/[lang]/s/[subdomain]/(school-messaging)/messages/page.tsx
- src/components/internationalization/dictionaries/en/messaging.json
- src/components/internationalization/dictionaries/ar/messaging.json
- student-messages.png
