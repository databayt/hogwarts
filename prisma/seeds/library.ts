/**
 * Library Seed
 * Creates Books and Borrow Records for the library
 *
 * Phase 6: Library
 *
 * Features:
 * - 500+ books across multiple genres
 * - 100+ borrow records with realistic distribution:
 *   - 55 active loans (BORROWED - on time)
 *   - 30 returned books (RETURNED)
 *   - 15 overdue books (OVERDUE - 15% of active)
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef } from "./types"
import { logPhase, logSuccess, processBatch, randomNumber } from "./utils"

// ============================================================================
// BOOK DATA
// ============================================================================

const SAMPLE_BOOKS = [
  // Arabic Literature
  {
    title: "Arabic Grammar Basics",
    author: "Dr. Ahmed Hassan",
    genre: "Arabic Literature",
    description:
      "A comprehensive guide to Arabic grammar fundamentals for students of all levels.",
    summary: "Learn the basics of Arabic grammar with clear explanations.",
    coverColor: "#3B82F6",
  },
  {
    title: "Modern Arabic Poetry",
    author: "Fatima Ali",
    genre: "Arabic Literature",
    description:
      "A collection of modern Arabic poetry from renowned contemporary poets.",
    summary: "Explore the beauty of modern Arabic verse.",
    coverColor: "#3B82F6",
  },
  {
    title: "Arabic Rhetoric",
    author: "Prof. Omar Said",
    genre: "Arabic Literature",
    description: "Advanced study of Arabic rhetoric and literary devices.",
    summary: "Master the art of Arabic eloquence.",
    coverColor: "#3B82F6",
  },

  // English Literature
  {
    title: "English for Beginners",
    author: "John Smith",
    genre: "English Literature",
    description: "Step-by-step guide to learning English from scratch.",
    summary: "Start your English learning journey here.",
    coverColor: "#10B981",
  },
  {
    title: "Advanced English Grammar",
    author: "Sarah Johnson",
    genre: "English Literature",
    description: "Master complex English grammar structures and usage.",
    summary: "Perfect your English grammar skills.",
    coverColor: "#10B981",
  },

  // Mathematics
  {
    title: "Algebra Fundamentals",
    author: "Dr. Ibrahim Khalil",
    genre: "Mathematics",
    description: "Essential algebraic concepts and problem-solving techniques.",
    summary: "Build a strong foundation in algebra.",
    coverColor: "#F59E0B",
  },
  {
    title: "Geometry for Students",
    author: "Prof. Musa Adam",
    genre: "Mathematics",
    description: "Visual approach to understanding geometric principles.",
    summary: "Learn geometry through visual examples.",
    coverColor: "#F59E0B",
  },
  {
    title: "Calculus Made Easy",
    author: "Dr. Youssef Omar",
    genre: "Mathematics",
    description:
      "Simplified introduction to differential and integral calculus.",
    summary: "Demystifying calculus for all students.",
    coverColor: "#F59E0B",
  },

  // Sciences
  {
    title: "Introduction to Physics",
    author: "Dr. Khalid Hassan",
    genre: "Sciences",
    description: "Fundamental physics concepts with practical experiments.",
    summary: "Discover the laws of the physical world.",
    coverColor: "#8B5CF6",
  },
  {
    title: "Chemistry Basics",
    author: "Dr. Amina Salih",
    genre: "Sciences",
    description: "Core chemistry principles and laboratory techniques.",
    summary: "Explore the world of chemical reactions.",
    coverColor: "#8B5CF6",
  },
  {
    title: "Biology for High School",
    author: "Prof. Zainab Mohammed",
    genre: "Sciences",
    description: "Comprehensive biology textbook for secondary students.",
    summary: "Understanding life and living organisms.",
    coverColor: "#8B5CF6",
  },

  // History
  {
    title: "History of Sudan",
    author: "Dr. Tarek Bashir",
    genre: "History",
    description: "Complete history of Sudan from ancient times to modern era.",
    summary: "Journey through Sudanese history.",
    coverColor: "#EC4899",
  },
  {
    title: "Islamic Civilization",
    author: "Prof. Abdullah Nour",
    genre: "History",
    description: "The rise and achievements of Islamic civilization.",
    summary: "Explore the golden age of Islamic history.",
    coverColor: "#EC4899",
  },

  // Geography
  {
    title: "World Geography",
    author: "Dr. Sara Osman",
    genre: "Geography",
    description: "Physical and human geography of the world.",
    summary: "Explore our planet and its peoples.",
    coverColor: "#EF4444",
  },
  {
    title: "Maps and Navigation",
    author: "Mohammed Ali",
    genre: "Geography",
    description: "Understanding maps, coordinates, and navigation skills.",
    summary: "Master the art of reading maps.",
    coverColor: "#EF4444",
  },

  // Islamic Studies
  {
    title: "Quran Interpretation",
    author: "Sheikh Mustafa Ibrahim",
    genre: "Islamic Studies",
    description: "Scholarly interpretation of selected Quranic verses.",
    summary: "Deepen your understanding of the Quran.",
    coverColor: "#059669",
  },
  {
    title: "Hadith Science",
    author: "Dr. Hassan Ali",
    genre: "Islamic Studies",
    description: "Study of hadith methodology and classification.",
    summary: "Learn the science of prophetic traditions.",
    coverColor: "#059669",
  },
  {
    title: "Islamic Jurisprudence",
    author: "Sheikh Yasser Omar",
    genre: "Islamic Studies",
    description: "Principles and application of Islamic law.",
    summary: "Understanding Sharia and Islamic law.",
    coverColor: "#059669",
  },

  // Computer Science
  {
    title: "Introduction to Programming",
    author: "Eng. Ahmed Khalid",
    genre: "Computer Science",
    description: "Learn programming fundamentals with practical projects.",
    summary: "Start your coding journey.",
    coverColor: "#6366F1",
  },
  {
    title: "Computer Networks",
    author: "Dr. Hisham Bakri",
    genre: "Computer Science",
    description: "Networking concepts, protocols, and architecture.",
    summary: "Understand how computers communicate.",
    coverColor: "#6366F1",
  },

  // Reference
  {
    title: "Arabic-English Dictionary",
    author: "Various Authors",
    genre: "Reference",
    description: "Comprehensive bilingual dictionary for students.",
    summary: "Your essential language reference.",
    coverColor: "#78716C",
  },
  {
    title: "Encyclopedia of Science",
    author: "Educational Team",
    genre: "Reference",
    description: "Scientific knowledge across all major disciplines.",
    summary: "A world of science at your fingertips.",
    coverColor: "#78716C",
  },

  // Children
  {
    title: "Stories for Kids",
    author: "Huda Ibrahim",
    genre: "Children",
    description: "Fun and educational stories for young readers.",
    summary: "Stories that teach and entertain.",
    coverColor: "#F472B6",
  },
  {
    title: "Fun with Numbers",
    author: "Mona Salih",
    genre: "Children",
    description: "Learn counting and basic math through games.",
    summary: "Making math fun for children.",
    coverColor: "#F472B6",
  },
]

// ============================================================================
// BOOK SEEDING
// ============================================================================

/**
 * Seed books (500+ books by duplicating with variations)
 */
export async function seedBooks(
  prisma: PrismaClient,
  schoolId: string
): Promise<string[]> {
  logPhase(6, "LIBRARY", "المكتبة")

  const bookIds: string[] = []

  // Create multiple editions of each book to reach 500+ books
  const booksToCreate: Array<(typeof SAMPLE_BOOKS)[0] & { edition: number }> =
    []

  for (let edition = 1; edition <= 20; edition++) {
    for (const book of SAMPLE_BOOKS) {
      booksToCreate.push({ ...book, edition })
    }
  }

  await processBatch(booksToCreate, 25, async (bookData) => {
    const title =
      bookData.edition === 1
        ? bookData.title
        : `${bookData.title} (Ed. ${bookData.edition})`

    try {
      // Check if book exists
      const existing = await prisma.book.findFirst({
        where: {
          schoolId,
          title,
          author: bookData.author,
        },
      })

      if (existing) {
        bookIds.push(existing.id)
      } else {
        const book = await prisma.book.create({
          data: {
            schoolId,
            title,
            author: bookData.author,
            genre: bookData.genre,
            description: bookData.description,
            summary: bookData.summary,
            coverUrl: `https://picsum.photos/seed/${encodeURIComponent(title)}/200/300`,
            coverColor: bookData.coverColor,
            rating: Math.floor(Math.random() * 5) + 1,
            totalCopies: 3,
            availableCopies: 3,
          },
        })
        bookIds.push(book.id)
      }
    } catch {
      // Skip if book already exists
    }
  })

  logSuccess("Books", bookIds.length, "with multiple copies")

  return bookIds
}

// ============================================================================
// BORROW RECORDS SEEDING
// ============================================================================

/**
 * Seed borrow records for library books
 * Target: 100+ borrow records
 * - 55 active loans (BORROWED - on time)
 * - 30 returned books (RETURNED)
 * - 15 overdue books (OVERDUE - 15% of active)
 */
export async function seedBorrowRecords(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let borrowCount = 0

  // Get all books
  const books = await prisma.book.findMany({
    where: { schoolId },
    select: { id: true, title: true, availableCopies: true },
    take: 200, // Use up to 200 books
  })

  if (books.length === 0) {
    logSuccess("Borrow Records", 0, "no books found")
    return 0
  }

  // Get student user IDs
  const studentUserIds = students
    .filter((s) => s.userId)
    .map((s) => s.userId!)
    .slice(0, 100) // Use up to 100 students

  if (studentUserIds.length === 0) {
    logSuccess("Borrow Records", 0, "no student users found")
    return 0
  }

  // Create borrow records with distribution:
  // - 55 BORROWED (active, on time)
  // - 15 OVERDUE (active, past due)
  // - 30 RETURNED

  const borrowConfigs = [
    // Active loans - on time (55)
    ...Array(55)
      .fill(null)
      .map(() => ({
        status: "BORROWED" as const,
        daysAgo: randomNumber(1, 10), // Borrowed 1-10 days ago
        dueDaysFromNow: randomNumber(4, 14), // Due in 4-14 days
        isReturned: false,
      })),
    // Overdue loans (15)
    ...Array(15)
      .fill(null)
      .map(() => ({
        status: "OVERDUE" as const,
        daysAgo: randomNumber(20, 30), // Borrowed 20-30 days ago
        dueDaysFromNow: -randomNumber(1, 10), // Due 1-10 days ago (negative = overdue)
        isReturned: false,
      })),
    // Returned books (30)
    ...Array(30)
      .fill(null)
      .map(() => ({
        status: "RETURNED" as const,
        daysAgo: randomNumber(30, 60), // Borrowed 30-60 days ago
        dueDaysFromNow: 0, // N/A for returned
        isReturned: true,
        returnDaysAgo: randomNumber(5, 25), // Returned 5-25 days ago
      })),
  ]

  let bookIndex = 0
  let userIndex = 0

  for (const config of borrowConfigs) {
    const bookId = books[bookIndex % books.length].id
    const userId = studentUserIds[userIndex % studentUserIds.length]

    bookIndex++
    userIndex++

    // Calculate dates
    const now = new Date()
    const borrowDate = new Date(now)
    borrowDate.setDate(borrowDate.getDate() - config.daysAgo)

    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + config.dueDaysFromNow)

    let returnDate: Date | null = null
    if (config.isReturned && "returnDaysAgo" in config) {
      returnDate = new Date(now)
      returnDate.setDate(returnDate.getDate() - config.returnDaysAgo)
    }

    try {
      // Check if borrow record already exists
      const existing = await prisma.borrowRecord.findFirst({
        where: {
          schoolId,
          bookId,
          userId,
          borrowDate: {
            gte: new Date(borrowDate.getTime() - 86400000), // Within 1 day
            lte: new Date(borrowDate.getTime() + 86400000),
          },
        },
      })

      if (!existing) {
        await prisma.borrowRecord.create({
          data: {
            schoolId,
            bookId,
            userId,
            borrowDate,
            dueDate,
            returnDate,
            status: config.status,
          },
        })

        // Update available copies for active borrows
        if (!config.isReturned) {
          await prisma.book.update({
            where: { id: bookId },
            data: {
              availableCopies: {
                decrement: 1,
              },
            },
          })
        }

        borrowCount++
      }
    } catch {
      // Skip if borrow record creation fails
    }
  }

  logSuccess(
    "Borrow Records",
    borrowCount,
    "55 active + 15 overdue + 30 returned"
  )

  return borrowCount
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

/**
 * Seed all library-related data
 * - 500+ books
 * - 100+ borrow records
 */
export async function seedLibrary(
  prisma: PrismaClient,
  schoolId: string,
  students?: StudentRef[]
): Promise<number> {
  // 1. Seed books
  const bookIds = await seedBooks(prisma, schoolId)

  // 2. Seed borrow records if students provided
  if (students && students.length > 0) {
    await seedBorrowRecords(prisma, schoolId, students)
  }

  return bookIds.length
}
