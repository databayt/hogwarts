// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timetable Reference Data
 *
 * Real-world subject hour allocations sourced from ministry-published schedules.
 * Used by setupCatalogForSchool() to assign accurate weeklyPeriods per subject.
 *
 * Sources:
 * - Saudi Arabia: MOE Developed Plan 1446 (wikigulf.com)
 * - Egypt: MOE 2025-2026 (shbabbek.com, almasryalyoum.com)
 * - UAE: MOE 2024-2025 (khaleejtimes.com, emaratalyoum.com)
 * - Kuwait: TIMSS 2023 Encyclopedia + MOE published schedules
 * - US: NCES data, state instructional time recommendations
 * - British/IGCSE: Cambridge International 130h/subject guideline
 * - IB MYP: 50h/subject-group/year minimum
 * - Sudan: existing system data + ministry guidelines
 */

// ============================================================================
// Types
// ============================================================================

interface SubjectHourEntry {
  /** Normalized subject slug for matching */
  slug: string
  /** Patterns to match against catalog subject names (lowercase) */
  patterns: string[]
  /** Weekly periods per grade. Key = grade number (1-12) */
  grades: Record<number, number>
}

interface CurriculumReference {
  country: string
  curriculum: string
  schoolTypes: string[]
  subjects: SubjectHourEntry[]
}

// ============================================================================
// Reference Data
// ============================================================================

const REFERENCES: CurriculumReference[] = [
  // --------------------------------------------------------------------------
  // SAUDI ARABIA — MOE 1446/2024-2025
  // --------------------------------------------------------------------------
  {
    country: "SA",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "quran",
        patterns: ["quran", "قرآن", "تلاوة", "تجويد", "حفظ"],
        grades: {
          1: 5,
          2: 5,
          3: 4,
          4: 3,
          5: 3,
          6: 3,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "islamic",
        patterns: [
          "islamic",
          "إسلامية",
          "دراسات إسلامية",
          "religion",
          "تربية إسلامية",
          "دين",
        ],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 3,
          5: 3,
          6: 3,
          7: 4,
          8: 4,
          9: 4,
          10: 5,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية", "لغة عربية"],
        grades: {
          1: 8,
          2: 7,
          3: 6,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات", "رياضيّات", "calculus", "تفاضل"],
        grades: {
          1: 4,
          2: 5,
          3: 6,
          4: 6,
          5: 6,
          6: 6,
          7: 6,
          8: 6,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: [
          "science",
          "علوم",
          "أحياء",
          "biology",
          "كيمياء",
          "chemistry",
          "فيزياء",
          "physics",
        ],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "english",
        patterns: ["english", "إنجليزي", "إنجليزية", "لغة إنجليزية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 4,
          8: 4,
          9: 4,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "social-studies",
        patterns: [
          "social",
          "اجتماعية",
          "دراسات اجتماعية",
          "تاريخ",
          "history",
          "جغرافيا",
          "geography",
        ],
        grades: { 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 2, 10: 5, 11: 3, 12: 3 },
      },
      {
        slug: "digital",
        patterns: [
          "digital",
          "رقمية",
          "مهارات رقمية",
          "حاسب",
          "computer",
          "تقنية",
        ],
        grades: { 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3 },
      },
      {
        slug: "art",
        patterns: ["art", "فن", "تربية فنية", "فنية"],
        grades: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical", "تربية بدنية", "رياضة", "دفاع"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 3,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "life-skills",
        patterns: ["life skill", "مهارات حياتية", "أسرية"],
        grades: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // EGYPT — MOE 2025-2026
  // --------------------------------------------------------------------------
  {
    country: "EG",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية", "لغة عربية"],
        grades: {
          1: 8,
          2: 8,
          3: 8,
          4: 8,
          5: 8,
          6: 8,
          7: 8,
          8: 7,
          9: 7,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات", "رياضيّات"],
        grades: {
          1: 6,
          2: 6,
          3: 6,
          4: 6,
          5: 6,
          6: 6,
          7: 6,
          8: 6,
          9: 6,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "english",
        patterns: [
          "english",
          "إنجليزي",
          "إنجليزية",
          "لغة إنجليزية",
          "foreign language",
          "لغة أجنبية",
        ],
        grades: {
          1: 4,
          2: 4,
          3: 4,
          4: 4,
          5: 4,
          6: 4,
          7: 5,
          8: 5,
          9: 6,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: [
          "science",
          "علوم",
          "أحياء",
          "biology",
          "كيمياء",
          "chemistry",
          "فيزياء",
          "physics",
          "علوم متكاملة",
        ],
        grades: { 4: 3, 5: 3, 6: 3, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5 },
      },
      {
        slug: "social-studies",
        patterns: [
          "social",
          "اجتماعية",
          "دراسات",
          "تاريخ",
          "history",
          "جغرافيا",
          "geography",
        ],
        grades: { 4: 3, 5: 3, 6: 3, 7: 4, 8: 4, 9: 4, 10: 5, 11: 4, 12: 4 },
      },
      {
        slug: "islamic",
        patterns: ["islamic", "إسلامية", "religion", "تربية دينية", "دين"],
        grades: {
          1: 3,
          2: 3,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical", "تربية بدنية", "رياضة"],
        grades: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 1 },
      },
      {
        slug: "it",
        patterns: [
          "it",
          "تكنولوجيا",
          "حاسب",
          "computer",
          "information technology",
          "معلومات",
        ],
        grades: { 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
      },
      {
        slug: "art",
        patterns: ["art", "فن", "تربية فنية", "فنية"],
        grades: { 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
      },
      {
        slug: "music",
        patterns: ["music", "موسيقى", "تربية موسيقية"],
        grades: { 4: 1, 5: 1, 6: 1 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // UAE — MOE 2024-2025
  // --------------------------------------------------------------------------
  {
    country: "AE",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية", "لغة عربية"],
        grades: {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات"],
        grades: {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 6,
          6: 6,
          7: 6,
          8: 6,
          9: 6,
          10: 6,
          11: 6,
          12: 6,
        },
      },
      {
        slug: "english",
        patterns: ["english", "إنجليزي", "إنجليزية"],
        grades: {
          1: 4,
          2: 4,
          3: 4,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "science",
        patterns: [
          "science",
          "علوم",
          "أحياء",
          "biology",
          "كيمياء",
          "chemistry",
          "فيزياء",
          "physics",
        ],
        grades: {
          1: 2,
          2: 2,
          3: 3,
          4: 3,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "islamic",
        patterns: ["islamic", "إسلامية", "religion", "تربية إسلامية", "دين"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 3,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 3,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "social-studies",
        patterns: ["social", "اجتماعية", "دراسات اجتماعية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 3,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical", "تربية بدنية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "art",
        patterns: ["art", "فن", "تربية فنية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "moral-education",
        patterns: ["moral", "أخلاقية", "تربية أخلاقية"],
        grades: {
          1: 1,
          2: 1,
          3: 1,
          4: 1,
          5: 1,
          6: 1,
          7: 1,
          8: 1,
          9: 1,
          10: 1,
          11: 1,
          12: 1,
        },
      },
      {
        slug: "digital",
        patterns: [
          "digital",
          "رقمية",
          "حاسب",
          "computer",
          "تقنية",
          "technology",
        ],
        grades: { 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // KUWAIT — MOE published schedules
  // --------------------------------------------------------------------------
  {
    country: "KW",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية", "لغة عربية"],
        grades: {
          1: 8,
          2: 8,
          3: 7,
          4: 6,
          5: 6,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات"],
        grades: {
          1: 5,
          2: 5,
          3: 6,
          4: 6,
          5: 6,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: [
          "science",
          "علوم",
          "أحياء",
          "biology",
          "كيمياء",
          "chemistry",
          "فيزياء",
          "physics",
        ],
        grades: {
          1: 2,
          2: 2,
          3: 3,
          4: 3,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "english",
        patterns: ["english", "إنجليزي", "إنجليزية"],
        grades: {
          1: 2,
          2: 2,
          3: 3,
          4: 3,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "islamic",
        patterns: [
          "islamic",
          "إسلامية",
          "religion",
          "تربية إسلامية",
          "قرآن",
          "quran",
          "دين",
        ],
        grades: {
          1: 4,
          2: 4,
          3: 4,
          4: 3,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "social-studies",
        patterns: ["social", "اجتماعية", "دراسات اجتماعية", "تاريخ", "جغرافيا"],
        grades: { 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical", "تربية بدنية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "art",
        patterns: ["art", "فن", "تربية فنية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 1,
          7: 1,
          8: 1,
          9: 1,
          10: 1,
          11: 1,
          12: 1,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // SUDAN — existing system data + ministry guidelines (6+3+3 ladder)
  // --------------------------------------------------------------------------
  {
    country: "SD",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "arabic",
        patterns: [
          "arabic",
          "عربي",
          "عربية",
          "لغة عربية",
          "نحو",
          "بلاغة",
          "أدب",
          "مطالعة",
        ],
        grades: {
          1: 7,
          2: 7,
          3: 6,
          4: 6,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات", "رياضيّات", "رياضيات أساسية"],
        grades: {
          1: 6,
          2: 6,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "english",
        patterns: ["english", "إنجليزي", "إنجليزية"],
        grades: {
          1: 3,
          2: 3,
          3: 4,
          4: 4,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "islamic",
        patterns: [
          "islamic",
          "إسلامية",
          "religion",
          "تربية إسلامية",
          "قرآن",
          "quran",
          "دين",
        ],
        grades: {
          1: 4,
          2: 4,
          3: 3,
          4: 3,
          5: 3,
          6: 3,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "science",
        patterns: [
          "science",
          "علوم",
          "أحياء",
          "biology",
          "كيمياء",
          "chemistry",
          "فيزياء",
          "physics",
        ],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "social-studies",
        patterns: [
          "social",
          "اجتماعية",
          "دراسات",
          "تاريخ",
          "history",
          "جغرافيا",
          "geography",
        ],
        grades: { 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical", "تربية بدنية", "رياضة"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "art",
        patterns: ["art", "فن", "تربية فنية"],
        grades: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1 },
      },
      {
        slug: "digital",
        patterns: ["digital", "حاسب", "computer", "حاسوب", "تقنية"],
        grades: { 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // JORDAN — similar to national Arab curricula
  // --------------------------------------------------------------------------
  {
    country: "JO",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية"],
        grades: {
          1: 8,
          2: 7,
          3: 6,
          4: 6,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات"],
        grades: {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "english",
        patterns: ["english", "إنجليزي", "إنجليزية"],
        grades: {
          1: 3,
          2: 3,
          3: 4,
          4: 4,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "islamic",
        patterns: ["islamic", "إسلامية", "religion", "تربية إسلامية", "دين"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 3,
          5: 3,
          6: 3,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "science",
        patterns: ["science", "علوم"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "social-studies",
        patterns: ["social", "اجتماعية", "تاريخ", "جغرافيا"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 2,
          5: 2,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 3,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical", "تربية بدنية"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "digital",
        patterns: ["digital", "حاسب", "computer", "حاسوب"],
        grades: { 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // QATAR — similar to Gulf national curricula
  // --------------------------------------------------------------------------
  {
    country: "QA",
    curriculum: "national",
    schoolTypes: ["public", "private", "national"],
    subjects: [
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية"],
        grades: {
          1: 6,
          2: 6,
          3: 6,
          4: 5,
          5: 5,
          6: 5,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "math",
        patterns: ["math", "رياضيات"],
        grades: {
          1: 5,
          2: 5,
          3: 6,
          4: 6,
          5: 6,
          6: 6,
          7: 6,
          8: 6,
          9: 6,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "english",
        patterns: ["english", "إنجليزي"],
        grades: {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: ["science", "علوم", "أحياء", "كيمياء", "فيزياء"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "islamic",
        patterns: ["islamic", "إسلامية", "religion", "قرآن", "دين"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 3,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "social-studies",
        patterns: ["social", "اجتماعية"],
        grades: { 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 },
      },
      {
        slug: "pe",
        patterns: ["pe", "بدني", "physical"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // US K-12 — NCES national averages
  // --------------------------------------------------------------------------
  {
    country: "US",
    curriculum: "us-k12",
    schoolTypes: ["public", "private"],
    subjects: [
      {
        slug: "ela",
        patterns: [
          "english",
          "ela",
          "reading",
          "language arts",
          "literature",
          "writing",
        ],
        grades: {
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "math",
        patterns: ["math", "algebra", "geometry", "calculus", "statistics"],
        grades: {
          1: 7,
          2: 7,
          3: 7,
          4: 7,
          5: 7,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: [
          "science",
          "biology",
          "chemistry",
          "physics",
          "earth science",
        ],
        grades: {
          1: 3,
          2: 3,
          3: 4,
          4: 4,
          5: 4,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "social-studies",
        patterns: [
          "social studies",
          "history",
          "geography",
          "civics",
          "government",
          "economics",
        ],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 3,
          5: 3,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "pe",
        patterns: ["pe", "physical education", "health"],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 3,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 3,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "art",
        patterns: ["art", "music", "drama", "visual arts", "performing arts"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "digital",
        patterns: ["digital", "computer", "technology", "coding"],
        grades: { 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // BRITISH / IGCSE — Cambridge International guidelines
  // --------------------------------------------------------------------------
  {
    country: "GB",
    curriculum: "british",
    schoolTypes: ["private", "international", "british"],
    subjects: [
      {
        slug: "english",
        patterns: ["english", "ela", "literature", "language"],
        grades: {
          1: 6,
          2: 6,
          3: 6,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "math",
        patterns: ["math", "maths", "mathematics"],
        grades: {
          1: 6,
          2: 6,
          3: 6,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: ["science", "biology", "chemistry", "physics"],
        grades: {
          1: 3,
          2: 3,
          3: 4,
          4: 4,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "arabic",
        patterns: ["arabic", "عربي", "عربية"],
        grades: {
          1: 4,
          2: 4,
          3: 4,
          4: 4,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 3,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "islamic",
        patterns: ["islamic", "إسلامية", "religion"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "humanities",
        patterns: ["humanities", "history", "geography", "social"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 3,
          5: 3,
          6: 3,
          7: 3,
          8: 3,
          9: 3,
          10: 3,
          11: 3,
          12: 3,
        },
      },
      {
        slug: "languages",
        patterns: ["french", "spanish", "german", "language acquisition"],
        grades: { 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 },
      },
      {
        slug: "pe",
        patterns: ["pe", "physical", "sport"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "art",
        patterns: ["art", "music", "drama"],
        grades: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
      },
      {
        slug: "digital",
        patterns: ["ict", "computer", "digital", "design technology"],
        grades: {
          1: 1,
          2: 1,
          3: 1,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // IB MYP/DP — International Baccalaureate
  // --------------------------------------------------------------------------
  {
    country: "*",
    curriculum: "ib",
    schoolTypes: ["international", "ib"],
    subjects: [
      {
        slug: "language-literature",
        patterns: [
          "english",
          "language and literature",
          "literature",
          "language a",
        ],
        grades: {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "language-acquisition",
        patterns: [
          "arabic",
          "french",
          "spanish",
          "language b",
          "language acquisition",
        ],
        grades: {
          1: 4,
          2: 4,
          3: 4,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "math",
        patterns: ["math", "mathematics"],
        grades: {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
          12: 5,
        },
      },
      {
        slug: "science",
        patterns: ["science", "biology", "chemistry", "physics"],
        grades: {
          1: 4,
          2: 4,
          3: 4,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "individuals-societies",
        patterns: [
          "individuals",
          "societies",
          "history",
          "geography",
          "economics",
          "social",
        ],
        grades: {
          1: 3,
          2: 3,
          3: 3,
          4: 4,
          5: 4,
          6: 4,
          7: 4,
          8: 4,
          9: 4,
          10: 4,
          11: 4,
          12: 4,
        },
      },
      {
        slug: "arts",
        patterns: ["art", "music", "drama", "visual arts", "performing arts"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "pe",
        patterns: ["pe", "physical", "health"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
      {
        slug: "design",
        patterns: ["design", "technology", "computer"],
        grades: {
          1: 2,
          2: 2,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 2,
          9: 2,
          10: 2,
          11: 2,
          12: 2,
        },
      },
    ],
  },
]

// ============================================================================
// Country-to-curriculum inference (mirrors catalog-setup.ts inferCurriculum)
// ============================================================================

const COUNTRY_CURRICULUM: Record<string, string> = {
  US: "us-k12",
  GB: "british",
  SD: "national",
  SA: "national",
  EG: "national",
  AE: "national",
  QA: "national",
  KW: "national",
  JO: "national",
}

// ============================================================================
// Matching Logic
// ============================================================================

/**
 * Find the best matching reference for a school's context.
 * Priority: exact country+curriculum > wildcard country > null (fallback)
 */
function findReference(
  country: string,
  curriculum?: string,
  schoolType?: string
): CurriculumReference | null {
  const effectiveCurriculum =
    curriculum || COUNTRY_CURRICULUM[country] || "us-k12"

  // Score each reference
  let bestRef: CurriculumReference | null = null
  let bestScore = 0

  for (const ref of REFERENCES) {
    let score = 0

    // Country match
    if (ref.country === country) score += 40
    else if (ref.country === "*") score += 5
    else continue // skip non-matching countries

    // Curriculum match
    if (ref.curriculum === effectiveCurriculum) score += 30

    // School type match
    if (schoolType && ref.schoolTypes.includes(schoolType)) score += 20

    if (score > bestScore) {
      bestScore = score
      bestRef = ref
    }
  }

  return bestRef
}

/**
 * Match a subject name against reference patterns.
 * Returns the weekly periods for the given grade, or null if no match.
 */
function matchSubject(
  ref: CurriculumReference,
  subjectName: string,
  gradeNumber: number
): number | null {
  const lower = subjectName.toLowerCase()

  for (const entry of ref.subjects) {
    const matched = entry.patterns.some((pattern) => lower.includes(pattern))
    if (matched && gradeNumber in entry.grades) {
      return entry.grades[gradeNumber]
    }
  }

  return null
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get reference-based weekly periods for a subject in a specific school context.
 * Falls back to the legacy hardcoded values if no reference match is found.
 *
 * @param subjectName - The catalog subject name (e.g. "Mathematics", "رياضيات")
 * @param gradeNumber - Grade level (1-12)
 * @param context - School context for matching
 * @returns Weekly periods (integer)
 */
export function getReferenceWeeklyPeriods(
  subjectName: string,
  gradeNumber: number,
  context: {
    country?: string
    curriculum?: string
    schoolType?: string
  }
): number {
  const { country, curriculum, schoolType } = context

  // Try reference data first
  if (country) {
    const ref = findReference(country, curriculum, schoolType)
    if (ref) {
      const periods = matchSubject(ref, subjectName, gradeNumber)
      if (periods !== null) return periods
    }
  }

  // Fallback: legacy hardcoded values
  return legacyGetDefaultWeeklyPeriods(subjectName, gradeNumber)
}

/**
 * Original hardcoded weekly periods — kept as fallback for unknown countries.
 */
function legacyGetDefaultWeeklyPeriods(
  name: string,
  gradeNumber: number
): number {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("math") || lowerName.includes("رياضيات"))
    return gradeNumber <= 6 ? 5 : 4
  if (lowerName.includes("arabic") || lowerName.includes("عربي")) return 5
  if (lowerName.includes("english") || lowerName.includes("إنجليزي"))
    return gradeNumber <= 6 ? 4 : 5
  if (
    lowerName.includes("إسلامية") ||
    lowerName.includes("islamic") ||
    lowerName.includes("religion")
  )
    return gradeNumber <= 6 ? 3 : 2
  if (lowerName.includes("science") || lowerName.includes("علوم"))
    return gradeNumber <= 6 ? 3 : 4
  if (
    lowerName.includes("pe") ||
    lowerName.includes("بدني") ||
    lowerName.includes("art") ||
    lowerName.includes("فن") ||
    lowerName.includes("music") ||
    lowerName.includes("موسيقى")
  )
    return 2
  return 3
}
