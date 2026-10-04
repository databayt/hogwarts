# Listings

The school's entity lists (students, teachers, classrooms, …): table + grid, add wizards, and edit
surfaces. Pattern docs: `content/docs-en/listings.mdx`. Per-entity records live in each
sub-directory (`teachers/ISSUE.md`, …).

## Add wizards (students, teachers)

- A draft row is created when the wizard opens (the URL carries its id), and each step saves its own fields.
- Only one step is required: students need a name plus a father or mother; teachers need a name plus an email.
- **A one-word name is a whole name** in full-name schools. Neither the server schema nor the completion gate requires a last name (hogwarts#424, #425).
- Create from the last step or the footer goes through `<entity>/wizard/finish.ts`. A failure toasts and stays put.
- Errors are `ACTION_ERRORS` codes, translated in the form with `actionErrorMessage`.

## Location step (students, teachers)

The step uses the shared location picker (`atom/mapbox-location-picker.tsx`). It opens around the school, which the tenant layout provides through `SchoolGeoProvider`, and shows the school as a reference marker. Since 2026-10-04 the pin is stored in `Student.latitude/longitude` and `Teacher.latitude/longitude`, which are `Float` so rows stay plain JSON for client components. Reopening a record therefore lands on its pin. Rows saved before then have address text only, and the map opens on the school.

## Speed: "+" and "Next" do not wait on the server (students, teachers, parents)

The three add wizards opt into the wizard runtime (`form/wizard/wizard-runtime.tsx`) by passing
`steps` to `WizardLayout`:

- **"+"** (`useDraftLauncher`) mints the id in the browser, prefetches the first step for it, and
  opens the wizard at once on a seed (`emptyStudentDraft` / `emptyTeacherDraft` /
  `emptyParentDraft`, which mirror what `get*ForWizard` returns for a new draft). The
  `createDraft*(id)` INSERT runs behind it, and every save waits for it. The listing pages pass
  `nameFormat` for the seed (`lib/school-name-format.ts`).
- **Steps switch in the browser** with `history.pushState`. The layout renders the step for the path
  itself, visited steps stay mounted under `<Activity>` (Back keeps what was typed), and the next
  step pre-renders. The step `page.tsx` files remain for deep links and refreshes.
- **Next is optimistic.** The save starts, and a rejection within 50 ms (client validation) keeps the
  step. Otherwise the next step shows while the save finishes. A server failure toasts and brings
  the step back. Create and Skip & Create `drain()` every pending save first, and Close drains
  before it discards.
- **Activity rule:** a hidden step re-runs its effects when shown again. An effect that initialises
  from the loaded row must run once per record (`validityFromRef` keyed on `data.id`), or it
  overrides what the user typed.
- The teacher wizard's subjects step prefetches the editor's data when the wizard opens
  (`teachers/subjects/prefetch.tsx`, wrapped around `teachers/add/[id]/layout.tsx`). The request
  starts in an effect: a Server Action called during render loops.
- Dev measurements, 2026-10-03: Next 50–175 ms with 0 blocking requests (was a save, a locale
  redirect and an RSC fetch in series). Back 1–90 ms. Fresh drafts make no `get*ForWizard`,
  attachments or guardians load.

Known, not fixed: re-saving the student personal step creates a second father/mother when no email
or phone was entered (`createOrLinkGuardian` has nothing to match on). Pre-existing.

## Teacher subjects & sections (2026-10-04)

A teacher is assigned to subjects in sections — there are no classes to create. One editor,
`teachers/subjects/editor.tsx` (`TeacherSubjectsEditor`), serves two entry points: the wizard's
"Subjects & sections" step (slug `expertise`, unchanged) and the **Assign subjects** row action on
`/teachers` (`subjects/dialog.tsx`, opened through the `subjects/store.ts` module store like the
credentials dialog, mounted once in `table.tsx`). Pick grades, tick a subject — all its free sections
come ticked — or toggle sections one by one; a section someone else teaches shows who. The weekly
load is projected against the teacher's cap, past which saving asks first; periods the timetable
couldn't place come back as an alert with reasons. Saves go through the timetable assignment engine
(`timetable/assignments/actions.ts → saveTeacherSubjects`), which also records the subject as the
teacher's PRIMARY expertise. Deactivating or deleting a teacher releases their subjects.

## Grade entry (2026-10-04)

The grade wizard selects **student → subject → optional exam / assignment**. The subjects are the
student's grade's (`SubjectSelection`) plus any legacy class's; the row takes its section, grade and
term from the student (`resolveStudentSubjectContext`), so no class is needed and a draft needs only a
student. The list, detail, CSV and certificate name the section, falling back to a legacy class.

## Empty drafts

`empty-drafts.ts` is the one definition of an EMPTY draft. A student draft is empty when it has no name and no parent, document, photo, grade, section, fee or login. A teacher draft is empty when it has no name, still has the `@draft.internal` placeholder email, and has no phone, qualification, experience, subject, department, photo or login. Three places use it:

- **Close** (`WizardLayout onClose`) calls `discardEmpty{Student,Teacher}Draft`, which deletes the draft only while it is still empty.
- **The lists** wrap their `where` in `hideEmpty*Drafts`, so a blank row never shows. `schoolId` stays at the top level for the tenant guard.
- **The nightly purge** (`/api/cron/purge-empty-drafts`, 02:00 UTC, beside cleanup-notifications) removes empty drafts older than 24 hours: closed tabs, Back, a lost connection.

A draft with any data (even just a name) is kept, and shows as "Incomplete" with a link to resume it.
