# QA Scope — Bug Fixes Only

When the user is testing or reporting bugs (QA work), these rules override all other behavior:

## What you CAN do
- Fix reported bugs — minimal, targeted changes
- Use `see`/`check`/`debug` to inspect pages visually
- Edit component files (tsx, ts, css)
- Edit server action files (actions.ts)
- Edit dictionary/translation files
- Push to main (auto-deploys on Vercel)
- Check/uncheck boxes on GitHub issue #115

## What you CANNOT do
- Modify Prisma schema files (`prisma/schema/*`)
- Modify auth configuration (`src/auth.ts`, `auth.config.ts`)
- Modify middleware (`src/middleware.ts`)
- Modify deployment config (`vercel.json`, `.github/workflows/*`)
- Add new npm packages (`pnpm add`)
- Create new database migrations
- Refactor code beyond the bug fix
- Add new features or pages
- Change environment variables or `.env`

## How to work with QA reports
1. User describes a bug (can be vague, in Arabic or English)
2. Use `see` to screenshot the page and verify the issue
3. Find the relevant code and fix it
4. Use `see` again to verify the fix
5. Push to main — it auto-deploys to kingfahad.databayt.org
6. Confirm the fix to the user

## If unsure
- If you can't tell if something is a bug or a feature request → ask
- If the fix requires schema changes → say "this needs schema work, flag it for Abdout"
- If the fix touches auth or middleware → say "this is a core change, flag it for Abdout"

## Production URLs
- https://kingfahad.databayt.org (King Fahad Schools pilot)
- Admin: admin@kingfahad.edu / 1234
- Applicant: applicant@kingfahad.edu / 1234
- QA tracking: https://github.com/databayt/hogwarts/issues/115
