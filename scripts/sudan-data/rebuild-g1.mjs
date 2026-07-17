#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Rebuild curriculum/sd/g1 structure to the VERIFIED grade-1 Sudan curriculum.
//
// Why: g1's math/arabic/islamic chapter folders + structure.json were a leftover
// Grade-7 ("الصف الأول المتوسط") skeleton (rational numbers, binary system,
// similarity, tajweed, Nawawi hadith…) while the real 2020 primary textbooks
// (المرحلة الابتدائية / الصف الأول) teach: numbers 0-9, addition/subtraction
// within 9, numbers 10-99, measurement (math); 55 sequential lessons (arabic);
// Hello/Numbers/Colours/About Me/My School (english, SMILE Starter 1); and
// Quran surahs / hadith / faith / purification / manners / seerah (islamic).
//
// Source of truth: scripts/sudan-data/toc/sd-g1-*.json (parsed from the real
// PDFs) + per-subject overrides below (cross-checked against the textbook text).
//
// The seed (prisma/seeds/catalog/sd.ts) walks the FOLDER TREE for slugs/order
// and reads structure.json TITLES (matched to folders BY SLUG). So folder name
// === structure.json slug, and chapters/lessons need a numeric ordering prefix.
//
// Usage:
//   node scripts/sudan-data/rebuild-g1.mjs            # dry run (prints plan)
//   node scripts/sudan-data/rebuild-g1.mjs --apply    # write changes
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, "../..")
const TOC_DIR = path.join(REPO, "scripts/sudan-data/toc")
const G1 = path.join(REPO, "curriculum/sd/g1")
const APPLY = process.argv.includes("--apply")

const pad2 = (n) => String(n).padStart(2, "0")
const loadToc = (name) =>
  JSON.parse(fs.readFileSync(path.join(TOC_DIR, name), "utf-8"))

// ---------------------------------------------------------------------------
// Per-subject verified structure. Each entry: { dir, tocFile, build() }
// build() returns { chapters: [{ slug, title, titleEn, lessons:[{slug,title,titleEn}] }] }
// where slug is the CONCEPT slug (no numeric prefix — the writer adds it).
// ---------------------------------------------------------------------------

// Real Arabic number names for math Ch1 (TOC left 3-9 generic).
const NUMBER_NAMES = {
  "number-1": ["العدد واحد", "Number One"],
  "number-2": ["العدد اثنان", "Number Two"],
  "number-3": ["العدد ثلاثة", "Number Three"],
  "number-4": ["العدد أربعة", "Number Four"],
  "number-5": ["العدد خمسة", "Number Five"],
  "number-6": ["العدد ستة", "Number Six"],
  "number-7": ["العدد سبعة", "Number Seven"],
  "number-8": ["العدد ثمانية", "Number Eight"],
  "number-9": ["العدد تسعة", "Number Nine"],
  "number-0": ["العدد صفر", "Number Zero"],
}

const ORD_AR = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
]
const lessonAr = (n) => `الدرس ${ORD_AR[n] ?? n}`

function fromToc(tocFile, { lessonName } = {}) {
  const toc = loadToc(tocFile)
  return {
    subjectAr: toc.subjectNameAr,
    chapters: (toc.chapters || []).map((c) => ({
      slug: c.slug,
      title: c.nameAr,
      titleEn: c.name,
      lessons: (c.lessons || []).map((l) => {
        const [title, titleEn] = lessonName?.(l, c) ?? [l.nameAr, l.name]
        return { slug: l.slug, title, titleEn }
      }),
    })),
  }
}

const SUBJECTS = {
  // MATH — TOC is authoritative; polish Ch1 number names.
  math: () =>
    fromToc("sd-g1-math.json", {
      lessonName: (l) => NUMBER_NAMES[l.slug] ?? [l.nameAr, l.name],
    }),

  // ARABIC — TOC is book-faithful: one flat chapter, 55 numbered lessons.
  arabic: () => fromToc("sd-g1-arabic.json"),

  // ENGLISH — TOC chapter names are correct (Hello/Numbers/Colours/About Me/
  // My School) but under-parsed to 2 lessons; the SMILE Starter 1 book body has
  // 8 lessons per unit. Expand to 8.
  english: () => {
    const base = fromToc("sd-g1-english.json")
    base.chapters = base.chapters.map((c) => ({
      ...c,
      lessons: Array.from({ length: 8 }, (_, i) => ({
        slug: `lesson-${i + 1}`,
        title: lessonAr(i + 1),
        titleEn: `Lesson ${i + 1}`,
      })),
    }))
    return base
  },

  // ISLAMIC — TOC has correct chapters but NO lessons. Lessons below are
  // extracted from the real 2020 primary textbook (1slm.pdf) text.
  islamic: () => ({
    subjectAr: "التربية الإسلامية",
    chapters: [
      {
        slug: "quran-surahs",
        title: "سور من القرآن الكريم",
        titleEn: "Surahs from the Holy Quran",
        lessons: [
          ["al-fatiha", "سورة الفاتحة", "Surah Al-Fatiha"],
          ["an-nas", "سورة الناس", "Surah An-Nas"],
          ["al-ikhlas", "سورة الإخلاص", "Surah Al-Ikhlas"],
          ["al-falaq", "سورة الفلق", "Surah Al-Falaq"],
          ["al-asr", "سورة العصر", "Surah Al-Asr"],
          ["an-nasr", "سورة النصر", "Surah An-Nasr"],
          ["al-kawthar", "سورة الكوثر", "Surah Al-Kawthar"],
          ["al-fil", "سورة الفيل", "Surah Al-Fil"],
          ["al-humazah", "سورة الهمزة", "Surah Al-Humazah"],
          ["at-takathur", "سورة التكاثر", "Surah At-Takathur"],
          ["al-qariah", "سورة القارعة", "Surah Al-Qari'ah"],
          ["al-adiyat", "سورة العاديات", "Surah Al-'Adiyat"],
          ["al-balad", "سورة البلد", "Surah Al-Balad"],
          ["al-ala", "سورة الأعلى", "Surah Al-A'la"],
        ].map(([slug, title, titleEn]) => ({ slug, title, titleEn })),
      },
      {
        slug: "prophetic-hadith",
        title: "أحاديث من الحديث النبوي الشريف",
        titleEn: "Prophetic Hadith",
        lessons: Array.from({ length: 7 }, (_, i) => ({
          slug: `hadith-${i + 1}`,
          title: `الحديث ${ORD_AR[i + 1]}`,
          titleEn: `Hadith ${i + 1}`,
        })),
      },
      {
        slug: "islam-and-faith",
        title: "الإسلام والإيمان",
        titleEn: "Islam and Faith",
        lessons: [
          ["pillars-of-islam", "أركان الإسلام", "Pillars of Islam"],
          ["pillars-of-faith", "أركان الإيمان", "Pillars of Faith"],
        ].map(([slug, title, titleEn]) => ({ slug, title, titleEn })),
      },
      {
        slug: "purification-and-ablution",
        title: "الطهارة والوضوء",
        titleEn: "Purification and Ablution",
        lessons: [
          ["cleanliness", "النظافة والطهارة", "Cleanliness and Purity"],
          ["ablution", "الوضوء", "Ablution (Wudu)"],
          ["tayammum", "التيمم", "Dry Ablution (Tayammum)"],
        ].map(([slug, title, titleEn]) => ({ slug, title, titleEn })),
      },
      {
        slug: "manners-and-etiquette",
        title: "التهذيب والآداب",
        titleEn: "Manners and Etiquette",
        lessons: [
          [
            "cleanliness-from-faith",
            "النظافة من الإيمان",
            "Cleanliness is from Faith",
          ],
          ["respecting-elders", "احترام الكبير", "Respecting Elders"],
          [
            "helping-others",
            "التعاون ومساعدة الآخرين",
            "Cooperation and Helping Others",
          ],
          ["table-manners", "آداب الأكل", "Table Manners"],
        ].map(([slug, title, titleEn]) => ({ slug, title, titleEn })),
      },
      {
        slug: "prophets-biography",
        title: "السيرة النبوية الشريفة",
        titleEn: "The Prophet's Biography",
        lessons: [
          [
            "birth-of-the-prophet",
            "مولد النبي محمد ﷺ",
            "Birth of Prophet Muhammad ﷺ",
          ],
        ].map(([slug, title, titleEn]) => ({ slug, title, titleEn })),
      },
    ],
  }),
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

function rebuild(dir, data) {
  const subjectPath = path.join(G1, dir)
  const chaptersPath = path.join(subjectPath, "chapters")

  const structure = {
    subject: dir === "islamic" ? "islamic-education" : dir,
    subjectAr: data.subjectAr,
    grade: "g1",
    curriculum: "sd",
    chapters: data.chapters.map((c, ci) => {
      const chSlug = `${pad2(ci + 1)}-${c.slug}`
      return {
        slug: chSlug,
        title: c.title,
        titleEn: c.titleEn,
        lessons: c.lessons.map((l, li) => ({
          slug: `${pad2(li + 1)}-${l.slug}`,
          title: l.title,
          titleEn: l.titleEn,
        })),
      }
    }),
  }

  const nCh = structure.chapters.length
  const nL = structure.chapters.reduce((s, c) => s + c.lessons.length, 0)
  console.log(`\n■ ${dir}  →  ${nCh} chapters, ${nL} lessons`)
  for (const c of structure.chapters) {
    console.log(`   ${c.slug}  «${c.title}»  (${c.lessons.length} lessons)`)
  }

  if (!APPLY) return { nCh, nL }

  // Remove old chapter tree, recreate from verified structure.
  fs.rmSync(chaptersPath, { recursive: true, force: true })
  for (const c of structure.chapters) {
    for (const l of c.lessons) {
      fs.mkdirSync(path.join(chaptersPath, c.slug, "lessons", l.slug), {
        recursive: true,
      })
    }
  }
  fs.writeFileSync(
    path.join(subjectPath, "structure.json"),
    JSON.stringify(structure, null, 2) + "\n"
  )
  return { nCh, nL }
}

console.log(
  APPLY
    ? "APPLYING rebuild to curriculum/sd/g1"
    : "DRY RUN (pass --apply to write)"
)
let totCh = 0
let totL = 0
for (const [dir, build] of Object.entries(SUBJECTS)) {
  const { nCh, nL } = rebuild(dir, build())
  totCh += nCh
  totL += nL
}
console.log(
  `\n${APPLY ? "✅ wrote" : "would write"} ${totCh} chapters, ${totL} lessons across 4 subjects`
)
