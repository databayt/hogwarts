/**
 * Arabic to English Name Transliteration
 *
 * Uses a mapping table for known Sudanese names with fallback
 * to basic Arabic-to-Latin transliteration.
 *
 * @see prisma/seeds/constants.ts for source name arrays
 */

import type { Locale } from "@/components/internationalization/config"

// Pre-built lookup map for O(1) performance
// Source: prisma/seeds/constants.ts (MALE_NAMES, FEMALE_NAMES, SURNAMES)
const ARABIC_TO_ENGLISH: Map<string, string> = new Map([
  // Male given names (40)
  ["محمد", "Mohammed"],
  ["أحمد", "Ahmed"],
  ["عثمان", "Othman"],
  ["إبراهيم", "Ibrahim"],
  ["خالد", "Khalid"],
  ["عمر", "Omar"],
  ["حسن", "Hassan"],
  ["يوسف", "Youssef"],
  ["علي", "Ali"],
  ["عبدالله", "Abdullah"],
  ["طارق", "Tarek"],
  ["مصطفى", "Mustafa"],
  ["ياسر", "Yasser"],
  ["عبدالرحمن", "Abdelrahman"],
  ["صلاح", "Salah"],
  ["بكري", "Bakri"],
  ["الفاتح", "Elfatih"],
  ["معاوية", "Muawiya"],
  ["أنس", "Anas"],
  ["زياد", "Ziad"],
  ["حمزة", "Hamza"],
  ["بلال", "Bilal"],
  ["سليمان", "Suleiman"],
  ["موسى", "Musa"],
  ["عبدالعزيز", "Abdelaziz"],
  ["فيصل", "Faisal"],
  ["نادر", "Nader"],
  ["سامر", "Samer"],
  ["رامي", "Rami"],
  ["هاني", "Hani"],
  ["وليد", "Walid"],
  ["ماهر", "Maher"],
  ["عامر", "Amer"],
  ["سيف", "Saif"],
  ["هشام", "Hisham"],
  ["كريم", "Karim"],
  ["منصور", "Mansour"],
  ["شريف", "Sherif"],
  ["أسامة", "Osama"],
  ["جمال", "Jamal"],

  // Female given names (40)
  ["فاطمة", "Fatima"],
  ["عائشة", "Aisha"],
  ["مريم", "Mariam"],
  ["أمينة", "Amina"],
  ["خديجة", "Khadija"],
  ["زينب", "Zainab"],
  ["هدى", "Huda"],
  ["سارة", "Sara"],
  ["نور", "Nour"],
  ["ليلى", "Laila"],
  ["رقية", "Ruqaya"],
  ["حليمة", "Halima"],
  ["سمية", "Sumaya"],
  ["ريم", "Reem"],
  ["دعاء", "Duaa"],
  ["إيمان", "Iman"],
  ["أسماء", "Asma"],
  ["هبة", "Hiba"],
  ["رنا", "Rana"],
  ["منى", "Mona"],
  ["سلمى", "Salma"],
  ["ياسمين", "Yasmin"],
  ["لمياء", "Lamia"],
  ["شيماء", "Shaimaa"],
  ["آية", "Aya"],
  ["مروة", "Marwa"],
  ["نادية", "Nadia"],
  ["سهام", "Siham"],
  ["وفاء", "Wafaa"],
  ["صفاء", "Safaa"],
  ["رحاب", "Rehab"],
  ["إنتصار", "Intisar"],
  ["أميرة", "Amira"],
  ["نهى", "Nuha"],
  ["هالة", "Hala"],
  ["رشا", "Rasha"],
  ["لينا", "Lina"],
  ["جميلة", "Jamila"],
  ["كوثر", "Kawthar"],
  ["سعاد", "Suaad"],

  // Surnames (30)
  // Note: Some overlap with given names (Hassan, Ali, etc.)
  ["الحسن", "Elhasan"],
  ["النور", "Elnour"],
  ["آدم", "Adam"],
  ["عيسى", "Issa"],
  ["خليل", "Khalil"],
  ["صالح", "Salih"],
  ["عبدالقادر", "Abdelgadir"],
  ["الطيب", "Eltayeb"],
  ["بشير", "Bashir"],
  ["جعفر", "Jaafar"],
  ["المهدي", "Elmahdi"],
  ["الزين", "Elzein"],
  ["البشير", "Elbashir"],
  ["الأمين", "Elamin"],
  ["حامد", "Hamid"],
  ["كمال", "Kamal"],
  ["جلال", "Jalal"],
  ["نصر", "Nasr"],
])

// Basic Arabic-to-Latin transliteration for unknown names
const ARABIC_LETTER_MAP: Record<string, string> = {
  // Consonants
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "aa",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "a",
  ء: "'",
  // Diacritics (optional - usually not stored)
  "\u064E": "a", // fatha
  "\u064F": "u", // damma
  "\u0650": "i", // kasra
  "\u0651": "", // shadda
}

/**
 * Transliterate a single Arabic name to English
 * Uses lookup table for known names, falls back to letter-by-letter
 */
function transliterateSingle(arabicName: string): string {
  const trimmed = arabicName.trim()
  if (!trimmed) return ""

  // Check lookup table first (O(1))
  const mapped = ARABIC_TO_ENGLISH.get(trimmed)
  if (mapped) return mapped

  // Fallback: basic letter-by-letter transliteration
  let result = ""
  for (const char of trimmed) {
    result += ARABIC_LETTER_MAP[char] ?? char
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1)
}

/**
 * Get display name based on locale
 *
 * @param givenName - Arabic given name
 * @param surname - Arabic surname
 * @param lang - Current locale
 * @returns Formatted full name in appropriate script
 *
 * @example
 * getDisplayName("محمد", "علي", "en") // "Mohammed Ali"
 * getDisplayName("محمد", "علي", "ar") // "محمد علي"
 */
export function getDisplayName(
  givenName: string | null | undefined,
  surname: string | null | undefined,
  lang: Locale
): string {
  const parts = [givenName, surname].filter(Boolean) as string[]

  if (parts.length === 0) return ""

  if (lang === "ar") {
    return parts.join(" ")
  }

  // English: transliterate each part
  return parts.map(transliterateSingle).join(" ")
}

/**
 * Transliterate a pre-composed full name
 * Useful when you already have the combined name string
 *
 * @example
 * transliterateName("محمد علي", "en") // "Mohammed Ali"
 * transliterateName("محمد علي", "ar") // "محمد علي"
 */
export function transliterateName(fullName: string, lang: Locale): string {
  if (!fullName) return ""
  if (lang === "ar") return fullName

  // Split and transliterate each part
  return fullName.split(/\s+/).map(transliterateSingle).join(" ")
}
