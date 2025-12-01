import { db } from '../src/lib/db'

async function main() {
  // Get all Arabic announcements
  const arabicAnnouncements = await db.announcement.findMany({
    where: { language: 'ar' }
  })
  
  console.log(`Found ${arabicAnnouncements.length} Arabic announcements`)
  
  // Create English versions
  for (const ann of arabicAnnouncements) {
    // Extract English part from bilingual title (after | or use full title)
    const titleParts = ann.title.split('|')
    const englishTitle = titleParts.length > 1 ? titleParts[1].trim() : ann.title
    
    const bodyParts = ann.body.split('---')
    const englishBody = bodyParts.length > 1 ? bodyParts[1].trim() : ann.body
    
    await db.announcement.create({
      data: {
        schoolId: ann.schoolId,
        title: englishTitle,
        body: englishBody,
        language: 'en',
        scope: ann.scope,
        priority: ann.priority,
        createdBy: ann.createdBy,
        classId: ann.classId,
        role: ann.role,
        published: ann.published,
        publishedAt: ann.publishedAt,
        scheduledFor: ann.scheduledFor,
        expiresAt: ann.expiresAt,
        pinned: ann.pinned,
        featured: ann.featured,
      }
    })
    console.log(`Created English version: ${englishTitle}`)
  }
  
  const total = await db.announcement.count()
  const enCount = await db.announcement.count({ where: { language: 'en' } })
  const arCount = await db.announcement.count({ where: { language: 'ar' } })
  
  console.log(`\nTotal: ${total}, Arabic: ${arCount}, English: ${enCount}`)
}

main().catch(console.error).finally(() => db.$disconnect())
