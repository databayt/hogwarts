// Scratch script to check announcements in database
import { db } from "../src/lib/db"

async function main() {
  console.log("=== Demo School ID Lookup ===")
  const school = await db.school.findFirst({
    where: { domain: "demo" },
  })
  console.log("School domain 'demo' resolves to ID:", school?.id)

  if (!school) return

  console.log("\n=== Announcements for Demo School ===")
  const announcements = await db.announcement.findMany({
    where: { schoolId: school.id },
  })

  console.log(`Found ${announcements.length} announcements:`)
  for (const a of announcements) {
    console.log(`- ID: ${a.id}`)
    console.log(`  Title: ${a.title}`)
    console.log(`  Lang: ${a.lang}`)
    console.log(`  Published: ${a.published}`)
    console.log(`  Scope: ${a.scope}`)
  }

  console.log("\n=== Existing Translations for Demo School ===")
  const translations = await db.translation.findMany({
    where: { schoolId: school.id },
  })
  console.log(`Found ${translations.length} translations:`)
  for (const t of translations.slice(0, 10)) {
    console.log(
      `- ${t.sourceLanguage} -> ${t.targetLanguage}: "${t.sourceText}" -> "${t.translatedText}" (${t.provider})`
    )
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
