/**
 * Book Cover Updates Script
 * Updates existing books with verified working Open Library cover URLs
 *
 * Safe, additive operation - only updates existing books.
 *
 * Run with: tsx prisma/seeds/covers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// All book covers using Open Library ISBN covers (reliable, public domain)
const COVER_UPDATES: { title: string; coverUrl: string }[] = [
  // Featured Book
  {
    title: "Harry Potter and the Philosopher's Stone",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780747532743-L.jpg",
  },

  // English Literature
  {
    title: "To Kill a Mockingbird",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780446310789-L.jpg",
  },
  {
    title: "1984",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
  },
  {
    title: "Animal Farm",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg",
  },
  {
    title: "Lord of the Flies",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780399501487-L.jpg",
  },
  {
    title: "Pride and Prejudice",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
  },
  {
    title: "The Great Gatsby",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
  },
  {
    title: "Things Fall Apart",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg",
  },
  {
    title: "The Kite Runner",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
  },
  {
    title: "A Thousand Splendid Suns",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781594483851-L.jpg",
  },

  // Science
  {
    title: "A Brief History of Time",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg",
  },
  {
    title: "Cosmos",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780345539434-L.jpg",
  },
  {
    title: "A Short History of Nearly Everything",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780767908184-L.jpg",
  },

  // Young Adult / Classic
  {
    title: "The Alchemist",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
  },
  {
    title: "The Little Prince",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
  },
  {
    title: "The Giver",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780544336261-L.jpg",
  },

  // Shakespeare
  {
    title: "Romeo and Juliet",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743477116-L.jpg",
  },
  {
    title: "Hamlet",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743477123-L.jpg",
  },
  {
    title: "Macbeth",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780743477109-L.jpg",
  },

  // Self Development
  {
    title: "The 7 Habits of Highly Effective People",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781982137274-L.jpg",
  },
  {
    title: "Atomic Habits",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
  },

  // Arabic Literature
  {
    title: "عرس الزين",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780894101908-L.jpg",
  },
  {
    title: "موسم الهجرة إلى الشمال",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141187020-L.jpg",
  },
  {
    title: "بندر شاه",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953686110-L.jpg",
  },
  {
    title: "أولاد حارتنا",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385264730-L.jpg",
  },
  {
    title: "الثلاثية: بين القصرين",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385264679-L.jpg",
  },
  {
    title: "اللص والكلاب",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385264624-L.jpg",
  },
  {
    title: "الأيام",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789774160066-L.jpg",
  },
  {
    title: "كليلة ودمنة",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780140455076-L.jpg",
  },
  {
    title: "ألف ليلة وليلة",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780140449389-L.jpg",
  },
  {
    title: "رياض الصالحين",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789960892795-L.jpg",
  },
  {
    title: "فقه السنة",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789775880680-L.jpg",
  },
  {
    title: "السيرة النبوية",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953520551-L.jpg",
  },
  {
    title: "ديوان محمود درويش",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781566563499-L.jpg",
  },
  {
    title: "ديوان المتنبي",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953445359-L.jpg",
  },
  {
    title: "مقدمة ابن خلدون",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780691166285-L.jpg",
  },
  {
    title: "حكايات كامل كيلاني",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789770278017-L.jpg",
  },
  {
    title: "قصص الأنبياء",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789960892481-L.jpg",
  },
];

export async function updateBookCovers() {
  console.log("📚 Updating book covers with Open Library URLs...\n");

  let updated = 0;
  let notFound = 0;

  for (const { title, coverUrl } of COVER_UPDATES) {
    const result = await prisma.book.updateMany({
      where: { title },
      data: { coverUrl },
    });

    if (result.count > 0) {
      console.log(`✅ ${title.substring(0, 40)}`);
      updated += result.count;
    } else {
      console.log(`⚠️ Not found: ${title}`);
      notFound++;
    }
  }

  console.log(`\n✨ Done! Updated ${updated} books, ${notFound} not found.`);
  return { updated, notFound };
}

// Run directly if executed as script
if (require.main === module) {
  updateBookCovers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
