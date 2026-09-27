---
feature: translation
title: Content Translation
status: partial
pillar: product-proof
personas: [principal, registrar, teacher, parent, owner]
routes: [/ar/s/{school}/announcements, /en/s/{school}/announcements, /en/s/{school}/events, /en/s/{school}/parent/announcements]
screenshots: []
readme: ./README.md
docs: content/docs-en/translation.mdx
updated: 2026-09-27
---

# Content Translation — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Staff write an announcement, an event or a subject name once, in Arabic or English, and each reader sees it in the language they chose.

## The school's day without it

The school has Arabic-speaking staff and some English-speaking families or teachers. Every announcement is typed twice, or pasted into a translation website and back. Most of the time nobody bothers, and half the readers get a message they cannot read.

## What happens in Balqalam

1. A staff member writes content once, in whichever language they work in: an announcement, an event, a class or subject name, a notification.
2. As soon as it is saved, Balqalam prepares the other language in the background, so the first reader in that language does not wait.
3. A parent or teacher reading in English sees the English version; a reader in Arabic sees the Arabic one. The original stays as written.
4. Names of students, teachers and parents are shown in the reader's script as well.
5. Searching a list in one language also finds items written in the other, for example typing a name in English finds the same name written in Arabic, once its translation exists.
6. A nightly check fills in translations for older content, new schools and bulk imports, so nobody has to remember to do it.

## Who it is for

- **Principal and registrar**: write once, in their own language, and reach every family.
- **Teacher**: an English-speaking teacher can read Arabic announcements and class names, and the reverse.
- **Parent**: announcements, events and notifications appear in the language they picked.
- **Owner**: a school with mixed-language staff and families runs on one system without a translator.

## Real screens to show

None yet — capture with /record. Suggested captures:

- An announcement written in Arabic at `/ar/s/{school}/announcements`, then the same announcement read at `/en/s/{school}/announcements`.
- The parent's announcements and events in English at `/en/s/{school}/parent/announcements`.
- A list search in English that finds an Arabic-written name.

Check every capture for leftover untranslated lines before posting.

## What you can say

- Content is written once, in one language, and shown in each reader's language. [README.md, docs-en/translation.mdx]
- It covers announcements, events, notifications, class and subject names, departments, exams, fee names, library books and courses. [registry.ts]
- The other language is prepared the moment content is saved, so the first reader is not kept waiting. [README.md, prewarm.ts]
- Search works across both languages for names and content that already have a translation. [search.ts]
- If the translation service is unavailable, pages still open: text shows in its original language and names are spelled out in Latin letters. [README.md, engine.ts]
- A nightly job fills in translations for older content and new schools on its own. [README.md, sweep.ts]

## Do not say

- That chat messages are translated. Real-time chat is not part of this; only the content types listed above are.
- That translations are done or checked by people. They are machine translations. A human correction can be stored, but there is no screen for staff to edit a translation today.
- That every piece of content is translated. Transport route names are the one remaining feature not yet covered (ISSUE.md), and platform-wide catalogue content can stay in its original language on some screens.
- "Instant, perfect translation", or naming the translation providers in marketing.
- That it translates into any language. There are two: Arabic and English.
- That the whole screen is translated by this feature. Menus and buttons are the separate Arabic-first interface feature.

## Post angles

1. "Write it once. Every parent reads it in their language." — principal — product-proof — one Arabic announcement, shown as the English version a parent sees.
2. "No more typing every announcement twice" — registrar — school-operations — the before scene of double typing, then the single post.
3. "How your English-speaking teachers read Arabic announcements" — teacher — product-proof — a short how-to: switch language, read the same notice.
4. "A parent's view: the school finally writes to me in my language" — parent — product-proof — a family that prefers English receiving events and notices.
5. "How many languages does your school write its notices in?" — owner — product-proof — ask the reader, answer: one, and Balqalam handles the second.

## Connects to

- [Arabic-first interface](../internationalization/SPOTLIGHT.md)
- [Communication](../school-dashboard/communication/SPOTLIGHT.md)
- [Notifications](../school-dashboard/notifications/SPOTLIGHT.md)
- [Parent portal](../school-dashboard/parent-portal/SPOTLIGHT.md)

## Sources

- src/components/translation/README.md
- src/components/translation/ISSUE.md
- src/components/translation/CLAUDE.md
- src/components/translation/registry.ts
- src/components/translation/search.ts
- src/components/translation/actions.ts
- content/docs-en/translation.mdx
- content/docs-en/marketing-brief.mdx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/announcements/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/announcements/page.tsx
- cf/crons.json (nightly translation job)
