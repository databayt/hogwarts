/**
 * Library Seed
 * Creates Books for the library
 *
 * Phase 6: Library
 */

import type { PrismaClient } from "@prisma/client"

import { logPhase, logSuccess, processBatch } from "./utils"

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
// LIBRARY SEEDING
// ============================================================================

/**
 * Seed books (500+ books by duplicating with variations)
 */
export async function seedLibrary(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  logPhase(6, "LIBRARY", "المكتبة")

  let bookCount = 0

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

      if (!existing) {
        await prisma.book.create({
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
        bookCount++
      }
    } catch {
      // Skip if book already exists
    }
  })

  logSuccess("Books", bookCount, "with multiple copies")

  return bookCount
}
