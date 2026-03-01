// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Library Seed
 * Creates 44 books with real Open Library covers and borrow records
 *
 * Phase 6: Library
 *
 * Features:
 * - 44 books with real covers from Open Library
 * - totalCopies: 2-5 per book (realistic)
 * - 100 borrow records: 55 active + 15 overdue + 30 returned
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef } from "./types"
import { logPhase, logSuccess, randomNumber } from "./utils"

// ============================================================================
// BOOK DATA - 90 unique Arabic-titled books
// ============================================================================

interface BookSeed {
  title: string
  author: string
  genre: string
  gradeLevel: string
  description: string
  summary: string
  coverColor: string
  copies: number
  publisher?: string
  publicationYear?: number
  language?: string
  pageCount?: number
}

// Open Library cover data (shared with catalog-books.ts)
const COVER_DATA: Record<string, { isbn?: string; coverUrl: string }> = {
  "المعلقات السبع": {
    coverUrl: "https://covers.openlibrary.org/b/id/10972247-M.jpg",
  },
  "الكامل في اللغة والأدب": {
    coverUrl: "https://covers.openlibrary.org/b/id/6115237-M.jpg",
  },
  "ألف ليلة وليلة": {
    isbn: "9781536966961",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781536966961-M.jpg",
  },
  "كليلة ودمنة": {
    isbn: "9781784350406",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781784350406-M.jpg",
  },
  "مقدمة ابن خلدون": {
    isbn: "9789772380305",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789772380305-M.jpg",
  },
  "طوق الحمامة": {
    isbn: "9789653427778",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789653427778-M.jpg",
  },
  "قصص الأنبياء": {
    isbn: "9781643543727",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781643543727-M.jpg",
  },
  "السيرة النبوية": {
    coverUrl: "https://covers.openlibrary.org/b/id/6593524-M.jpg",
  },
  "تفسير ابن كثير": {
    isbn: "9781643544670",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781643544670-M.jpg",
  },
  "الأربعون النووية": {
    isbn: "9789839154030",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789839154030-M.jpg",
  },
  "فقه السنة": {
    isbn: "9780892591220",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780892591220-M.jpg",
  },
  "حصن المسلم": {
    isbn: "9781980679226",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781980679226-M.jpg",
  },
  "الرحيق المختوم": {
    isbn: "9789953320991",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9789953320991-M.jpg",
  },
  "English for Beginners": {
    isbn: "9781473683556",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781473683556-M.jpg",
  },
  "English Grammar in Use": {
    isbn: "9780521189064",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780521189064-M.jpg",
  },
  "Oxford Picture Dictionary": {
    isbn: "9780194505291",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780194505291-M.jpg",
  },
  "English Vocabulary in Use": {
    isbn: "9780521149884",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780521149884-M.jpg",
  },
  "Stories for Young Readers": {
    isbn: "9780342406906",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780342406906-M.jpg",
  },
  "English Conversation Practice": {
    isbn: "9780070996038",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780070996038-M.jpg",
  },
  "English Writing Skills": {
    isbn: "9780435280215",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780435280215-M.jpg",
  },
  "English Phonics": {
    isbn: "9781909330092",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781909330092-M.jpg",
  },
  "تفسير الجلالين": {
    isbn: "9781870582612",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781870582612-M.jpg",
  },
  // K-12 Collection
  "Alice's Adventures in Wonderland": {
    isbn: "9783965450066",
    coverUrl: "https://covers.openlibrary.org/b/id/13828715-M.jpg",
  },
  "The Wonderful Wizard of Oz": {
    isbn: "9780590417464",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780590417464-M.jpg",
  },
  "The Secret Garden": {
    isbn: "9781435158184",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781435158184-M.jpg",
  },
  "Adventures of Huckleberry Finn": {
    isbn: "9781082758249",
    coverUrl: "https://covers.openlibrary.org/b/id/8157718-M.jpg",
  },
  "Robinson Crusoe": {
    isbn: "9781546677673",
    coverUrl: "https://covers.openlibrary.org/b/id/368541-M.jpg",
  },
  "Treasure Island": {
    isbn: "9780450033094",
    coverUrl: "https://covers.openlibrary.org/b/id/13859660-M.jpg",
  },
  "A Christmas Carol": {
    isbn: "9781638561125",
    coverUrl: "https://covers.openlibrary.org/b/id/12875748-M.jpg",
  },
  "The Very Hungry Caterpillar": {
    isbn: "9780971397538",
    coverUrl: "https://covers.openlibrary.org/b/id/7835968-M.jpg",
  },
  Heidi: {
    isbn: "9781577656883",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781577656883-M.jpg",
  },
  "One Fish, Two Fish, Red Fish, Blue Fish": {
    isbn: "9780676508017",
    coverUrl: "https://covers.openlibrary.org/b/id/12096-M.jpg",
  },
  "Hop on Pop": {
    isbn: "9780001711181",
    coverUrl: "https://covers.openlibrary.org/b/id/254551-M.jpg",
  },
  Matilda: {
    isbn: "9780670824397",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780670824397-M.jpg",
  },
  "The BFG": {
    isbn: "9783499217562",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9783499217562-M.jpg",
  },
  "The Book Thief": {
    isbn: "9787544238212",
    coverUrl: "https://covers.openlibrary.org/b/id/8153054-M.jpg",
  },
  Hatchet: {
    isbn: "9781563121555",
    coverUrl: "https://covers.openlibrary.org/b/id/11240448-M.jpg",
  },
  "Island of the Blue Dolphins": {
    isbn: "9780141368627",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780141368627-M.jpg",
  },
  Divergent: {
    isbn: "9781594137457",
    coverUrl: "https://covers.openlibrary.org/b/id/13274634-M.jpg",
  },
  Biology: {
    isbn: "9783868942590",
    coverUrl: "https://covers.openlibrary.org/b/id/581911-M.jpg",
  },
  Chemistry: {
    isbn: "9780131464834",
    coverUrl: "https://covers.openlibrary.org/b/id/9407725-M.jpg",
  },
  Physics: {
    isbn: "9780131021532",
    coverUrl: "https://covers.openlibrary.org/b/id/9153769-M.jpg",
  },
}

const BOOKS: BookSeed[] = [
  // Arabic Literature (7)
  {
    title: "المعلقات السبع",
    author: "شعراء الجاهلية",
    genre: "الأدب العربي",
    gradeLevel: "GENERAL",
    description: "المعلقات السبع الشهيرة من الشعر الجاهلي مع شرح وتحليل",
    summary: "دراسة تحليلية للمعلقات السبع",
    coverColor: "#3B82F6",
    copies: 4,
    publisher: "دار المعارف",
    publicationYear: 2005,
    language: "العربية",
    pageCount: 320,
  },
  {
    title: "الكامل في اللغة والأدب",
    author: "المبرد",
    genre: "الأدب العربي",
    gradeLevel: "GENERAL",
    description: "موسوعة أدبية لغوية من التراث العربي",
    summary: "موسوعة اللغة والأدب",
    coverColor: "#3B82F6",
    copies: 2,
    publisher: "دار الكتب العلمية",
    publicationYear: 1997,
    language: "العربية",
    pageCount: 648,
  },
  {
    title: "ألف ليلة وليلة",
    author: "مجهول",
    genre: "الأدب العربي",
    gradeLevel: "GENERAL",
    description: "مجموعة حكايات شعبية عربية شهيرة",
    summary: "حكايات ألف ليلة وليلة",
    coverColor: "#3B82F6",
    copies: 5,
    publisher: "دار صادر",
    publicationYear: 2008,
    language: "العربية",
    pageCount: 1200,
  },
  {
    title: "كليلة ودمنة",
    author: "ابن المقفع",
    genre: "الأدب العربي",
    gradeLevel: "GENERAL",
    description: "حكايات على ألسنة الحيوانات في الحكمة والأخلاق",
    summary: "حكايات الحكمة والأخلاق",
    coverColor: "#3B82F6",
    copies: 4,
    publisher: "دار الساقي",
    publicationYear: 2014,
    language: "العربية",
    pageCount: 256,
  },
  {
    title: "مقدمة ابن خلدون",
    author: "ابن خلدون",
    genre: "الأدب العربي",
    gradeLevel: "GENERAL",
    description: "أول كتاب في علم الاجتماع وفلسفة التاريخ",
    summary: "أساس علم الاجتماع",
    coverColor: "#3B82F6",
    copies: 3,
    publisher: "دار الفكر",
    publicationYear: 2001,
    language: "العربية",
    pageCount: 880,
  },
  {
    title: "طوق الحمامة",
    author: "ابن حزم",
    genre: "الأدب العربي",
    gradeLevel: "GENERAL",
    description: "رسالة في الحب والأخلاق من التراث الأندلسي",
    summary: "فلسفة الحب عند العرب",
    coverColor: "#3B82F6",
    copies: 3,
    publisher: "دار الآفاق الجديدة",
    publicationYear: 2010,
    language: "العربية",
    pageCount: 192,
  },

  // Islamic Studies (7)
  {
    title: "قصص الأنبياء",
    author: "ابن كثير",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "قصص الأنبياء والرسل من القرآن الكريم والسنة النبوية",
    summary: "قصص الأنبياء من القرآن",
    coverColor: "#059669",
    copies: 5,
    publisher: "دار ابن كثير",
    publicationYear: 2010,
    language: "العربية",
    pageCount: 480,
  },
  {
    title: "السيرة النبوية",
    author: "ابن هشام",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "سيرة النبي محمد صلى الله عليه وسلم من المولد إلى الوفاة",
    summary: "حياة النبي صلى الله عليه وسلم",
    coverColor: "#059669",
    copies: 4,
    publisher: "دار الكتاب العربي",
    publicationYear: 1990,
    language: "العربية",
    pageCount: 752,
  },
  {
    title: "تفسير ابن كثير",
    author: "ابن كثير",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "من أشهر التفاسير بالمأثور، يعتمد على الأحاديث والآثار",
    summary: "تفسير القرآن بالمأثور",
    coverColor: "#059669",
    copies: 3,
    publisher: "دار طيبة",
    publicationYear: 1999,
    language: "العربية",
    pageCount: 2400,
  },
  {
    title: "الأربعون النووية",
    author: "الإمام النووي",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "أربعون حديثاً نبوياً جامعة لأصول الدين",
    summary: "أحاديث جامعة لأصول الدين",
    coverColor: "#059669",
    copies: 5,
    publisher: "دار ابن حزم",
    publicationYear: 2003,
    language: "العربية",
    pageCount: 96,
  },
  {
    title: "فقه السنة",
    author: "سيد سابق",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "كتاب شامل في الفقه الإسلامي مع الأدلة من الكتاب والسنة",
    summary: "الفقه الإسلامي الميسر",
    coverColor: "#059669",
    copies: 3,
    publisher: "دار الفتح",
    publicationYear: 1995,
    language: "العربية",
    pageCount: 920,
  },
  {
    title: "حصن المسلم",
    author: "سعيد القحطاني",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "أذكار وأدعية من الكتاب والسنة",
    summary: "الأذكار والأدعية اليومية",
    coverColor: "#059669",
    copies: 5,
    publisher: "مؤسسة الجريسي",
    publicationYear: 2018,
    language: "العربية",
    pageCount: 160,
  },
  {
    title: "الرحيق المختوم",
    author: "صفي الرحمن المباركفوري",
    genre: "الدراسات الإسلامية",
    gradeLevel: "GENERAL",
    description: "سيرة نبوية حائزة على جائزة رابطة العالم الإسلامي",
    summary: "أفضل كتب السيرة النبوية",
    coverColor: "#059669",
    copies: 4,
    publisher: "دار السلام",
    publicationYear: 2002,
    language: "العربية",
    pageCount: 544,
  },

  // English (8)
  {
    title: "English for Beginners",
    author: "John Smith",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Step-by-step guide to learning English from scratch",
    summary: "Start your English journey",
    coverColor: "#10B981",
    copies: 5,
    publisher: "Longman",
    publicationYear: 2019,
    language: "English",
    pageCount: 224,
  },
  {
    title: "English Grammar in Use",
    author: "Raymond Murphy",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description:
      "The world's best-selling grammar book for intermediate learners",
    summary: "Essential English grammar",
    coverColor: "#10B981",
    copies: 4,
    publisher: "Cambridge University Press",
    publicationYear: 2019,
    language: "English",
    pageCount: 380,
  },
  {
    title: "Oxford Picture Dictionary",
    author: "Jayme Adelson-Goldstein",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Bilingual visual dictionary with 4,000 words",
    summary: "Visual English-Arabic dictionary",
    coverColor: "#10B981",
    copies: 4,
    publisher: "Oxford University Press",
    publicationYear: 2016,
    language: "English",
    pageCount: 304,
  },
  {
    title: "English Vocabulary in Use",
    author: "Michael McCarthy",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Build your vocabulary with practice exercises",
    summary: "Essential English vocabulary",
    coverColor: "#10B981",
    copies: 3,
    publisher: "Cambridge University Press",
    publicationYear: 2017,
    language: "English",
    pageCount: 312,
  },
  {
    title: "Stories for Young Readers",
    author: "Sarah Williams",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Short stories in simple English for young learners",
    summary: "Easy English stories",
    coverColor: "#10B981",
    copies: 5,
    publisher: "Pro Lingua Associates",
    publicationYear: 2004,
    language: "English",
    pageCount: 128,
  },
  {
    title: "English Conversation Practice",
    author: "Grant Taylor",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Practical dialogues for everyday English conversation",
    summary: "Speak English confidently",
    coverColor: "#10B981",
    copies: 3,
    publisher: "McGraw-Hill",
    publicationYear: 2012,
    language: "English",
    pageCount: 198,
  },
  {
    title: "English Writing Skills",
    author: "Diana Hanbury King",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Develop your English writing from sentences to essays",
    summary: "Master English writing",
    coverColor: "#10B981",
    copies: 3,
    publisher: "Educators Publishing Service",
    publicationYear: 2004,
    language: "English",
    pageCount: 176,
  },
  {
    title: "English Phonics",
    author: "Jolly Learning",
    genre: "اللغة الإنجليزية",
    gradeLevel: "GENERAL",
    description: "Learn English sounds and pronunciation systematically",
    summary: "English pronunciation guide",
    coverColor: "#10B981",
    copies: 4,
    publisher: "Jolly Learning Ltd",
    publicationYear: 2012,
    language: "English",
    pageCount: 144,
  },

  // Quran Sciences (1)
  {
    title: "تفسير الجلالين",
    author: "المحلي والسيوطي",
    genre: "علوم القرآن",
    gradeLevel: "GENERAL",
    description: "تفسير موجز وشامل للقرآن الكريم",
    summary: "تفسير مختصر للقرآن",
    coverColor: "#14B8A6",
    copies: 3,
    publisher: "دار الحديث",
    publicationYear: 2001,
    language: "العربية",
    pageCount: 848,
  },
  // K-12 Classics (8)
  {
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description:
      "Alice falls down a rabbit hole into a fantastical underground world",
    summary: "Alice's journey through Wonderland",
    coverColor: "#6366F1",
    copies: 4,
    publisher: "Macmillan",
    publicationYear: 1865,
    language: "English",
    pageCount: 96,
  },
  {
    title: "The Wonderful Wizard of Oz",
    author: "L. Frank Baum",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description:
      "Dorothy is swept away to the magical Land of Oz and must find her way home",
    summary: "Dorothy's adventure in Oz",
    coverColor: "#6366F1",
    copies: 4,
    publisher: "George M. Hill Company",
    publicationYear: 1900,
    language: "English",
    pageCount: 148,
  },
  {
    title: "The Secret Garden",
    author: "Frances Hodgson Burnett",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description:
      "A lonely girl discovers a hidden garden and brings it back to life",
    summary: "The magic of a secret garden",
    coverColor: "#6366F1",
    copies: 4,
    publisher: "Frederick A. Stokes",
    publicationYear: 1911,
    language: "English",
    pageCount: 256,
  },
  {
    title: "Adventures of Huckleberry Finn",
    author: "Mark Twain",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description:
      "Huck Finn escapes his abusive father and rafts down the Mississippi River",
    summary: "Adventures on the Mississippi",
    coverColor: "#6366F1",
    copies: 3,
    publisher: "Chatto & Windus",
    publicationYear: 1884,
    language: "English",
    pageCount: 366,
  },
  {
    title: "Robinson Crusoe",
    author: "Daniel Defoe",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description: "A castaway survives 28 years on a remote tropical island",
    summary: "Survival on a deserted island",
    coverColor: "#6366F1",
    copies: 3,
    publisher: "W. Taylor",
    publicationYear: 1719,
    language: "English",
    pageCount: 304,
  },
  {
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description:
      "Young Jim Hawkins sets sail for treasure and encounters the legendary pirate Long John Silver",
    summary: "Pirates and buried treasure",
    coverColor: "#6366F1",
    copies: 4,
    publisher: "Cassell and Company",
    publicationYear: 1883,
    language: "English",
    pageCount: 240,
  },
  {
    title: "A Christmas Carol",
    author: "Charles Dickens",
    genre: "K-12 Classics",
    gradeLevel: "INTERMEDIATE",
    description:
      "Miserly Scrooge is visited by three ghosts who show him the error of his ways",
    summary: "Scrooge's Christmas transformation",
    coverColor: "#6366F1",
    copies: 4,
    publisher: "Chapman & Hall",
    publicationYear: 1843,
    language: "English",
    pageCount: 132,
  },
  // K-12 Children's (4)
  {
    title: "The Very Hungry Caterpillar",
    author: "Eric Carle",
    genre: "K-12 Children's",
    gradeLevel: "PRIMARY",
    description:
      "A caterpillar eats through a variety of foods before transforming into a butterfly",
    summary: "A caterpillar's colorful journey",
    coverColor: "#F472B6",
    copies: 5,
    publisher: "World Publishing Company",
    publicationYear: 1969,
    language: "English",
    pageCount: 26,
  },
  {
    title: "Heidi",
    author: "Johanna Spyri",
    genre: "K-12 Children's",
    gradeLevel: "PRIMARY",
    description:
      "An orphan girl is sent to live with her grandfather in the Swiss Alps",
    summary: "Life in the Swiss Alps",
    coverColor: "#F472B6",
    copies: 4,
    publisher: "Sterling Children's Books",
    publicationYear: 1881,
    language: "English",
    pageCount: 288,
  },
  {
    title: "One Fish, Two Fish, Red Fish, Blue Fish",
    author: "Dr. Seuss",
    genre: "K-12 Children's",
    gradeLevel: "PRIMARY",
    description:
      "A classic beginner reader with rhyming text and imaginative illustrations",
    summary: "Dr. Seuss counting fun",
    coverColor: "#F472B6",
    copies: 5,
    publisher: "Random House",
    publicationYear: 1960,
    language: "English",
    pageCount: 64,
  },
  {
    title: "Hop on Pop",
    author: "Dr. Seuss",
    genre: "K-12 Children's",
    gradeLevel: "PRIMARY",
    description:
      "The simplest Seuss for youngest use — a playful introduction to reading",
    summary: "First steps in reading",
    coverColor: "#F472B6",
    copies: 5,
    publisher: "Random House",
    publicationYear: 1963,
    language: "English",
    pageCount: 72,
  },
  // K-12 Young Adult (6)
  {
    title: "Matilda",
    author: "Roald Dahl",
    genre: "K-12 Young Adult",
    gradeLevel: "SECONDARY",
    description:
      "A brilliant girl with telekinetic powers stands up to her cruel parents and headmistress",
    summary: "A genius child's magical rebellion",
    coverColor: "#7C3AED",
    copies: 4,
    publisher: "Jonathan Cape",
    publicationYear: 1988,
    language: "English",
    pageCount: 240,
  },
  {
    title: "The BFG",
    author: "Roald Dahl",
    genre: "K-12 Young Adult",
    gradeLevel: "SECONDARY",
    description:
      "A little girl befriends the Big Friendly Giant who catches dreams",
    summary: "The Big Friendly Giant",
    coverColor: "#7C3AED",
    copies: 4,
    publisher: "Jonathan Cape",
    publicationYear: 1982,
    language: "English",
    pageCount: 208,
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    genre: "K-12 Young Adult",
    gradeLevel: "SECONDARY",
    description:
      "A young girl in Nazi Germany finds solace by stealing books and sharing them",
    summary: "Words and courage in wartime",
    coverColor: "#7C3AED",
    copies: 3,
    publisher: "Knopf Books",
    publicationYear: 2005,
    language: "English",
    pageCount: 552,
  },
  {
    title: "Hatchet",
    author: "Gary Paulsen",
    genre: "K-12 Young Adult",
    gradeLevel: "SECONDARY",
    description:
      "A 13-year-old boy must survive alone in the Canadian wilderness with only a hatchet",
    summary: "Wilderness survival adventure",
    coverColor: "#7C3AED",
    copies: 4,
    publisher: "Bradbury Press",
    publicationYear: 1987,
    language: "English",
    pageCount: 195,
  },
  {
    title: "Island of the Blue Dolphins",
    author: "Scott O'Dell",
    genre: "K-12 Young Adult",
    gradeLevel: "SECONDARY",
    description:
      "A girl survives alone for years on an island off the California coast",
    summary: "Alone on an island",
    coverColor: "#7C3AED",
    copies: 3,
    publisher: "Houghton Mifflin",
    publicationYear: 1960,
    language: "English",
    pageCount: 184,
  },
  {
    title: "Divergent",
    author: "Veronica Roth",
    genre: "K-12 Young Adult",
    gradeLevel: "SECONDARY",
    description:
      "In a dystopian Chicago, a girl must choose between five factions that define society",
    summary: "Choosing your faction",
    coverColor: "#7C3AED",
    copies: 3,
    publisher: "Katherine Tegen Books",
    publicationYear: 2011,
    language: "English",
    pageCount: 487,
  },
  // K-12 Science (3)
  {
    title: "Biology",
    author: "Neil Campbell",
    genre: "K-12 Science",
    gradeLevel: "SECONDARY",
    description:
      "The leading college biology textbook covering cells, genetics, evolution, and ecology",
    summary: "Comprehensive biology textbook",
    coverColor: "#8B5CF6",
    copies: 3,
    publisher: "Pearson",
    publicationYear: 2020,
    language: "English",
    pageCount: 1488,
  },
  {
    title: "Chemistry",
    author: "Theodore L. Brown",
    genre: "K-12 Science",
    gradeLevel: "SECONDARY",
    description:
      "A central science approach to chemistry fundamentals for students",
    summary: "The central science of chemistry",
    coverColor: "#8B5CF6",
    copies: 3,
    publisher: "Pearson",
    publicationYear: 2017,
    language: "English",
    pageCount: 1248,
  },
  {
    title: "Physics",
    author: "Douglas C. Giancoli",
    genre: "K-12 Science",
    gradeLevel: "SECONDARY",
    description:
      "Principles of physics with applications, covering mechanics through modern physics",
    summary: "Physics with real-world applications",
    coverColor: "#8B5CF6",
    copies: 3,
    publisher: "Pearson",
    publicationYear: 2014,
    language: "English",
    pageCount: 1056,
  },
]

// ============================================================================
// BOOK SEEDING
// ============================================================================

export async function seedBooks(
  prisma: PrismaClient,
  schoolId: string
): Promise<string[]> {
  logPhase(6, "LIBRARY", "المكتبة")

  const bookIds: string[] = []

  for (const bookData of BOOKS) {
    try {
      // Check if a Book already exists for this school
      const existingBook = await prisma.book.findFirst({
        where: { schoolId, title: bookData.title, author: bookData.author },
      })

      if (existingBook) {
        // Update cover data + metadata + link to catalog if not already linked
        const coverData = COVER_DATA[bookData.title]
        const newCoverUrl = coverData?.coverUrl || ""

        let catalogBookId = existingBook.catalogBookId
        if (!catalogBookId) {
          // Try to find matching CatalogBook to link
          const catalogBook = await prisma.catalogBook.findFirst({
            where: { title: bookData.title, author: bookData.author },
          })
          if (catalogBook) {
            catalogBookId = catalogBook.id

            // Ensure SchoolBookSelection exists
            const existingSelection =
              await prisma.schoolBookSelection.findFirst({
                where: { schoolId, catalogBookId: catalogBook.id },
              })
            if (!existingSelection) {
              await prisma.schoolBookSelection.create({
                data: {
                  schoolId,
                  catalogBookId: catalogBook.id,
                  totalCopies: bookData.copies,
                  availableCopies: bookData.copies,
                  isActive: true,
                },
              })
            }
          }
        }

        await prisma.book.update({
          where: { id: existingBook.id },
          data: {
            ...(existingBook.coverUrl !== newCoverUrl
              ? { coverUrl: newCoverUrl }
              : {}),
            gradeLevel: bookData.gradeLevel,
            isbn: coverData?.isbn || null,
            publisher: bookData.publisher || null,
            publicationYear: bookData.publicationYear || null,
            language: bookData.language || null,
            pageCount: bookData.pageCount || null,
            ...(catalogBookId ? { catalogBookId } : {}),
          },
        })
        bookIds.push(existingBook.id)
      } else {
        // Try to find CatalogBook to link
        const catalogBook = await prisma.catalogBook.findFirst({
          where: { title: bookData.title, author: bookData.author },
        })

        const coverData = COVER_DATA[bookData.title]

        if (catalogBook) {
          // Catalog-linked path: create SchoolBookSelection + Book with catalogBookId
          const existingSelection = await prisma.schoolBookSelection.findFirst({
            where: { schoolId, catalogBookId: catalogBook.id },
          })
          if (!existingSelection) {
            await prisma.schoolBookSelection.create({
              data: {
                schoolId,
                catalogBookId: catalogBook.id,
                totalCopies: bookData.copies,
                availableCopies: bookData.copies,
                isActive: true,
              },
            })
          }

          const book = await prisma.book.create({
            data: {
              schoolId,
              catalogBookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              genre: catalogBook.genre,
              description: catalogBook.description ?? "",
              summary: catalogBook.summary ?? "",
              coverUrl: catalogBook.coverUrl ?? "",
              coverColor: catalogBook.coverColor,
              rating: Math.round(catalogBook.rating),
              totalCopies: bookData.copies,
              availableCopies: bookData.copies,
              videoUrl: catalogBook.videoUrl,
              isbn: catalogBook.isbn,
              publisher: catalogBook.publisher,
              publicationYear: catalogBook.publicationYear,
              language: catalogBook.language,
              pageCount: catalogBook.pageCount,
              gradeLevel: catalogBook.gradeLevel,
            },
          })
          bookIds.push(book.id)
        } else {
          // Fallback: create standalone Book (no catalog entry found)
          const book = await prisma.book.create({
            data: {
              schoolId,
              title: bookData.title,
              author: bookData.author,
              genre: bookData.genre,
              gradeLevel: bookData.gradeLevel,
              description: bookData.description,
              summary: bookData.summary,
              coverUrl: coverData?.coverUrl || "",
              coverColor: bookData.coverColor,
              rating: randomNumber(3, 5),
              totalCopies: bookData.copies,
              availableCopies: bookData.copies,
              isbn: coverData?.isbn || null,
              publisher: bookData.publisher || null,
              publicationYear: bookData.publicationYear || null,
              language: bookData.language || null,
              pageCount: bookData.pageCount || null,
            },
          })
          bookIds.push(book.id)
        }
      }
    } catch {
      // Skip duplicates
    }
  }

  logSuccess("Books", bookIds.length, "catalog-linked collection")

  return bookIds
}

// ============================================================================
// BORROW RECORDS SEEDING
// ============================================================================

export async function seedBorrowRecords(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  let borrowCount = 0

  const books = await prisma.book.findMany({
    where: { schoolId },
    select: { id: true, availableCopies: true },
  })

  if (books.length === 0) {
    logSuccess("Borrow Records", 0, "no books found")
    return 0
  }

  const studentUserIds = students
    .filter((s) => s.userId)
    .map((s) => s.userId!)
    .slice(0, 100)

  if (studentUserIds.length === 0) {
    logSuccess("Borrow Records", 0, "no student users found")
    return 0
  }

  const borrowConfigs = [
    // Active loans - on time (55)
    ...Array(55)
      .fill(null)
      .map(() => ({
        status: "BORROWED" as const,
        daysAgo: randomNumber(1, 10),
        dueDaysFromNow: randomNumber(4, 14),
        isReturned: false,
      })),
    // Overdue loans (15)
    ...Array(15)
      .fill(null)
      .map(() => ({
        status: "OVERDUE" as const,
        daysAgo: randomNumber(20, 30),
        dueDaysFromNow: -randomNumber(1, 10),
        isReturned: false,
      })),
    // Returned books (30)
    ...Array(30)
      .fill(null)
      .map(() => ({
        status: "RETURNED" as const,
        daysAgo: randomNumber(30, 60),
        dueDaysFromNow: 0,
        isReturned: true,
        returnDaysAgo: randomNumber(5, 25),
      })),
  ]

  let bookIndex = 0
  let userIndex = 0

  for (const config of borrowConfigs) {
    const bookId = books[bookIndex % books.length].id
    const userId = studentUserIds[userIndex % studentUserIds.length]

    bookIndex++
    userIndex++

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
      const existing = await prisma.borrowRecord.findFirst({
        where: {
          schoolId,
          bookId,
          userId,
          borrowDate: {
            gte: new Date(borrowDate.getTime() - 86400000),
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

        if (!config.isReturned) {
          await prisma.book.update({
            where: { id: bookId },
            data: { availableCopies: { decrement: 1 } },
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

export async function seedLibrary(
  prisma: PrismaClient,
  schoolId: string,
  students?: StudentRef[]
): Promise<number> {
  const bookIds = await seedBooks(prisma, schoolId)

  if (students && students.length > 0) {
    await seedBorrowRecords(prisma, schoolId, students)
  }

  return bookIds.length
}
