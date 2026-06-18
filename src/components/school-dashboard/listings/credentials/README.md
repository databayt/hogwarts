# Credentials Dialog (shared)

Role-agnostic "generate login credentials" dialog for the four people listings:
**students, teachers, parents (guardians), staff**. Animated hero, the name with
a role/grade badge, the username + password, and a row of contact icons.

## What it does

- **Username + password** are rendered (mono) in a fixed two-row block.
- **Badge next to the name** — grade (student) · department (teacher) ·
  "Guardian" (parent) · position (staff). Passed in at open time from the row,
  so it appears instantly.
- **Contact icons** — three custom-SVG channels (see `icons.tsx`), **always
  rendered**; the ones with no contact on file are **disabled** (dimmed) so the
  icon count never changes and the row never shifts. Each enabled one is a real
  `<a>`:
  - phone on file → **WhatsApp** (`wa.me/<number>?text=…`) and **SMS** (`sms:`)
  - email on file → **Email** (`mailto:` with the credentials prefilled)
  - For students the contact falls back own → **primary guardian** (phone & email).
- **Copy** — copies `Username / Email / Password / Login URL` as one block.
- **Generate-on-open** — opening mints a fresh temp password to hand out (no
  separate "Reset" button). The one exception is a **self-onboarded student** who
  set their own password — it isn't clobbered (password shows `—`).

The minted `User` (crypto temp password via `@/lib/credentials`) is linked back
to the person record, and credentials are pushed over notification channels
**after the response** (`after()` from `next/server`) so the dialog returns fast.

## Performance / steadiness (anti-flash)

Three distinct flash causes, all fixed:

1. **Re-fetch on every open** — Radix unmounts the dialog body on close, so the
   hero remounted and re-fetched the Lottie JSON each open (blank → pop-in). Now
   the JSON is **cached at module level** (one fetch per tab, warmed on import)
   and the hero seeds its state from that cache → instant, no blank frame.
2. **Recolor race** — instead of recoloring the live SVG (which races lottie's
   per-frame repaint), the theme colors are **baked into the animation JSON once**
   before lottie renders it.
3. **Dark-mode re-bake restart** — `isDark` is seeded from the real DOM on first
   render, so the baked data is correct immediately and lottie never restarts
   with swapped colors.

`confetti`/`framer-motion` are gone (the shadcn `Dialog` supplies its transition).
The credentials block has reserved height (placeholder `—` → values) so the
centered dialog never re-centers/bounces.

## Files

| File                     | Role                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `credentials-dialog.tsx` | The UI (client). Hero + name/badge + username/password + Copy & per-contact icons.                                                                       |
| `hand-lock.tsx`          | Themed dotLottie hero. Module-cached (one fetch/tab), colors baked into the JSON once, theme seeded from the DOM — no re-fetch/recolor/restart flash.    |
| `icons.tsx`              | Custom contact SVGs (WhatsApp / Email / SMS), local to the block. Inherit `currentColor` (black), normalized to a consistent ~16/24 size and 1.5 stroke. |
| `store.ts`               | Module-level store (`openCredentialsDialog(role, id, name, badge?)`) — survives table remounts via `useSyncExternalStore`.                               |
| `actions.ts`             | `generateCredentials({ role, id })` — one entry for all 4 roles. Students delegate to `../students/actions`; members mint/refresh directly.              |
| `share.ts`               | `normalizePhone` + `fillTemplate` (channel link helpers).                                                                                                |
| `types.ts`               | `CredentialsRole`, `CredentialsPayload` (carries `phone` for the share channel).                                                                         |

## Wiring a listing

```tsx
import { CredentialsDialog, openCredentialsDialog } from "../credentials"

// row action → openCredentialsDialog("teacher", id, name)
// mount once in the table:

;<CredentialsDialog labels={credentialsLabels} onClosed={() => refresh()} />
```

`labels` is the shared `school.students.credentials` dictionary block (one source
of truth for every role). Tables that hold only a partial dictionary slice read
the full dict via `useDictionary()`.

## Notes / assumptions

- Phone normalization strips punctuation and a leading `+`/`00` but **never guesses
  a country code** — a bare national number is passed through as-is (wa.me may not
  resolve it; the copy fallback covers that). Improve at the data-entry layer.
- Staff are minted with `role: STAFF` (not `ACCOUNTANT`).
- Generate-on-open re-issues a fresh password each open (single-use,
  `mustChangePassword`); there is no reset button by design.
