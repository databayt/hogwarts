/**
 * Migrate seeded login accounts from @databayt.org to @balqalam.com.
 *
 * The balqalam rebrand moved the product onto balqalam.com, but every seeded
 * login (admin@, teacher@, student@, …) still authenticates under the old
 * databayt.org domain. The seed sources were rewritten in code; this brings the
 * existing rows along so the accounts keep working without a full reseed.
 *
 * Only ROLE accounts move. Company addresses (noreply@, sales@, legal@, …) and
 * host domains (demo.databayt.org) are deliberately left alone.
 *
 *   pnpm tsx prisma/seeds/migrate-login-domain.ts           # dry run — reports only
 *   pnpm tsx prisma/seeds/migrate-login-domain.ts --apply   # writes
 *   pnpm tsx prisma/seeds/migrate-login-domain.ts --apply --revert
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const APPLY = process.argv.includes("--apply")
const REVERT = process.argv.includes("--revert")

const OLD_DOMAIN = REVERT ? "balqalam.com" : "databayt.org"
const NEW_DOMAIN = REVERT ? "databayt.org" : "balqalam.com"

const ROLES = [
  "dev",
  "admin",
  "user",
  "applicant",
  "teacher",
  "student",
  "parent",
  "accountant",
  "staff",
]

// Anchored on the whole value: an identity column, never an email quoted inside
// a message body or an audit payload.
const MATCH = `^(${ROLES.join("|")})[0-9]*@${OLD_DOMAIN.replace(".", "\\.")}$`

type Target = { table: string; column: string }

async function emailColumns(): Promise<Target[]> {
  return prisma.$queryRaw<Target[]>`
    SELECT table_name AS "table", column_name AS "column"
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying')
      AND column_name ILIKE '%email%'
      AND table_name IN (SELECT table_name FROM information_schema.tables
                         WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
    ORDER BY table_name, column_name
  `
}

/** Rows that would collide with an address that already exists on the target domain. */
async function userCollisions(): Promise<{ email: string; schoolId: string | null }[]> {
  return prisma.$queryRawUnsafe(`
    SELECT u.email, u."schoolId"
    FROM "User" u
    WHERE u.email ~ '${MATCH}'
      AND EXISTS (
        SELECT 1 FROM "User" o
        WHERE o.id <> u.id
          AND o.email = regexp_replace(u.email, '@${OLD_DOMAIN.replace(".", "\\.")}$', '@${NEW_DOMAIN}')
          AND o."schoolId" IS NOT DISTINCT FROM u."schoolId"
      )
  `)
}

async function main() {
  console.log(
    `\n${APPLY ? "APPLY" : "DRY RUN"} — ${OLD_DOMAIN} → ${NEW_DOMAIN} (role logins only)\n`
  )

  const collisions = await userCollisions()
  if (collisions.length > 0) {
    console.error(`Refusing to run: ${collisions.length} User row(s) would collide on (email, schoolId):`)
    for (const c of collisions) console.error(`  ${c.email}  school=${c.schoolId ?? "—"}`)
    process.exitCode = 1
    return
  }

  const targets = await emailColumns()
  let total = 0

  for (const { table, column } of targets) {
    const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*)::bigint AS count FROM "${table}" WHERE "${column}" ~ '${MATCH}'`
    )
    const n = Number(count)
    if (n === 0) continue
    total += n
    console.log(`  ${table}.${column}  ${n}`)

    if (APPLY) {
      await prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET "${column}" = regexp_replace("${column}", '@${OLD_DOMAIN.replace(".", "\\.")}$', '@${NEW_DOMAIN}')
         WHERE "${column}" ~ '${MATCH}'`
      )
    }
  }

  console.log(`\n${total} row(s) ${APPLY ? "updated" : "would be updated"}.`)
  if (!APPLY && total > 0) console.log("Re-run with --apply to write. Reverse with --apply --revert.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
