---
feature: offline
title: Slow Connections and Home Screen Install
status: partial
pillar: trust
personas: [teacher, parent, student, principal, owner]
routes: [/ar/s/{school}/offline, /ar/s/{school}/attendance, /ar/s/{school}/dashboard]
screenshots: []
readme: ./README.md
docs: content/docs-en/offline.mdx
updated: 2026-09-27
---

# Slow Connections and Home Screen Install — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Balqalam installs to a phone's home screen like an app, and it is built so a weak or dropping signal does not throw away a teacher's work.

## The school's day without it

The teacher stands in a classroom where the signal comes and goes. She marks the register on her phone, taps save, and the screen spins and fails. She writes the absentees on paper instead and types them again at the office, if she remembers. Parents on prepaid data give up on a website that takes a minute to open.

## What happens in Balqalam

1. A parent, teacher or student opens the school's own address on a phone and signs in. A sheet slides up offering to add the school to the home screen; one tap on Continue starts the phone's own install step.
2. The icon on the home screen carries the school's name, opens full screen, right-to-left in Arabic, in the school's colour.
3. A teacher opens quick attendance, marks the absentees and saves. If there is no connection at that moment, the marks are kept on the phone instead of being lost.
4. When the connection returns, the saved marks are sent on their own, without the teacher doing anything. Parents get the absence message once the marks reach the school, not before.
5. If the school already holds a newer mark for the same class and day, the newer one wins, so an old phone cannot overwrite a correction.
6. If something is turned back by the school's system, a small strip says how many items need attention and links to a page where the person can retry or discard them.

## Who it is for

- **Teacher**: a register marked on a bad signal is kept and sent later, not lost.
- **Parent**: the school sits on the home screen next to their other apps, in Arabic, with no app store download.
- **Student**: lesson progress, quiz answers and assignment text done on a weak connection are kept on the phone and sent when it returns.
- **Principal and owner**: the system was designed around the connections their staff and families actually have.

## Real screens to show

None yet — capture with /record. Suggested captures, on a real phone, in Arabic:

- The install sheet sliding up on the dashboard, then the icon on the home screen (`/ar/s/{school}/dashboard`).
- Quick attendance saved with no signal, then the marks arriving after the signal returns (`/ar/s/{school}/attendance`).
- The school's own "this page isn't on this device yet" screen instead of the browser's error page (`/ar/s/{school}/offline`).

Do not film the install sheet's small description line: it currently says "works offline", which we may not claim (see below).

## What you can say

- It opens in any browser and installs to your phone's home screen. There is no app-store app. [marketing-brief.mdx, install-card.tsx]
- The home screen icon carries the school's own name, opens in Arabic, right-to-left, in the school's colour. [src/app/manifest.ts]
- On Android the install sheet opens the phone's real install prompt; on iPhone it opens the share sheet where you choose Add to Home Screen. [install-card.tsx, docs-en/offline.mdx]
- Built for slow connections: a quick attendance register saved without a connection is kept on the phone and sent automatically when the connection returns. [attendance/quick/content.tsx, docs-en/offline.mdx]
- The same keeping-and-sending applies to lesson progress, lesson completion, quiz answers and assignment text. [README.md]
- Anything the school turns back is never silently dropped: it waits on a page where the person can retry or discard it. [README.md, outbox-view.tsx]
- On a shared phone, signing out clears the previous person's saved pages, so the next person never sees them. [docs-en/offline.mdx, forget-saved-pages.tsx]
- Videos and teaching materials are never copied onto a phone, by school policy; they are watched inside the app. [docs-en/offline.mdx, CLAUDE.md]

## Do not say

- "Works offline", "no internet needed", or "use it anywhere with no signal". Banned in the claims registry. Say "built for slow connections" instead. (The install sheet's own small print still says "works offline" in both languages; do not quote or film it.)
- "Download our app" or "on the App Store / Google Play". There is no store app.
- That exam submissions or bus boarding are kept on the phone when the signal drops. Both are still open items in ISSUE.md.
- That lessons or videos download for later. Downloading was withdrawn on 2026-08-30 by school policy.
- That phone notifications and the offline screen are proven on real phones. Tooling checks pass, but the real-phone check is still an open item (hogwarts#408).
- Any speed number, storage size, or percentage from the engineering doc. Its targets and school counts are plans or outdated, not results.
- That screenshots of lessons can be blocked. An installed web app cannot block screenshots.

## Post angles

1. "The signal dropped. The register didn't." — teacher — trust — a teacher saves attendance in a dead corner of the school and it arrives on its own later.
2. "Your school, on the home screen. No app store." — parent — product-proof — show the tap-to-install sheet and the icon with the school's name in Arabic.
3. "How to add your school to your phone in two taps" — parent — product-proof — a short how-to for Android and iPhone, for schools to share with families.
4. "Built for the connections our teachers actually have" — principal — trust — why a school system for Sudan has to be designed for weak mobile data, not office Wi-Fi.
5. "What happens to your work when the internet cuts out mid-save?" — owner — trust — ask the reader, then answer with the keep-and-send behaviour and the retry page.

## Connects to

- [Attendance](../school-dashboard/attendance/SPOTLIGHT.md)
- [Notifications](../school-dashboard/notifications/SPOTLIGHT.md)
- [Arabic-first interface](../internationalization/SPOTLIGHT.md)

## Sources

- src/components/offline/README.md
- src/components/offline/ISSUE.md
- src/components/offline/CLAUDE.md
- src/components/offline/content.tsx
- src/components/offline/install-card.tsx
- content/docs-en/offline.mdx
- content/docs-en/marketing-brief.mdx
- src/app/manifest.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/layout.tsx
- src/app/[lang]/s/[subdomain]/offline/page.tsx
- src/components/school-dashboard/attendance/quick/content.tsx
- src/components/internationalization/lumos-en.json and lumos-ar.json (offline strings)
