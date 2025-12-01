import { db } from '../src/lib/db'

async function main() {
  // Get all Arabic announcements
  const arabicAnnouncements = await db.announcement.findMany({
    where: { language: 'ar' }
  })
  
  console.log(`Found ${arabicAnnouncements.length} Arabic announcements`)
  
  // Update to Arabic-only titles (before the |)
  for (const ann of arabicAnnouncements) {
    const titleParts = ann.title.split('|')
    const arabicTitle = titleParts[0].trim()
    
    const bodyParts = ann.body.split('---')
    const arabicBody = bodyParts[0].trim()
    
    if (titleParts.length > 1 || bodyParts.length > 1) {
      await db.announcement.update({
        where: { id: ann.id },
        data: {
          title: arabicTitle,
          body: arabicBody,
        }
      })
      console.log(`Updated: ${arabicTitle}`)
    }
  }
  
  console.log('\nDone!')
}

main().catch(console.error).finally(() => db.$disconnect())
