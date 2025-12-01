import { db } from '../src/lib/db'

async function main() {
  const announcements = await db.announcement.findMany({
    select: { id: true, title: true, language: true },
    take: 10
  })
  console.log(JSON.stringify(announcements, null, 2))
  const count = await db.announcement.count()
  console.log(`Total announcements: ${count}`)
  
  // Check how many have null/empty language
  const withoutLang = await db.announcement.count({
    where: { OR: [{ language: null as any }, { language: '' }] }
  })
  console.log(`Announcements without language: ${withoutLang}`)
}

main().catch(console.error).finally(() => db.$disconnect())
