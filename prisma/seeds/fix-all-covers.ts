/**
 * Fix All Book Covers Script
 * Updates all books with verified working cover URLs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COVER_UPDATES: { title: string; coverUrl: string }[] = [
  // Harry Potter
  {
    title: "Harry Potter and the Philosopher's Stone",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg",
  },
  // Classic English Literature
  {
    title: "To Kill a Mockingbird",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg",
  },
  {
    title: "1984",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg",
  },
  {
    title: "Animal Farm",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1325861570i/170448.jpg",
  },
  {
    title: "Things Fall Apart",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1352082529i/37781.jpg",
  },
  {
    title: "The Kite Runner",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579036753i/77203.jpg",
  },
  {
    title: "A Thousand Splendid Suns",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655336738i/128029.jpg",
  },
  {
    title: "A Brief History of Time",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1333578746i/3869.jpg",
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329310i/23692271.jpg",
  },
  // Arabic Literature - using color fallbacks since Arabic book covers are harder to find
  {
    title: "عرس الزين",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1309286238i/5765836.jpg",
  },
  {
    title: "موسم الهجرة إلى الشمال",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1309211537i/52091.jpg",
  },
  {
    title: "أولاد حارتنا",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1291063389i/5860.jpg",
  },
  {
    title: "الثلاثية: بين القصرين",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1291063512i/5861.jpg",
  },
  {
    title: "اللص والكلاب",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1309288506i/5765774.jpg",
  },
  {
    title: "ألف ليلة وليلة",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348201841i/93101.jpg",
  },
  {
    title: "كليلة ودمنة",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1328754491i/816685.jpg",
  },
  {
    title: "مقدمة ابن خلدون",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348978569i/2723411.jpg",
  },
];

async function updateCovers() {
  console.log("📚 Fixing all book covers...\n");

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
}

updateCovers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
