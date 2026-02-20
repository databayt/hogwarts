# Fix: Database Data Loss — Root Causes and Hardening

## Context

The demo school and all its data keep disappearing from the Neon production database. The user hits `demo.localhost:3000/en` and gets a 404 because `getSchoolBySubdomain("demo")` returns nothing. Investigation found **3 confirmed root causes** and **2 contributing risks**.

---

## Root Causes

### 1. `reset-test-user.ts` deletes the demo school via CASCADE

**File:** `prisma/seeds/reset-test-user.ts:33-35`

```typescript
const deletedSchools = await prisma.school.deleteMany({
  where: { createdByUserId: existingUser.id },
})
```

If `user@databayt.org` ever went through onboarding and created the demo school (or got assigned as `createdByUserId`), running `pnpm db:reset-test-user` **deletes the demo school**. Due to `onDelete: Cascade` on 100+ tables, this wipes ALL data.

### 2. `.env` points directly to production — no dev/branch separation

Both `DATABASE_URL` and `DIRECT_URL` point to the same Neon production endpoint. Any local `prisma db push` with schema changes hits production and can drop+recreate tables.

### 3. `ensure-demo.ts` admin email mismatch

`ensure-demo.ts` creates admin as `admin@demo.databayt.org` but the full seed uses `admin@databayt.org`. After data loss, the recovery script creates the wrong admin — the one nobody uses.

---

## Plan

### Step 1: Protect demo school in `reset-test-user.ts`

**File:** `prisma/seeds/reset-test-user.ts`

Add a guard that excludes the demo school from deletion:

```typescript
// Delete any schools created by this user EXCEPT the demo school
const deletedSchools = await prisma.school.deleteMany({
  where: {
    createdByUserId: existingUser.id,
    domain: { not: "demo" },
  },
})
```

### Step 2: Fix admin email in `ensure-demo.ts`

**File:** `prisma/seeds/ensure-demo.ts`

Change `admin@demo.databayt.org` to `admin@databayt.org` (3 occurrences: lines 72, 90, 96) to match the full seed and what everyone actually uses.

### Step 3: Add `prisma db push` safety hook

**File:** `.claude/settings.json`

Add `prisma db push` to the PreToolUse destructive command grep pattern so it requires confirmation (it can already drop tables silently during schema drift):

Update the existing grep from:

```
(migrate reset|db execute|accept-data-loss|DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE.*DROP)
```

to:

```
(migrate reset|db execute|db push|accept-data-loss|DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE.*DROP)
```

This makes `prisma db push` trigger a warning — not a hard block (since it's useful), but it forces awareness.

**Also add to the deny list** (hard block without `--force-reset-database`):

```json
"Bash(prisma db push --force-reset-database:*)"
```

### Step 4: Re-seed the demo school NOW

Run `pnpm db:seed:single school` (global seed, no school resolution needed thanks to our earlier fix) to restore the demo school immediately.

---

## Files to modify

| File                              | Change                                                                   |
| --------------------------------- | ------------------------------------------------------------------------ |
| `prisma/seeds/reset-test-user.ts` | Add `domain: { not: "demo" }` guard                                      |
| `prisma/seeds/ensure-demo.ts`     | Fix admin email to `admin@databayt.org`                                  |
| `.claude/settings.json`           | Add `db push` to grep pattern, add `--force-reset-database` to deny list |

## Verification

1. `pnpm db:seed:single school` — restores demo school
2. Visit `http://demo.localhost:3000/en` — should load, no 404
3. `pnpm db:reset-test-user` — should NOT delete the demo school
4. Attempt `prisma db push` in Claude Code — should trigger warning
