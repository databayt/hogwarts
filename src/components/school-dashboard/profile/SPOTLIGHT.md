---
feature: profile
title: Profile
status: partial
pillar: product-proof
personas: [student, teacher, parent, principal, registrar]
routes: [/ar/s/{school}/profile, /ar/s/{school}/profile/{id}]
screenshots: [docs/evidence/profile-student-achievements-ar.png, docs/evidence/profile-parent-ar.png, docs/evidence/profile-admin-ar-bio-fixed.png, docs/evidence/profile-teacher-ar.png, docs/evidence/profile-student-ar.png, docs/evidence/profile-child-via-parent-ar.png]
readme: ./README.md
docs: content/docs-en/profile.mdx
updated: 2026-09-27
---

# Profile — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every student, teacher, parent and staff member has one profile page that shows who they are and a year of their real work at school, drawn from the school's own records.

## The school's day without it

A student's story is spread across a class register, a marks sheet, a library card and a file in the office. When a principal wants to know how a teacher's term went, or a parent wants a picture of their child's year, someone has to pull papers from four places. Nothing shows the year at a glance.

## What happens in Balqalam

1. Anyone signed in opens their own profile from the side menu. Opening a student, teacher or parent from a list leads to that person's profile.
2. The left column shows the photo, name, role, a short bio, contact links, the date they joined, and simple counts — for example a student's subjects and classmates, a teacher's classes and students, a parent's children.
3. The main area shows a year-long activity calendar. Each square is a school day, shaded by how much work was recorded: attendance, homework handed in, marks and library loans for a student; registers taken and marks entered for a teacher; messages sent for a parent.
4. Tabs change with the role: a student sees their subjects, a teacher their classes, a parent their children (each child's card opens the child's profile), and staff their clubs and committees (these come from demo data only for now; see "Do not say").
5. The owner presses "Edit profile" to change their photo, name, bio, website, social links and status.
6. Pinned cards at the top can be reordered or removed by the owner.

## Who it is for

- **Student**: a page that shows their year — the days they attended and the work they handed in.
- **Teacher**: a visible record of registers taken and marks entered across the year.
- **Parent**: one place to see each linked child, with a tap through to the child's own profile.
- **Principal**: a quick picture of any member of the school, with sensitive details such as email hidden from people who should not see them.
- **Registrar**: for a student who applied online, a link from the profile straight to their application.

## Real screens to show

Every profile screenshot in the repo uses the demo school, whose accounts carry fictional film characters' names and film-still photos of real actors. **None of these can be posted as they are.** Blur or replace the photo and the name first, or re-capture with a neutral demo account.

- `docs/evidence/profile-student-achievements-ar.png` — a student's Achievements tab in Arabic: six earned badges with gold and silver levels and dates. Photo, name and an English bio line must be removed.
- `docs/evidence/profile-parent-ar.png` — a parent's profile in Arabic with the activity calendar, a feed of parent meetings and messages with the teacher, and a Children tab. Photo, name and English bio must be removed; the side menu shows an untranslated "Parent portal" item.
- `docs/evidence/profile-admin-ar-bio-fixed.png` — a staff profile in Arabic with a well-filled activity calendar and a feed of application reviews. Photo and name must be removed.
- `docs/evidence/profile-teacher-ar.png` and `docs/evidence/profile-student-ar.png` — teacher and student profiles, both half-covered by the "quick guide" welcome pop-up. Not usable.
- `docs/evidence/profile-child-via-parent-ar.png` — a child's profile opened by a parent, with no photo, but its calendar is empty and it reads "no activity recorded yet". Do not use it to show the calendar.
- Most of these carry a small red development badge ("1 Issue", "2 Issues") in a corner — crop it out.
- To capture more (with /record, Arabic, after the demo avatars are replaced): `/ar/s/{school}/profile` signed in as the demo student, teacher and parent, on a phone and on a desktop.

## What you can say

- Every student, teacher, parent and staff member gets a profile page, in Arabic by default. [README.md, docs-en/profile.mdx]
- The activity calendar is built from the school's real records: attendance, homework, marks and library loans for students, registers and marking for teachers, messages for parents. [docs-en/profile.mdx "What the contribution graph counts"]
- Nothing on the page is made up: when there is no record, the page says so instead of showing a filler number. [CLAUDE.md "No fabrication, ever"]
- A parent's profile lists their children, and each child's card opens that child's profile. [ISSUE.md 2026-07-19, parent.tsx]
- Sensitive details such as email are hidden from people who are not entitled to them, and one school can never see another school's profiles. [docs-en/profile.mdx "Permissions"]
- On a phone the page is laid out for the phone, not squeezed: tabs first, a small photo beside the name, and the calendar opening on the most recent weeks. [ISSUE.md 2026-09-11]
- Users change their own photo, bio, website, social links and status from "Edit profile". [actions.ts, form.tsx]

## Do not say

- That badges, clubs and achievements appear on their own for a real school. Today they are filled in by the demo data; there is no screen yet to award them or to create a club, and badges are not recalculated automatically as the year goes on.
- That the activity feed under the calendar records what people do. Outside the demo it stays empty; only the calendar reads live records.
- That users can pin anything they like. Pins can be reordered and removed, but adding a new pin is not built yet.
- Anything about two-factor sign-in, managing active sessions, or privacy and visibility settings. They are planned, not built.
- That a child added by the office without a login shows a full calendar. Those profiles show an empty calendar even when the child has attendance.
- "Just like GitHub" or any other brand comparison. Describe the page itself.
- Real students' names or faces from the pilot school, and never the demo's film-character photos.

## Post angles

1. "Your child's year, one square per school day." — parent — product-proof — The activity calendar fills from attendance, homework and marks, so a parent sees the year at a glance.
2. "Four files in four offices, or one page?" — principal — school-operations — A pain scene: the register, the marks sheet, the library card and the office file, versus one profile.
3. "A teacher's work, finally visible." — teacher — product-proof — Registers taken and marks entered appear on the teacher's own calendar across the year.
4. "How to update your photo and bio in Balqalam." — student — school-operations — A short how-to: Edit profile, change the photo, write a line about yourself, save.
5. "What should a school know about each student at a glance?" — principal — trust — A question post, closing on what the profile shows and what it deliberately hides from other users.

## Connects to

- [Students](../listings/students/SPOTLIGHT.md) — opening a student from the list leads here.
- [Teachers](../listings/teachers/SPOTLIGHT.md) — a teacher's classes and subjects feed the profile tabs.
- [Parents](../listings/parents/SPOTLIGHT.md) — a parent's linked children appear on their profile.
- [Attendance](../attendance/SPOTLIGHT.md) — attendance records fill the activity calendar.
- [Admission](../admission/SPOTLIGHT.md) — a student's profile links back to their application.

## Sources

- src/components/school-dashboard/profile/README.md
- src/components/school-dashboard/profile/ISSUE.md
- src/components/school-dashboard/profile/CLAUDE.md
- src/components/school-dashboard/profile/actions.ts
- src/components/school-dashboard/profile/badges.ts
- src/components/school-dashboard/profile/client.tsx
- src/components/school-dashboard/profile/parent.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/profile/[[...id]]/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/students/[id]/page.tsx
- src/components/internationalization/school-en.json (school.profile keys)
- prisma/seeds/profile-extras.ts, prisma/seeds/profile-activity.ts (only callers of the badge engine)
- content/docs-en/profile.mdx
- content/docs-en/marketing-brief.mdx
- docs/evidence/profile-student-ar.png, docs/evidence/profile-student-achievements-ar.png, docs/evidence/profile-parent-ar.png, docs/evidence/profile-teacher-ar.png, docs/evidence/profile-admin-ar-bio-fixed.png, docs/evidence/profile-child-via-parent-ar.png
