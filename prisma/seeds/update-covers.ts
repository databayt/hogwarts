/**
 * Update Book Covers Script
 * Updates existing books with verified working cover URLs
 * Run with: npx ts-node prisma/seeds/update-covers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COVER_UPDATES: { title: string; coverUrl: string }[] = [
  {
    title: "Atomic Habits",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
  },
  {
    title: "A Short History of Nearly Everything",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1433086293i/21.jpg",
  },
  {
    title: "The 7 Habits of Highly Effective People",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1421842784i/36072.jpg",
  },
  {
    title: "Macbeth",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348967016i/8852.jpg",
  },
  {
    title: "The Giver",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1342493368i/3636.jpg",
  },
  {
    title: "The Little Prince",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367545443i/157993.jpg",
  },
  {
    title: "The Alchemist",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg",
  },
  {
    title: "Cosmos",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532931155i/55030.jpg",
  },
  {
    title: "Romeo and Juliet",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1629680008i/18135.jpg",
  },
  {
    title: "Hamlet",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1351051208i/1420.jpg",
  },
  {
    title: "Pride and Prejudice",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg",
  },
  {
    title: "The Great Gatsby",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1490528560i/4671.jpg",
  },
  {
    title: "Lord of the Flies",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327869409i/7624.jpg",
  },
];

async function updateCovers() {
  console.log("📚 Updating book covers...\n");

  let updated = 0;
  let notFound = 0;

  for (const { title, coverUrl } of COVER_UPDATES) {
    const result = await prisma.book.updateMany({
      where: { title },
      data: { coverUrl },
    });

    if (result.count > 0) {
      console.log(`✅ Updated: ${title}`);
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
