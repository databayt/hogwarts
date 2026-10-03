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

## Open

- Closing a wizard before typing anything leaves a blank draft row. Proposed fix: delete it on Close, list only named drafts, and purge nameless drafts nightly.
