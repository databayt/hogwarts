<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Lesson draft — issues

Tracker: [databayt/hogwarts#490](https://github.com/databayt/hogwarts/issues/490), package D.
How it works: `README.md` in this folder.

## State — 2026-11-21: built, on `main`, switched OFF, not deployed

The block is complete in code and covered by unit tests. Nothing in it has run against the real
model, and no teacher has seen a draft.

Where the button is: the class page's work section (`live/class-work.tsx`), the room's Quiz tab
(`live/room/quiz.tsx`, loaded on demand, the gate is `mayShowDraftSuggest` in
`live/class-work-load.ts`), and «اقترح من الدرس» on the homework wizard's details step. The
teacher reviews a draft quick check on `/exams/quick/[id]`.

## Before `LESSON_DRAFT_ENABLED=1` (in this order)

- [ ] **The Console workspace limit.** The lane uses the chatbot's key. That workspace is limited
      to $20 a month and the chatbot may spend $18 of it; this lane may spend $10
      (`LESSON_DRAFT_CAP_USD`). Together they can exceed the limit and cut the chatbot off
      mid-month. Abdout raises the workspace limit to $30, or gives this lane its own workspace
      and key. Needs a decision record (`/decide`): a second lane inside the included API credits.
- [ ] **The eval.** `scripts/lesson-draft/eval.ts` with `scripts/lesson-draft/eval-set.json` has
      never been run (it calls the model, so it spends). Pass = valid structure, the answer among
      the options, Arabic output, questions grounded in the lesson text.
- [ ] **Ten real drafts read by Abdout**, across stages (primary Arabic, middle science,
      secondary maths), before any teacher gets the button.
- [ ] Then the flag as a Worker secret and in the build env (`DEPLOYMENT.md` lists the four
      variables), and a deploy inside the production window.

## Known limits

- No class at Al-Ibda has a lesson linked yet (`Conference.catalogLessonId`), and 283 of 3,569
  catalog lessons have a description. The text therefore comes from the textbook's text twin on
  the CDN; where a lesson has no page range the teacher types the topic (40 characters at least).
- A seated co-host whose role is not teacher or admin can open the Quiz tab but is not offered the
  button — the same rule as the class page.
- In the Quiz tab the lesson list loads after the quiz list (one more wait). It only happens with
  the flag on.
- Generated questions carry `wizardStep: "ai-draft"` until the quick check is launched. A new
  reader of `questionBank` must filter `wizardStep: null`, or unreviewed questions reach students
  (eleven readers were patched on 2026-11-21 — see the README's sentinel section).

## Not built

- Regenerating one question. Today the teacher edits or deletes it, or replaces the whole draft.
- A mobile-app entry point. The Android app opens the web page for this, as it does for homework.
