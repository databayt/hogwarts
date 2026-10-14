// Name parsing and composition utilities for configurable name input variants.
// Schools can use "split" (first + last fields) or "full" (single field) name input.
// Prisma storage always uses firstName/middleName/lastName — only the UI changes.

export type NameFormat = "split" | "full"

// What the listings show under a person's name.
export type NameContact = "email" | "phone"
export type NameContactListing = "teacher" | "student" | "guardian" | "staff"

/** Today's line per listing — what a school sees until it picks one. */
export const NAME_CONTACT_DEFAULTS: Record<NameContactListing, NameContact> = {
  teacher: "email",
  student: "phone",
  guardian: "phone",
  staff: "email",
}

/**
 * How listings and profiles show a person: given name + second name (the
 * father's name — the Sudanese/Arabic convention) or given name + family name.
 * Applications, credentials, certificates and exports always show the full
 * name; this setting only shortens UI labels.
 */
export type NameDisplay = "first-second" | "first-last"
export const NAME_DISPLAY_DEFAULT: NameDisplay = "first-second"

export function isNameDisplay(v: unknown): v is NameDisplay {
  return v === "first-second" || v === "first-last"
}

/**
 * Words that are not a name on their own — they bind to the word AFTER them.
 *
 * "عبد" means servant, not somebody called Abd: the name is the whole
 * construction "عبد الرحمن". Same for the kunya and parentage prefixes, and
 * their Latin spellings. Written joined ("عبدالله") it is one word already.
 */
export const BOUND_PREFIX = new Set([
  "عبد",
  "أبو",
  "ابو",
  "إبو",
  "أبي",
  "ابي",
  "أم",
  "ام",
  "ابن",
  "بنت",
  "ذو",
  "abdul",
  "abdel",
  "abdal",
  "abd",
  "abdu",
  "abu",
  "abo",
  "umm",
  "um",
  "ibn",
  "bin",
  "bint",
  "al",
  "el",
])

/**
 * Words that bind to the word BEFORE them: "نور الدين", "فضل الله",
 * "حسب الرسول", "نور الهدى" are one name each, and they are everyday
 * Sudanese names, not edge cases.
 */
export const BOUND_SUFFIX = new Set([
  "الدين",
  "الله",
  "الهدى",
  "الرسول",
  "النبي",
  "الرحمن",
  "الرحيم",
  "الكريم",
  "الجليل",
  "الحق",
  "eldin",
  "eddin",
  "uddin",
  "aldin",
  "allah",
  "ullah",
])

const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g

/** Bare comparison key: no tashkeel or tatweel, lowercased. */
const nameKey = (word: string) => word.replace(DIACRITICS, "").toLowerCase()

/** Collapse whitespace and drop tatweel so stored names compare equal. */
export function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Split a name into its NAMES, not its words.
 *
 * "عبد الرحمن أبو بكر نور الدين" → ["عبد الرحمن", "أبو بكر", "نور الدين"].
 * A bare first-word split would misname a real child on a real card.
 */
export function tokenizeName(value: string | null | undefined): string[] {
  const words = normalizeName(value).split(" ").filter(Boolean)
  const tokens: string[] = []
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const key = nameKey(word)
    if (BOUND_SUFFIX.has(key) && tokens.length > 0) {
      tokens[tokens.length - 1] = `${tokens[tokens.length - 1]} ${word}`
      continue
    }
    if (BOUND_PREFIX.has(key) && i + 1 < words.length) {
      tokens.push(`${word} ${words[i + 1]}`)
      i++
      continue
    }
    tokens.push(word)
  }
  return tokens
}

/**
 * Parse a full name string into first/middle/last parts.
 * First name → firstName, last name → lastName, everything between → middleName.
 * Compound names (عبد الله, أبو بكر, نور الدين) stay whole.
 */
export function parseFullName(fullName: string): {
  firstName: string
  middleName: string | undefined
  lastName: string
} {
  const parts = tokenizeName(fullName)
  if (parts.length === 0)
    return { firstName: "", middleName: undefined, lastName: "" }
  if (parts.length === 1)
    return { firstName: parts[0], middleName: undefined, lastName: "" }
  if (parts.length === 2)
    return { firstName: parts[0], middleName: undefined, lastName: parts[1] }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  }
}

export interface PersonNameParts {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
}

/**
 * The second name: the first name inside middleName, or — when middle is
 * empty and lastName holds several names (a full name typed into one box
 * before middle names were stored) — the first of those.
 */
export function secondName(person: PersonNameParts): string {
  const middle = tokenizeName(person.middleName)
  if (middle.length > 0) return middle[0]
  const last = tokenizeName(person.lastName)
  return last[0] ?? ""
}

/**
 * The name a UI label shows.
 *
 * - "full": every part, in order — applications, credentials, certificates.
 * - "first-second": given + father's name — "محمد أحمد".
 * - "first-last": given + family name — "محمد حسن".
 */
export function displayName(
  person: PersonNameParts | null | undefined,
  mode: NameDisplay | "full" = NAME_DISPLAY_DEFAULT
): string {
  if (!person) return ""
  const first = normalizeName(person.firstName)
  if (mode === "full")
    return composeFullName(first, person.middleName, person.lastName)
  const tail =
    mode === "first-second"
      ? secondName(person)
      : (() => {
          const last = tokenizeName(person.lastName)
          return last[last.length - 1] ?? ""
        })()
  return (
    [first, tail].filter(Boolean).join(" ") ||
    composeFullName(first, person.middleName, person.lastName)
  )
}

/**
 * The two names a listing shows, as first/last parts — so the translation
 * pipeline (getName/getNames compose → detect script → translate) works on
 * the short name unchanged. "full" keeps every part.
 */
export function shortNameParts(
  person: PersonNameParts,
  mode: NameDisplay | "full" = NAME_DISPLAY_DEFAULT
): { firstName: string; middleName?: string | null; lastName: string } {
  if (mode === "full")
    return {
      firstName: normalizeName(person.firstName),
      middleName: person.middleName ?? null,
      lastName: normalizeName(person.lastName),
    }
  const tail =
    mode === "first-second"
      ? secondName(person)
      : (tokenizeName(person.lastName).at(-1) ?? "")
  return { firstName: normalizeName(person.firstName), lastName: tail }
}

/** Two initials from an already-composed display name, compound-aware. */
export function initialsOf(name: string | null | undefined): string {
  const tokens = tokenizeName(name)
  const letter = (s: string | undefined) => Array.from(s ?? "")[0] ?? ""
  return (letter(tokens[0]) + letter(tokens[1])).toUpperCase()
}

/**
 * Initials from names, not words: "عبد الله حسن" → "عح", never "عا".
 * For a two-name display the second initial follows the display mode.
 */
export function nameInitials(
  person: PersonNameParts | null | undefined,
  mode: NameDisplay = NAME_DISPLAY_DEFAULT
): string {
  if (!person) return ""
  const first = tokenizeName(person.firstName)[0] ?? ""
  const tail =
    mode === "first-second"
      ? secondName(person)
      : (tokenizeName(person.lastName).at(-1) ?? "")
  const letter = (s: string) => Array.from(s)[0] ?? ""
  return (letter(first) + letter(tail)).toUpperCase()
}

/**
 * Detect gender from an Arabic (or transliterated) first name.
 * Returns "MALE", "FEMALE", or null if uncertain.
 *
 * Uses a lookup table of common Arabic names (Sudanese/Saudi/Gulf focus)
 * plus morphological heuristics for Arabic script names.
 */
export function detectGenderFromName(
  firstName: string | undefined | null
): "MALE" | "FEMALE" | null {
  if (!firstName) return null
  const name = firstName.trim().toLowerCase()
  if (!name) return null

  // Normalize Arabic: strip diacritics (tashkeel)
  const arabic = firstName
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, "")

  // --- Lookup tables ---
  const maleArabic = new Set([
    "محمد",
    "أحمد",
    "احمد",
    "عبدالله",
    "عبد الله",
    "عبدالرحمن",
    "عبد الرحمن",
    "عبدالعزيز",
    "عبد العزيز",
    "عبدالملك",
    "عبدالكريم",
    "عبدالرحيم",
    "عبدالحميد",
    "عبدالقادر",
    "عبدالباسط",
    "عبداللطيف",
    "عمر",
    "علي",
    "خالد",
    "إبراهيم",
    "ابراهيم",
    "يوسف",
    "حسن",
    "حسين",
    "عثمان",
    "صالح",
    "سعيد",
    "ياسر",
    "طارق",
    "فهد",
    "سلطان",
    "بدر",
    "نايف",
    "تركي",
    "فيصل",
    "سلمان",
    "ماجد",
    "سعد",
    "راشد",
    "حمد",
    "مشعل",
    "وليد",
    "ناصر",
    "بندر",
    "عادل",
    "كمال",
    "جمال",
    "مصطفى",
    "عمرو",
    "هاشم",
    "زياد",
    "أنس",
    "انس",
    "مالك",
    "حمزة",
    "سامي",
    "رامي",
    "هشام",
    "عصام",
    "بلال",
    "أيمن",
    "ايمن",
    "باسم",
    "وائل",
    "معاذ",
    "أسامة",
    "اسامة",
    "عمار",
    "معتصم",
    "معتز",
    "مأمون",
    "بكري",
    "صديق",
    "الطيب",
    "بابكر",
    "التاج",
    "مبارك",
    "آدم",
    "ادم",
    "موسى",
    "عيسى",
    "داود",
    "سليمان",
    "اسماعيل",
    "إسماعيل",
    "يحيى",
    "زكريا",
    "نوح",
    "هارون",
    "الزبير",
    "طلال",
    "منصور",
    "مشاري",
    "نواف",
    "متعب",
    "ثامر",
    "ريان",
    "غسان",
    "مروان",
    "رائد",
    "ثابت",
    "نبيل",
    "شريف",
    "حاتم",
    "قاسم",
    "رضوان",
    "عماد",
    "حاتم",
    "أمجد",
    "اشرف",
    "أشرف",
    "محمود",
    "مصعب",
    "جعفر",
  ])

  const femaleArabic = new Set([
    "فاطمة",
    "عائشة",
    "مريم",
    "نورة",
    "نوره",
    "سارة",
    "ساره",
    "هند",
    "ريم",
    "لمى",
    "دانا",
    "لينا",
    "نوال",
    "سمية",
    "سميه",
    "أمينة",
    "امينة",
    "أمينه",
    "خديجة",
    "خديجه",
    "زينب",
    "رقية",
    "رقيه",
    "آمنة",
    "امنة",
    "آمنه",
    "حليمة",
    "حليمه",
    "سلمى",
    "منى",
    "هدى",
    "ندى",
    "رنا",
    "ديما",
    "شيماء",
    "أسماء",
    "اسماء",
    "رهام",
    "نجلاء",
    "علياء",
    "سناء",
    "وفاء",
    "دعاء",
    "هناء",
    "صفاء",
    "رجاء",
    "بشرى",
    "ليلى",
    "سمر",
    "غادة",
    "غاده",
    "عبير",
    "نهى",
    "مها",
    "رشا",
    "نادية",
    "ناديه",
    "سامية",
    "ساميه",
    "عالية",
    "عاليه",
    "إيمان",
    "ايمان",
    "نجاة",
    "نجاه",
    "سعاد",
    "مرام",
    "جنى",
    "تالا",
    "لجين",
    "روان",
    "رزان",
    "حنين",
    "ياسمين",
    "نورين",
    "تسنيم",
    "سدين",
    "ملاك",
    "شهد",
    "لمياء",
    "رحاب",
    "انتصار",
    "اخلاص",
    "إخلاص",
    "محاسن",
    "آلاء",
    "الاء",
    "تهاني",
    "هاجر",
    "مروة",
    "مروه",
    "رغد",
    "لطيفة",
    "لطيفه",
    "نبيلة",
    "نبيله",
    "جميلة",
    "جميله",
  ])

  const maleEnglish = new Set([
    "mohammed",
    "muhammad",
    "mohamed",
    "ahmad",
    "ahmed",
    "omar",
    "ali",
    "khalid",
    "ibrahim",
    "youssef",
    "yousef",
    "yusuf",
    "hassan",
    "hussein",
    "osman",
    "othman",
    "saleh",
    "said",
    "saeed",
    "yasser",
    "yasir",
    "tariq",
    "tarek",
    "fahad",
    "fahd",
    "sultan",
    "badr",
    "nayef",
    "naif",
    "faisal",
    "salman",
    "majid",
    "majed",
    "saad",
    "rashid",
    "walid",
    "waleed",
    "nasser",
    "nasir",
    "adel",
    "kamal",
    "jamal",
    "mustafa",
    "amr",
    "ziad",
    "anas",
    "malik",
    "hamza",
    "sami",
    "rami",
    "hisham",
    "hesham",
    "bilal",
    "ayman",
    "basem",
    "basim",
    "wael",
    "osama",
    "ammar",
    "adam",
    "mousa",
    "musa",
    "issa",
    "dawoud",
    "dawood",
    "sulaiman",
    "ismail",
    "yahya",
    "noah",
    "talal",
    "mansour",
    "ghassan",
    "marwan",
    "imad",
    "emad",
    "mahmoud",
    "mahmud",
    "bakri",
    "mubarak",
  ])

  const femaleEnglish = new Set([
    "fatima",
    "fatimah",
    "aisha",
    "ayesha",
    "maryam",
    "mariam",
    "noura",
    "nora",
    "sarah",
    "sara",
    "hind",
    "reem",
    "lama",
    "dana",
    "lina",
    "nawal",
    "sumaya",
    "amina",
    "aminah",
    "khadija",
    "khadijah",
    "zainab",
    "ruqaya",
    "salma",
    "mona",
    "huda",
    "nada",
    "rana",
    "dima",
    "shimaa",
    "asma",
    "asmaa",
    "alia",
    "alya",
    "sanaa",
    "wafa",
    "duaa",
    "hanaa",
    "bushra",
    "layla",
    "leila",
    "samar",
    "ghada",
    "abeer",
    "nuha",
    "maha",
    "rasha",
    "nadia",
    "samia",
    "iman",
    "maram",
    "jana",
    "tala",
    "lujain",
    "rawan",
    "razan",
    "haneen",
    "yasmin",
    "jasmine",
    "noreen",
    "tasneem",
    "malak",
    "shahd",
    "hagar",
    "hajar",
    "marwa",
    "raghad",
    "latifa",
    "nabila",
    "jamila",
  ])

  // Check Arabic lookup
  if (maleArabic.has(arabic)) return "MALE"
  if (femaleArabic.has(arabic)) return "FEMALE"

  // Check English transliteration lookup
  if (maleEnglish.has(name)) return "MALE"
  if (femaleEnglish.has(name)) return "FEMALE"

  // Check compound "عبد" prefix — always male
  if (arabic.startsWith("عبد")) return "MALE"
  if (name.startsWith("abd")) return "MALE"

  // Arabic morphological heuristics (less certain, but useful)
  // Names ending in taa marbuta (ة) or its alef form (ه when preceded by a/i)
  // are predominantly female
  if (arabic.endsWith("ة") || arabic.endsWith("اء") || arabic.endsWith("ى")) {
    return "FEMALE"
  }

  return null
}

/** Compose a full name from parts, filtering out empty/null values. */
export function composeFullName(
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null
): string {
  return [firstName, middleName, lastName]
    .map((part) => normalizeName(part))
    .filter(Boolean)
    .join(" ")
}
