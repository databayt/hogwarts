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

## Empty drafts

`empty-drafts.ts` is the one definition of an EMPTY draft. A student draft is empty when it has no name and no parent, document, photo, grade, section, fee or login. A teacher draft is empty when it has no name, still has the `@draft.internal` placeholder email, and has no phone, qualification, experience, subject, department, photo or login. Three places use it:

- **Close** (`WizardLayout onClose`) calls `discardEmpty{Student,Teacher}Draft`, which deletes the draft only while it is still empty.
- **The lists** wrap their `where` in `hideEmpty*Drafts`, so a blank row never shows. `schoolId` stays at the top level for the tenant guard.
- **The nightly purge** (`/api/cron/purge-empty-drafts`, 02:00 UTC, beside cleanup-notifications) removes empty drafts older than 24 hours: closed tabs, Back, a lost connection.

A draft with any data (even just a name) is kept, and shows as "Incomplete" with a link to resume it.
