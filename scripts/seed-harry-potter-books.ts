/**
 * Seed Harry Potter Books to ImageKit and Database
 *
 * This script:
 * 1. Uploads book cover images to ImageKit
 * 2. Creates book records in the database
 *
 * Usage: npx tsx scripts/seed-harry-potter-books.ts
 */

import * as fs from "fs"
import * as path from "path"
import { PrismaClient } from "@prisma/client"
import ImageKit from "imagekit"

const prisma = new PrismaClient()

// ImageKit configuration
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
})

// Harry Potter books data
const harryPotterBooks = [
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#722F37", // Maroon/burgundy
    description:
      "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his grisly aunt and uncle. Then, on Harry's eleventh birthday, a great beetle-eyed giant of a man called Rubeus Hagrid bursts in with some astonishing news: Harry Potter is a wizard, and he has a place at Hogwarts School of Witchcraft and Wizardry.",
    summary:
      "The first book in the Harry Potter series, introducing the magical world and Harry's journey to Hogwarts.",
    totalCopies: 10,
    localFile: "philosopher's stone.jpg",
  },
  {
    title: "Harry Potter and the Prisoner of Azkaban",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#4A90A4", // Teal blue
    description:
      "When the Knight Bus crashes through the darkness and screeches to a halt in front of him, it's the start of another far from ordinary year at Hogwarts for Harry Potter. Sirius Black, escaped mass-murderer and target of the largest manhunt in wizarding history, is on the loose. The Dementors of Azkaban have been stationed to protect Hogwarts, but Harry suspects the only threat they pose is to him.",
    summary:
      "Harry's third year brings the escaped prisoner Sirius Black and the mysterious Dementors to Hogwarts.",
    totalCopies: 8,
    localFile: "prisoner of azkaban.jpg",
  },
  {
    title: "Harry Potter and the Goblet of Fire",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#B8860B", // Dark golden
    description:
      "The Triwizard Tournament is to be held at Hogwarts. Only wizards who are over seventeen are allowed to enter – but that doesn't stop Harry dreaming that he will win the competition. Then at Hallowe'en, when the Goblet of Fire makes its selection, Harry is amazed to find his name is one of those that the magical cup picks out. He will face death-defying tasks, dragons and Dark wizards.",
    summary:
      "The Triwizard Tournament comes to Hogwarts, and Harry unexpectedly becomes a champion.",
    totalCopies: 7,
    localFile: "goblet of fire.png",
  },
  {
    title: "Harry Potter and the Order of the Phoenix",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#FF6B35", // Phoenix orange
    description:
      "Dark times have come to Hogwarts. After the Dementors' attack on his cousin Dudley, Harry Potter knows that Voldemort will stop at nothing to find him. There are many who deny the Dark Lord's return, but Harry is not alone: a secret order gathers at Grimmauld Place to fight against the Dark forces. Harry must allow Professor Snape to teach him how to protect himself from Voldemort's savage assaults on his mind.",
    summary:
      "Harry joins the Order of the Phoenix as Voldemort's return threatens the wizarding world.",
    totalCopies: 6,
    localFile: "order of the Phoenix.jpg",
  },
  {
    title: "Harry Potter and the Half-Blood Prince",
    author: "J.K. Rowling",
    genre: "Fantasy",
    rating: 5,
    coverColor: "#228B22", // Forest green
    description:
      "When Dumbledore arrives at Privet Drive one summer night to collect Harry Potter, his wand hand is blackened and shrivelled, but he does not reveal why. Secrets and suspicion are spreading through the wizarding world, and Hogwarts itself is not safe. Harry is convinced that Malfoy bears the Dark Mark: there is a Death Eater amongst them. Harry will need powerful magic and true friends as he explores Voldemort's darkest secrets.",
    summary:
      "Harry learns about Voldemort's past and the mysterious Half-Blood Prince's potions book.",
    totalCopies: 5,
    localFile: "half-blood prince.png",
  },
]

async function uploadToImageKit(
  filePath: string,
  fileName: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath)
  const base64File = fileBuffer.toString("base64")

  const response = await imagekit.upload({
    file: base64File,
    fileName: fileName.replace(/[^a-zA-Z0-9.-]/g, "-"),
    folder: "hogwarts/library/books",
    useUniqueFileName: true,
  })

  console.log(`Uploaded: ${fileName} -> ${response.url}`)
  return response.url
}

async function main() {
  console.log("Starting Harry Potter books seeding...\n")

  // Get the demo school for seeding
  const school = await prisma.school.findFirst({
    where: {
      OR: [{ domain: "demo" }, { domain: "hogwarts" }],
    },
  })

  if (!school) {
    console.error(
      "No demo or hogwarts school found. Please seed schools first."
    )
    process.exit(1)
  }

  console.log(`Using school: ${school.name} (${school.domain})\n`)

  const booksDir = path.join(process.cwd(), "public", "books")

  for (const book of harryPotterBooks) {
    try {
      const filePath = path.join(booksDir, book.localFile)

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        continue
      }

      // Upload to ImageKit
      console.log(`Uploading ${book.title}...`)
      const coverUrl = await uploadToImageKit(filePath, book.localFile)

      // Check if book already exists
      const existingBook = await prisma.book.findFirst({
        where: {
          title: book.title,
          schoolId: school.id,
        },
      })

      if (existingBook) {
        // Update existing book
        await prisma.book.update({
          where: { id: existingBook.id },
          data: {
            coverUrl,
            coverColor: book.coverColor,
            description: book.description,
            summary: book.summary,
          },
        })
        console.log(`Updated: ${book.title}\n`)
      } else {
        // Create new book
        await prisma.book.create({
          data: {
            title: book.title,
            author: book.author,
            genre: book.genre,
            rating: book.rating,
            coverUrl,
            coverColor: book.coverColor,
            description: book.description,
            summary: book.summary,
            totalCopies: book.totalCopies,
            availableCopies: book.totalCopies,
            schoolId: school.id,
          },
        })
        console.log(`Created: ${book.title}\n`)
      }
    } catch (error) {
      console.error(`Error processing ${book.title}:`, error)
    }
  }

  console.log("\nHarry Potter books seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
