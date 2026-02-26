#!/usr/bin/env tsx
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Fetch Open Library Covers
 *
 * One-time script to query Open Library Search API for book covers and ISBNs.
 * Outputs a JSON mapping of book title -> { isbn, coverUrl } for use in seed data.
 *
 * Usage: npx tsx scripts/fetch-openlibrary-covers.ts
 */

// Harry Potter books - hardcoded ISBNs (known to have covers on OL)
const HARRY_POTTER_BOOKS = [
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    isbn: "9780747532743",
  },
  {
    title: "Harry Potter and the Chamber of Secrets",
    author: "J.K. Rowling",
    isbn: "9780747538486",
  },
  {
    title: "Harry Potter and the Prisoner of Azkaban",
    author: "J.K. Rowling",
    isbn: "9780747542155",
  },
  {
    title: "Harry Potter and the Goblet of Fire",
    author: "J.K. Rowling",
    isbn: "9780747546245",
  },
  {
    title: "Harry Potter and the Order of the Phoenix",
    author: "J.K. Rowling",
    isbn: "9780747551003",
  },
  {
    title: "Harry Potter and the Half-Blood Prince",
    author: "J.K. Rowling",
    isbn: "9780747581086",
  },
  {
    title: "Harry Potter and the Deathly Hallows",
    author: "J.K. Rowling",
    isbn: "9780747591054",
  },
]

// Well-known English books with known ISBNs
const KNOWN_ISBNS: Record<string, string> = {
  "English Grammar in Use": "9780521189064",
  "Oxford Picture Dictionary": "9780194505291",
  "English Vocabulary in Use": "9780521149884",
}

// All 90 book titles from the seed data
const SEED_TITLES = [
  // Arabic Literature (15)
  "المعلقات السبع",
  "لسان العرب",
  "البلاغة الواضحة",
  "النحو الوافي",
  "الكامل في اللغة والأدب",
  "ألف ليلة وليلة",
  "كليلة ودمنة",
  "مقدمة ابن خلدون",
  "الأغاني",
  "ديوان المتنبي",
  "طوق الحمامة",
  "الإملاء والترقيم",
  "جواهر الأدب",
  "المعجم الوسيط",
  "قواعد اللغة العربية المبسطة",
  // Islamic Studies (12)
  "رياض الصالحين",
  "فقه العبادات",
  "قصص الأنبياء",
  "السيرة النبوية",
  "تفسير ابن كثير",
  "الأربعون النووية",
  "فقه السنة",
  "حصن المسلم",
  "العقيدة الإسلامية",
  "الرحيق المختوم",
  "تاريخ الخلفاء الراشدين",
  "الأخلاق الإسلامية",
  // Sciences (12)
  "أساسيات الفيزياء",
  "الكيمياء العامة",
  "علم الأحياء",
  "الفيزياء الحديثة",
  "الكيمياء العضوية",
  "علم البيئة",
  "العلوم للمرحلة المتوسطة",
  "جسم الإنسان",
  "علم الفلك",
  "التجارب العلمية المنزلية",
  "علوم الأرض",
  "المختبر الكيميائي",
  // Mathematics (10)
  "الجبر والهندسة",
  "حساب التفاضل والتكامل",
  "الإحصاء والاحتمالات",
  "الرياضيات للمرحلة المتوسطة",
  "الهندسة الفراغية",
  "المصفوفات والمحددات",
  "الرياضيات الممتعة",
  "حساب المثلثات",
  "الرياضيات للابتدائي",
  "نظرية الأعداد",
  // History & Geography (8)
  "تاريخ السودان",
  "تاريخ الحضارة الإسلامية",
  "جغرافية العالم العربي",
  "أطلس العالم",
  "تاريخ الأندلس",
  "التاريخ المعاصر",
  "جغرافية أفريقيا",
  "الحضارات القديمة",
  // Children's (8)
  "حكايات قبل النوم",
  "ألوان وأشكال",
  "الحروف العربية",
  "الأرقام الممتعة",
  "أنا أحب وطني",
  "الحيوانات حول العالم",
  "قصص من القرآن للأطفال",
  "المهن والحرف",
  // English (8)
  "English for Beginners",
  "English Grammar in Use",
  "Oxford Picture Dictionary",
  "English Vocabulary in Use",
  "Stories for Young Readers",
  "English Conversation Practice",
  "English Writing Skills",
  "English Phonics",
  // CS & Reference (8)
  "مقدمة في البرمجة",
  "أساسيات الحاسوب",
  "تصميم صفحات الويب",
  "أمن المعلومات",
  "القاموس العربي-الإنجليزي",
  "الموسوعة العلمية الميسرة",
  "معجم المصطلحات العلمية",
  "الذكاء الاصطناعي للمبتدئين",
  // Quran Sciences (9)
  "أحكام تجويد القرآن",
  "تفسير الجلالين",
  "علوم القرآن",
  "المعين في حفظ القرآن",
  "معاني الكلمات القرآنية",
  "أسباب النزول",
  "إعراب القرآن الكريم",
  "تحفة الأطفال في التجويد",
  "القراءات العشر",
]

interface OLSearchResult {
  title: string
  isbn?: string
  coverId?: number
  coverUrl?: string
  olTitle?: string
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function searchOL(title: string): Promise<OLSearchResult | null> {
  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5&fields=title,author_name,isbn,cover_i`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null

    const data = await res.json()

    for (const doc of data.docs || []) {
      if (doc.cover_i) {
        const isbn =
          doc.isbn?.find((i: string) => i.length === 13) || doc.isbn?.[0]
        return {
          title,
          olTitle: doc.title,
          isbn,
          coverId: doc.cover_i,
          coverUrl: isbn
            ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
            : `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log("Fetching Open Library covers for catalog books...\n")

  const results: Record<
    string,
    { isbn?: string; coverUrl: string; olTitle?: string }
  > = {}

  // 1. Add Harry Potter books (hardcoded)
  console.log("=== Harry Potter (hardcoded) ===")
  for (const hp of HARRY_POTTER_BOOKS) {
    results[hp.title] = {
      isbn: hp.isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${hp.isbn}-M.jpg`,
    }
    console.log(`  ${hp.title}: ${hp.isbn}`)
  }

  // 2. Add known ISBNs
  console.log("\n=== Known ISBNs ===")
  for (const [title, isbn] of Object.entries(KNOWN_ISBNS)) {
    results[title] = {
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
    }
    console.log(`  ${title}: ${isbn}`)
  }

  // 3. Search OL for remaining books
  console.log("\n=== Open Library Search ===")
  let found = 0
  let notFound = 0

  for (const title of SEED_TITLES) {
    // Skip if already have known ISBN
    if (results[title]) {
      continue
    }

    process.stdout.write(`  Searching: ${title}... `)
    const result = await searchOL(title)

    if (result) {
      results[title] = {
        isbn: result.isbn,
        coverUrl: result.coverUrl!,
        olTitle: result.olTitle,
      }
      console.log(`FOUND (${result.isbn || `cover:${result.coverId}`})`)
      found++
    } else {
      console.log("not found")
      notFound++
    }

    // Rate limit: 500ms between requests
    await sleep(500)
  }

  // 4. Output summary
  console.log("\n=== Summary ===")
  console.log(
    `Found: ${found + HARRY_POTTER_BOOKS.length + Object.keys(KNOWN_ISBNS).length}`
  )
  console.log(`Not found: ${notFound}`)
  console.log(`Total: ${Object.keys(results).length}`)

  // 5. Output JSON
  console.log("\n=== JSON Output ===")
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)
