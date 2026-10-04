---
feature: whatsapp
title: WhatsApp
status: partial
pillar: school-operations
personas: [principal, owner, teacher, parent]
routes: [/ar/s/{school}/whatsapp, /ar/s/{school}/messages]
screenshots: []
readme: ./README.md
docs: content/docs-en/messages.mdx
updated: 2026-09-27
---

# WhatsApp — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school links its own WhatsApp number to Balqalam once, by scanning a code, and messages from the system can then reach parents on the WhatsApp they already use — and their replies come back into the school's inbox.

## The school's day without it

Parents live on WhatsApp, so the school does too — but from a secretary's personal phone. Class groups are made by hand, numbers are copied one by one from a register, and every reply stays on that one phone where nobody else can see it.

## What happens in Balqalam

1. The administrator opens the WhatsApp page and presses Connect. A QR code appears.
2. On the school's phone they open WhatsApp, go to Linked Devices, and scan it. The page shows "Connected" and stays connected across updates.
3. In any chat in Messages, a "W" switch in the header sends that conversation out on WhatsApp too, from the school's number; each bubble shows whether it was sent, delivered, read or failed.
4. When the parent replies on WhatsApp, the reply lands in the same conversation in Balqalam.
5. From the Groups tab the administrator can create a WhatsApp group of a section's parents in one step, using the parent phone numbers already on file.
6. The administrator can send one message to several groups at once, and keep ready-made message templates for attendance, fees, grades, events and emergencies.
7. The page shows how many groups exist, how many messages went out today, and the daily limit.

## Who it is for

- Principal / owner: the school speaks from one official number, not from staff phones, and can see the replies.
- Teacher: can reach a parent on WhatsApp from inside a Balqalam chat (when the school has switched it on).
- Parent: gets school messages where they already read everything — no new app to learn.

## Real screens to show

- None yet — capture with /record.
- Routes to capture: the WhatsApp page with its Connection, Groups, Messages and Templates tabs at `/ar/s/{school}/whatsapp` (log in as admin@), and a chat header with the "W" switch at `/ar/s/{school}/messages`. Do not show a real QR code or a real phone number.

## What you can say

- A school links its own WhatsApp number by scanning a QR code from the dashboard, the same way you link WhatsApp to a computer. [dictionaries/en/whatsapp.json, docs-en/messages.mdx]
- A chat in Balqalam can be sent out on WhatsApp from the school's number, and replies come back into the same conversation. [docs-en/messages.mdx]
- Each message shows its WhatsApp status: sent, delivered, read or failed; failed sends are retried automatically. [README.md, docs-en/messages.mdx]
- A WhatsApp group for a section's parents can be created in one step from the parent numbers already in the system. [actions.ts]
- Admins can keep reusable message templates by type — attendance, fees, grades, events, emergency and more. [dictionaries/en/whatsapp.json]
- Sending is paced to protect the school's number: one message a second and up to 500 direct messages a day. [docs-en/messages.mdx]

## Do not say

- That any school is using it today. It is built, but no school has linked its number yet — not even the pilot school.
- "Official WhatsApp Business API" or "verified business account". It works by linking the school's own WhatsApp as a linked device.
- That WhatsApp messages go out automatically for everything. A chat goes to WhatsApp only when its "W" switch is on, and notices go to WhatsApp only if a person opts in.
- That it works without a phone. Someone with the school's phone must scan the QR code once, and again if the link is removed.
- Unlimited or bulk messaging — the daily limit is 500 direct messages per school.
- Photos and files sent from WhatsApp showing everywhere — media handling is still being finished.
- Show a real parent's phone number or face in any screenshot.

## Post angles

1. "Stop running the school from the secretary's personal phone." — principal — school-operations — One official school number, linked once, replies visible to the school.
2. "Scan once. Your school is on WhatsApp." — owner — product-proof — Show the Connect button and the QR step (with a dummy code).
3. "How to make a WhatsApp group for Grade 5 parents in one step." — teacher — school-operations — The Groups tab pulls parent numbers from the register; no copying numbers by hand. Post only after a school has linked its line.
4. "The parent answers on WhatsApp. The teacher reads it in Balqalam." — parent — school-operations — The round trip, told from both sides.
5. "How many staff phones hold your school's parent conversations?" — owner — school-operations — A question post about scattered WhatsApp groups.

## Connects to

- [Messages](../messaging/SPOTLIGHT.md)
- [Notifications](../notifications/SPOTLIGHT.md)
- [Communication](../communication/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/whatsapp/README.md
- src/components/school-dashboard/whatsapp/ISSUE.md
- src/components/school-dashboard/whatsapp/CLAUDE.md
- src/components/school-dashboard/whatsapp/actions.ts
- src/components/school-dashboard/whatsapp/authorization.ts
- src/components/school-dashboard/whatsapp/content.tsx
- src/components/school-dashboard/messaging/README.md
- src/lib/whatsapp/dispatch.ts
- content/docs-en/messages.mdx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/whatsapp/page.tsx
- src/components/internationalization/dictionaries/en/whatsapp.json
