// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-off repair: make every school member's email login work.
 *
 *   DATABASE_URL_OVERRIDE='<url>' pnpm tsx scripts/fix-login-emails.ts          # dry run
 *   DATABASE_URL_OVERRIDE='<url>' pnpm tsx scripts/fix-login-emails.ts --apply  # write
 *
 * 1. Lowercase + trim `User.email` — skipped for rows with a case-insensitive
 *    twin in the same school (the unique index would reject the second one);
 *    twins are listed for a human to decide which account keeps the address.
 *    Login already works for both (lookup is case-insensitive and the
 *    password picks the row), so twins are cleanup, not an outage.
 * 2. Stamp `emailVerified` on school accounts whose password an admin minted
 *    (`mustChangePassword`) or whose email is a `.local` placeholder — the
 *    verification gate must not stall an email login an admin handed out.
 *
 * Prints the database host first: read it before trusting anything below.
 */

import { Client } from "pg"

const url = process.env.DATABASE_URL_OVERRIDE ?? process.env.DATABASE_URL
const apply = process.argv.includes("--apply")

async function main() {
  if (!url) throw new Error("Set DATABASE_URL_OVERRIDE")
  console.log(
    `host: ${new URL(url).host}   mode: ${apply ? "APPLY" : "dry run"}`
  )

  const db = new Client({ connectionString: url })
  await db.connect()
  try {
    const twins = await db.query(`
      select s.domain, lower(trim(u.email)) as email,
             string_agg(u.id || ' ' || u.role || ' ' || coalesce(u.username, '-'), ' | ') as rows
        from "User" u join schools s on s.id = u."schoolId"
       where u.email is not null
       group by 1, 2 having count(*) > 1`)

    const toLower = await db.query(`
      select u.id, u.email from "User" u
       where u.email is not null and u.email <> lower(trim(u.email))
         and not exists (
           select 1 from "User" o
            where o.id <> u.id
              and o."schoolId" is not distinct from u."schoolId"
              and lower(trim(o.email)) = lower(trim(u.email)))`)

    const toVerify = await db.query(`
      select u.id from "User" u
       where u."schoolId" is not null and u.email is not null
         and u."emailVerified" is null
         and (u."mustChangePassword" or lower(u.email) like '%.local')`)

    console.log(`\nlowercase: ${toLower.rowCount} rows`)
    console.log(`verify:    ${toVerify.rowCount} rows`)
    console.log(`twins:     ${twins.rowCount} (left alone — decide by hand)`)
    for (const t of twins.rows)
      console.log(`  ${t.domain}  ${t.email}  →  ${t.rows}`)

    if (!apply) {
      console.log("\nDry run — nothing written. Re-run with --apply.")
      return
    }

    await db.query("begin")
    const a = await db.query(
      `update "User" set email = lower(trim(email)) where id = any($1)`,
      [toLower.rows.map((r) => r.id)]
    )
    const b = await db.query(
      `update "User" set "emailVerified" = now() where id = any($1)`,
      [toVerify.rows.map((r) => r.id)]
    )
    await db.query("commit")
    console.log(`\nwrote: lowercased ${a.rowCount}, verified ${b.rowCount}`)
  } catch (error) {
    await db.query("rollback").catch(() => {})
    throw error
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
