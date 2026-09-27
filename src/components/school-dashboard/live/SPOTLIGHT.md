---
feature: live
title: Live Classes
status: partial
pillar: school-operations
personas: [principal, teacher, student, parent]
routes: [/ar/s/{school}/live, /ar/s/{school}/live/dashboard, /ar/s/{school}/live/schedule, /ar/s/{school}/live/settings, /ar/s/{school}/live/{class}, /ar/s/{school}/live/{class}/room, /ar/s/{school}/live/{class}/recordings]
screenshots: [live-mobile-admin-before.png]
readme: ./README.md
docs: content/docs-en/live.mdx
updated: 2026-09-27
---

# Live Classes — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

When a school has to teach online — for a day, a week or for good — the timetable it already keeps becomes the day's live classes, and students join from the same place they check their timetable.

## The school's day without it

The night the school decides to close its building, the principal and teachers scramble: meeting links are created one by one and pasted into a dozen WhatsApp groups. Students click the wrong link or an old one. Nobody takes attendance, and a student who missed the class has nothing to catch up on.

## What happens in Balqalam

1. The principal says once how the school teaches: in person, online, or a mix (by grade or by section). If something closes the building, "Go online temporarily" switches classes online from a start date, and back again when it ends.
2. Every school morning, Balqalam creates a live class for each lesson on the timetable. Teachers do not schedule classes one by one.
3. A few minutes before each class, students and the teacher get a reminder. Join appears on the timetable's "Today" cards, on the Live classes page and in the reminder.
4. The class meets either through the school's own meeting links (Google Meet, Zoom or Teams links the school pastes in, with one standing link as a fallback) or in Balqalam's own classroom.
5. In Balqalam's own classroom the teacher has camera, microphone, screen share, a whiteboard, the lesson's PDF as synced slides, polls, a questions list and a raised-hands queue, and can remove someone. Students enter muted unless the class is set otherwise.
6. After the class, if the school has turned it on, attendance is written from how long each student was actually in the room. A recorded class becomes the lesson's video, watched inside the app.
7. Parents can open their child's timetable and join as a silent observer, if the school allows it.

## Who it is for

- **Principal**: one switch to move the school, a grade or a section online, a dated "go online temporarily" for emergencies, and a panel showing which classes still lack a meeting link.
- **Teacher**: classes that appear on their own from the timetable, one Join button, and classroom tools (whiteboard, slides, polls, questions).
- **Student**: Join where their day already is, a reminder before class, and the recording afterwards if the class was recorded.
- **Parent**: the child's live classes on the parent timetable, with an observer seat if the school allows it.

## Real screens to show

- `live-mobile-admin-before.png` — the Live classes page on a phone in Arabic, as an admin: past classes, the "is the school ready to teach online" panel, and the "what you can do here" doors. An onboarding "quick guide" pop-up and a red development badge ("10 Issues") cover the top; recapture before posting.
- Routes to capture (Arabic, demo.balqalam.com): `/ar/s/{school}/live` as a student on a phone, `/ar/s/{school}/live/settings` as an admin (in person / online / hybrid and "go online temporarily"), a class card at `/ar/s/{school}/live/{class}`, and the timetable "Today" card showing Join.

## What you can say

- A school chooses in person, online or hybrid once, and can override it per grade or per section. [docs-en/live.mdx "If you run the school"]
- "Go online temporarily" takes a start date and an optional end date, and today's classes are created while the principal is still on the page. [docs-en/live.mdx "If you run the school"; README.md "Status"]
- Teachers do not create classes by hand: they appear each morning for every slot on the timetable. [docs-en/live.mdx "If you teach"; README.md "API"]
- Classes can run on the school's own Meet, Zoom or Teams links with no extra setup, with one standing link for any class that has none. [README.md; docs-en/live.mdx]
- Students get a reminder shortly before class and find Join on their timetable's Today card. [README.md "Status"; docs-en/live.mdx "If you are a student"]
- In Balqalam's own classroom: whiteboard, synced slides, polls, questions and raised hands. [docs-en/live.mdx "If you teach"; room/]
- Recordings play inside the app and cannot be downloaded from it. [docs-en/live.mdx "If you are a student"]

## Do not say

- "Built-in video classroom ready for every school." Balqalam's own classroom needs its video service switched on for the school; until then classes run on pasted meeting links. It has not yet been verified in a real live room. [RUNBOOK.md; ISSUE.md "Capture protection"]
- "Creates Zoom, Meet or Teams meetings for you." Those connections are built but switched off; schools paste their own links. [README.md "Status"]
- "Attendance takes itself" as a blanket claim. Automatic attendance is opt-in and only works in Balqalam's own classroom.
- "Recordings can't be screen-recorded" or "fully protected." A live class cannot be locked against recording; the watermark only traces leaks. [ISSUE.md "Capture protection"]
- "Works offline" or "works on any connection." Say: the picture steps down to audio and slides on a weak connection.
- "Download our app" — joining is in the browser; the phone app's live room is partial.
- Number of classes held, hours taught, or any school other than King Fahad Schools.

## Post angles

1. "The school closed at 9pm. Classes started at 8am, on time." — principal — school-operations — a pain scene turned proof: "Go online temporarily" and the timetable becoming live classes. (Illustrative scenario, not a real incident.)
2. "Your teachers don't schedule a single online class. The timetable does." — teacher — product-proof — classes appear each morning from the timetable.
3. "How to move one section online while the rest of the school stays in person" — principal — school-operations — a how-to on hybrid by grade or section.
4. "Where does a student find the Join button? Where they already look every morning." — student — school-operations — a persona view of Join on the Today card.
5. "If your school had to go online tomorrow, how many WhatsApp groups would you need?" — principal — school-operations — a question to the reader.

## Connects to

- [Timetable](../timetable/SPOTLIGHT.md)
- [Attendance](../attendance/SPOTLIGHT.md)
- [Lumos (online courses)](../../lumos/SPOTLIGHT.md)
- [Curriculum catalog](../../catalog/SPOTLIGHT.md)
- [Parent portal](../parent-portal/SPOTLIGHT.md)
- [Notifications](../notifications/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/live/README.md
- src/components/school-dashboard/live/ISSUE.md
- src/components/school-dashboard/live/RUNBOOK.md
- src/components/school-dashboard/live/room/ (file list: whiteboard, slides, side panel, control bar)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/live/ (route tree)
- src/app/[lang]/s/[subdomain]/(live-room)/live/[id]/room
- src/app/api/cron/ (live-class-reminders, end-stale-live-classes, expire-live-recordings)
- content/docs-en/live.mdx
- content/docs-en/marketing-brief.mdx
- live-mobile-admin-before.png (repo root)
