---
feature: lumos
title: Lumos (Online Courses)
status: partial
pillar: learning-science
personas: [student, teacher, principal, parent]
routes: [/ar/s/{school}/lumos, /ar/s/{school}/lumos/courses, /ar/s/{school}/lumos/courses/{course}, /ar/s/{school}/lumos/courses/{course}/{lesson}, /ar/s/{school}/lumos/courses/{course}/certificate, /ar/s/{school}/lumos/dashboard, /ar/s/{school}/lumos/videos, /ar/s/{school}/lumos/instructors]
screenshots: [docs/evidence/courses-ar-before.png, lesson-fullscreen.png]
readme: ./README.md
docs: content/docs-en/lms.mdx
updated: 2026-09-27
---

# Lumos (Online Courses) — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Lumos is the school's own course library: students pick a subject, watch its lessons chapter by chapter, answer a short practice quiz after each one, and earn a completion certificate.

## The school's day without it

Lesson videos are scattered across YouTube links in class WhatsApp groups, and nobody knows who actually watched them. A student who missed a class has to borrow a friend's notes. Teachers who record good explanations have nowhere to keep them for next year, and no control over who they are shared with.

## What happens in Balqalam

1. A student opens Lumos and sees where they left off, then courses recommended for their grade, then the rest of the school's subjects. Search works in Arabic and English.
2. They open a subject, see its chapters and lessons, and enrol. Free courses enrol in one tap; a paid course is unlocked by card payment.
3. A lesson plays full screen, resumes where the student stopped, marks itself complete at the end and offers the next lesson. Worksheets and notes for the lesson sit underneath.
4. Below the video, a short practice quiz (multiple choice, true/false, fill-in-the-blank) shows the right answer and the explanation after submitting. The first attempt counts toward the gradebook; later attempts are for practice.
5. When every lesson the school shows is finished, the student receives a certificate of completion with a certificate number, which they can print or save.
6. Teachers and admins add their own videos to a lesson (a YouTube or Vimeo link, or an uploaded file), choose who may watch and whether it is free or paid. The platform team reviews it and the school is notified when it goes live.
7. The school decides which instructors' videos its students see, which one plays first, and can hide chapters or lessons it does not teach. Parents can follow their child's progress.

## Who it is for

- **Student**: lessons in order, picking up where they stopped, a practice quiz after each lesson, and a certificate at the end.
- **Teacher**: a home for their recorded explanations, attached to the exact lesson, and they stay in control of who can watch.
- **Principal**: control over what students see (which instructors, which chapters), a list of enrolments, and the status of every video the school submitted.
- **Parent**: their child's course progress and certificates, read-only.

## Real screens to show

- `docs/evidence/courses-ar-before.png` — the Arabic course catalog with subject artwork (Mathematics, Arabic). An onboarding "quick guide" pop-up covers the middle and the heading button shows an old label; recapture before posting.
- `lesson-fullscreen.png` — the full-screen lesson player at the moment it loads, showing the faint viewer watermark (masked email and time). Useful only for a video-protection angle; crop the masked email.
- Routes to capture (Arabic, student login on demo.balqalam.com, on a phone): `/ar/s/{school}/lumos`, `/ar/s/{school}/lumos/courses`, a course page, a lesson page with its practice quiz, and the certificate page. As a teacher: `/ar/s/{school}/lumos/videos` and the "Propose a video" dialog.

## What you can say

- Students resume a lesson where they stopped, and a finished video marks the lesson complete and offers the next one. [docs-en/lms.mdx "Watch a lesson"]
- Each lesson can carry a practice quiz graded on the server; the correct answer and explanation appear after submitting, and only the first attempt goes into the gradebook. [docs-en/lms.mdx "The practice quiz"]
- Finishing every lesson the school shows issues a certificate of completion with a certificate number, in the reader's language. [docs-en/lms.mdx "Certificates"; courses/[slug]/certificate/content.tsx]
- Teachers can attach their own video to a lesson by link or upload, choose who sees it and whether it is paid, and keep control afterwards (change visibility, replace, revoke, delete). [docs-en/lms.mdx "Ownership, control & paid unlocks"]
- A school can switch off an instructor, pick a default one, and hide chapters or lessons it does not teach; hidden lessons never block a certificate. [README.md "Data Architecture"; docs-en/lms.mdx]
- Video links are checked on every request and expire after two hours, so a copied link does not keep working for someone outside the school. [docs-en/lms.mdx "Protecting school video"]
- Paid courses open only after the card payment is confirmed. [docs-en/lms.mdx "Discover & enroll"]

## Do not say

- "Hundreds of video lessons ready to watch." The demo has no real lesson videos yet; every lesson plays the same placeholder clip until a school or teacher uploads one. [README.md "Lesson video fallback"; catalog ISSUE.md]
- "Screenshot-proof" or "cannot be recorded." The watermark deters and helps trace leaks; a phone camera pointed at the screen defeats it, and it has not been verified on a real protected lesson in the app. [ISSUE.md "2026-09-14"]
- "Download lessons to watch offline" or "works offline."
- "Download our app" — Lumos opens in the browser; some phone-app pieces exist but are not a store app.
- "Buy now" as a call to action for Balqalam itself. Paid courses are a feature inside Lumos, not the school subscription.
- "Fully Arabic." A few labels still show English (for example the "10m left" countdown on an Arabic page). [../school-dashboard/live/ISSUE.md "Found while here"]
- Enrolment, completion or watch-time numbers — none are measured.

## Post angles

1. "The lesson link is in the class WhatsApp group. Somewhere." — student — learning-science — a pain scene: videos lost in chats versus one course library ordered by chapter.
2. "Watch, then answer three questions. The first try goes to your teacher." — student — learning-science — how the practice quiz after each lesson works.
3. "How a teacher adds their own explanation video to a lesson" — teacher — product-proof — a how-to walk through the three-step upload dialog.
4. "Your recordings stay yours: change who sees them, replace them, or take them down" — teacher — trust — a persona view on ownership and control.
5. "If your child missed today's lesson, where would they watch it?" — parent — learning-science — a question to the reader.

## Connects to

- [Curriculum catalog](../catalog/SPOTLIGHT.md)
- [Live classes](../school-dashboard/live/SPOTLIGHT.md)
- [Exams](../school-dashboard/exams/SPOTLIGHT.md)
- [Gradebook](../school-dashboard/listings/grades/SPOTLIGHT.md)
- [Parent portal](../school-dashboard/parent-portal/SPOTLIGHT.md)

## Sources

- src/components/lumos/README.md
- src/components/lumos/ISSUE.md
- src/components/lumos/CLAUDE.md
- src/components/lumos/courses/[slug]/certificate/content.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/lumos/ (route tree)
- src/components/catalog/ISSUE.md
- src/components/school-dashboard/live/ISSUE.md
- content/docs-en/lms.mdx
- content/docs-en/mvp.mdx
- content/docs-en/marketing-brief.mdx
- docs/evidence/courses-ar-before.png, lesson-fullscreen.png
