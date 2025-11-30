/**
 * Library Seed Module
 * Creates library books
 */

import type { SeedPrisma } from "./types";

const BOOKS_DATA = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", rating: 5, coverColor: "#8B4513", totalCopies: 8, availableCopies: 6 },
  { title: "1984", author: "George Orwell", genre: "Science Fiction", rating: 5, coverColor: "#2F4F4F", totalCopies: 10, availableCopies: 7 },
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", rating: 5, coverColor: "#FFB6C1", totalCopies: 6, availableCopies: 5 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Fiction", rating: 4, coverColor: "#FFD700", totalCopies: 7, availableCopies: 6 },
  { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", rating: 5, coverColor: "#8B0000", totalCopies: 15, availableCopies: 10 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", rating: 5, coverColor: "#228B22", totalCopies: 8, availableCopies: 6 },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Fiction", rating: 4, coverColor: "#DC143C", totalCopies: 5, availableCopies: 4 },
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien", genre: "Fantasy", rating: 5, coverColor: "#4B0082", totalCopies: 6, availableCopies: 4 },
  { title: "Animal Farm", author: "George Orwell", genre: "Political Satire", rating: 4, coverColor: "#8B4513", totalCopies: 8, availableCopies: 7 },
  { title: "Brave New World", author: "Aldous Huxley", genre: "Science Fiction", rating: 4, coverColor: "#4682B4", totalCopies: 5, availableCopies: 5 },
  { title: "The Chronicles of Narnia", author: "C.S. Lewis", genre: "Fantasy", rating: 5, coverColor: "#DAA520", totalCopies: 10, availableCopies: 8 },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", genre: "Education", rating: 5, coverColor: "#1E90FF", totalCopies: 12, availableCopies: 10 },
  { title: "Physics: Principles with Applications", author: "Douglas C. Giancoli", genre: "Education", rating: 4, coverColor: "#32CD32", totalCopies: 15, availableCopies: 12 },
  { title: "Chemistry: The Central Science", author: "Theodore L. Brown", genre: "Education", rating: 4, coverColor: "#9932CC", totalCopies: 15, availableCopies: 13 },
  { title: "Biology", author: "Neil A. Campbell", genre: "Education", rating: 5, coverColor: "#20B2AA", totalCopies: 14, availableCopies: 11 },
  { title: "Oxford English Dictionary", author: "Oxford University Press", genre: "Reference", rating: 5, coverColor: "#000080", totalCopies: 20, availableCopies: 18 },
  { title: "Arabic Grammar Simplified", author: "Dr. Ahmed Hassan", genre: "Education", rating: 4, coverColor: "#8B0000", totalCopies: 25, availableCopies: 22 },
  { title: "World History: Patterns of Interaction", author: "Various Authors", genre: "Education", rating: 4, coverColor: "#CD853F", totalCopies: 18, availableCopies: 15 },
  { title: "Geography: Realms, Regions, and Concepts", author: "H.J. de Blij", genre: "Education", rating: 4, coverColor: "#006400", totalCopies: 12, availableCopies: 10 },
  { title: "The Quran: English Translation", author: "Various Translators", genre: "Religious Studies", rating: 5, coverColor: "#006400", totalCopies: 30, availableCopies: 28 },
];

export async function seedLibrary(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📚 Creating library books...");

  await prisma.book.createMany({
    data: BOOKS_DATA.map((book) => ({
      schoolId,
      title: book.title,
      author: book.author,
      genre: book.genre,
      rating: book.rating,
      coverColor: book.coverColor,
      description: `A comprehensive book on ${book.genre.toLowerCase()}.`,
      summary: `${book.title} by ${book.author} is an essential read.`,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      coverUrl: `/placeholder-book-cover.jpg`,
    })),
    skipDuplicates: true,
  });

  console.log(`   ✅ Created: ${BOOKS_DATA.length} library books\n`);
}
