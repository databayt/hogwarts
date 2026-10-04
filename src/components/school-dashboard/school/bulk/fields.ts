// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What each people import understands — one definition drives the column
 * mapper, the wrong-file check, the templates and the server's row reader.
 * Client-safe: no server imports.
 */

export type ImportType = "students" | "teachers" | "staff" | "guardians"

export const IMPORT_TYPES: ImportType[] = [
  "students",
  "teachers",
  "staff",
  "guardians",
]

export interface FieldDef {
  key: string
  /** Header spellings that map here, compared after `normalizeHeader`. */
  aliases: string[]
  required?: boolean
}

/** Column index per field key; null = not in the file. */
export type ColumnMapping = Record<string, number | null>

const NAME = [
  "name",
  "full name",
  "fullname",
  "الاسم",
  "الاسم الكامل",
  "الاسم بالكامل",
]
const FIRST = [
  "first name",
  "firstname",
  "given name",
  "الاسم الأول",
  "الاسم الاول",
]
const LAST = [
  "last name",
  "lastname",
  "family name",
  "surname",
  "اسم العائلة",
  "العائلة",
  "اللقب",
]
const EMAIL = [
  "email",
  "email address",
  "e-mail",
  "mail",
  "البريد",
  "البريد الإلكتروني",
  "البريد الالكتروني",
  "الإيميل",
  "الايميل",
]
const PHONE = [
  "phone",
  "phone number",
  "mobile",
  "mobile number",
  "cell",
  "telephone",
  "contact",
  "الهاتف",
  "رقم الهاتف",
  "الجوال",
  "رقم الجوال",
  "الموبايل",
  "التلفون",
]
const EMPLOYEE_ID = [
  "employee id",
  "employee number",
  "employee no",
  "emp id",
  "emp no",
  "staff id",
  "id",
  "رقم الموظف",
  "الرقم الوظيفي",
]
const DEPARTMENT = ["department", "dept", "department name", "القسم"]
const GENDER = ["gender", "sex", "الجنس", "النوع"]

export const FIELDS: Record<ImportType, FieldDef[]> = {
  students: [
    {
      key: "name",
      aliases: [
        ...NAME,
        "student name",
        "student",
        "اسم الطالب",
        "اسم الطالبة",
      ],
      required: true,
    },
    { key: "firstName", aliases: FIRST },
    { key: "lastName", aliases: LAST },
    { key: "middleName", aliases: ["middle name", "middle", "الاسم الأوسط"] },
    {
      key: "studentId",
      aliases: [
        "student id",
        "student number",
        "student no",
        "student code",
        "sid",
        "admission number",
        "admission no",
        "id",
        "no",
        "رقم الطالب",
        "رقم القيد",
        "الرقم",
      ],
    },
    {
      key: "yearLevel",
      aliases: [
        "grade",
        "grade level",
        "year",
        "year level",
        "level",
        "class",
        "الصف",
        "المرحلة",
        "المستوى",
      ],
    },
    {
      key: "section",
      aliases: [
        "section",
        "class section",
        "homeroom",
        "division",
        "الشعبة",
        "الفصل",
      ],
    },
    { key: "gender", aliases: GENDER },
    {
      key: "dateOfBirth",
      aliases: [
        "date of birth",
        "dob",
        "birth date",
        "birthdate",
        "birthday",
        "born",
        "تاريخ الميلاد",
      ],
    },
    { key: "email", aliases: [...EMAIL, "student email", "بريد الطالب"] },
    { key: "phone", aliases: [...PHONE, "student phone", "هاتف الطالب"] },
    {
      key: "guardianName",
      aliases: [
        "guardian",
        "guardian name",
        "parent",
        "parent name",
        "ولي الأمر",
        "اسم ولي الأمر",
        "ولي الامر",
        "اسم ولي الامر",
      ],
    },
    {
      key: "guardianRelation",
      aliases: [
        "relation",
        "relationship",
        "guardian relation",
        "صلة القرابة",
        "القرابة",
        "صلة ولي الأمر",
      ],
    },
    {
      key: "guardianPhone",
      aliases: [
        "guardian phone",
        "parent phone",
        "parent mobile",
        "هاتف ولي الأمر",
        "جوال ولي الأمر",
        "رقم ولي الأمر",
      ],
    },
    {
      key: "guardianEmail",
      aliases: ["guardian email", "parent email", "بريد ولي الأمر"],
    },
    {
      key: "fatherName",
      aliases: [
        "father",
        "father name",
        "father's name",
        "الأب",
        "اسم الأب",
        "اسم الاب",
      ],
    },
    {
      key: "fatherPhone",
      aliases: [
        "father phone",
        "father mobile",
        "هاتف الأب",
        "جوال الأب",
        "رقم الأب",
      ],
    },
    { key: "fatherEmail", aliases: ["father email", "بريد الأب"] },
    {
      key: "motherName",
      aliases: [
        "mother",
        "mother name",
        "mother's name",
        "الأم",
        "اسم الأم",
        "اسم الام",
      ],
    },
    {
      key: "motherPhone",
      aliases: [
        "mother phone",
        "mother mobile",
        "هاتف الأم",
        "جوال الأم",
        "رقم الأم",
      ],
    },
    { key: "motherEmail", aliases: ["mother email", "بريد الأم"] },
  ],
  teachers: [
    {
      key: "name",
      aliases: [
        ...NAME,
        "teacher name",
        "teacher",
        "اسم المعلم",
        "اسم المعلمة",
      ],
      required: true,
    },
    { key: "firstName", aliases: FIRST },
    { key: "lastName", aliases: LAST },
    { key: "employeeId", aliases: [...EMPLOYEE_ID, "teacher id"] },
    { key: "email", aliases: [...EMAIL, "teacher email"] },
    { key: "phone", aliases: PHONE },
    { key: "gender", aliases: GENDER },
    { key: "department", aliases: [...DEPARTMENT, "subject area"] },
    {
      key: "subjects",
      aliases: [
        "subjects",
        "subject",
        "courses",
        "teaching subjects",
        "المواد",
        "المادة",
        "التخصص",
      ],
    },
    {
      key: "qualification",
      aliases: [
        "qualification",
        "degree",
        "education",
        "highest degree",
        "المؤهل",
        "المؤهل العلمي",
      ],
    },
  ],
  staff: [
    {
      key: "name",
      aliases: [...NAME, "staff name", "employee name", "اسم الموظف"],
      required: true,
    },
    { key: "firstName", aliases: FIRST },
    { key: "lastName", aliases: LAST },
    { key: "employeeId", aliases: EMPLOYEE_ID },
    { key: "email", aliases: EMAIL },
    { key: "phone", aliases: PHONE },
    { key: "gender", aliases: GENDER },
    {
      key: "position",
      aliases: [
        "position",
        "role",
        "job",
        "job title",
        "title",
        "الوظيفة",
        "المسمى الوظيفي",
        "المنصب",
      ],
    },
    { key: "department", aliases: DEPARTMENT },
    {
      key: "employmentType",
      aliases: [
        "employment type",
        "type",
        "work type",
        "نوع التوظيف",
        "نوع العقد",
      ],
    },
  ],
  guardians: [
    {
      key: "name",
      aliases: [...NAME, "guardian name", "parent name", "اسم ولي الأمر"],
      required: true,
    },
    { key: "firstName", aliases: FIRST },
    { key: "lastName", aliases: LAST },
    { key: "email", aliases: EMAIL },
    { key: "phone", aliases: PHONE },
    {
      key: "relation",
      aliases: [
        "relation",
        "relationship",
        "guardian type",
        "type",
        "صلة القرابة",
        "القرابة",
      ],
    },
    {
      key: "studentId",
      aliases: [
        "student id",
        "student number",
        "student no",
        "linked student",
        "student",
        "رقم الطالب",
        "رقم القيد",
      ],
    },
  ],
}

/**
 * `name` is required, but a file that splits the name into first/last
 * columns satisfies it — the server joins them.
 */
export function missingRequired(
  type: ImportType,
  mapping: ColumnMapping
): string[] {
  return FIELDS[type]
    .filter((f) => f.required)
    .filter((f) => {
      if (mapping[f.key] != null) return false
      if (f.key === "name" && mapping.firstName != null) return false
      return true
    })
    .map((f) => f.key)
}

export function normalizeHeader(header: string): string {
  return header
    .replace(/^﻿/, "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // Arabic diacritics + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة$/g, "ه")
    .replace(/[\s_\-.:*]+/g, " ")
    .trim()
}

/** Guess which column feeds each field. Exact key first, then aliases; a
 *  column is only ever claimed once. */
export function suggestMapping(
  type: ImportType,
  headers: string[]
): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const claimed = new Set<number>()
  const mapping: ColumnMapping = {}
  const fields = FIELDS[type]

  // Pass 1: exact keys and the most specific aliases (longest first) so
  // "guardian phone" wins over the generic "phone".
  const candidates: Array<{ key: string; alias: string }> = []
  for (const f of fields) {
    candidates.push({ key: f.key, alias: normalizeHeader(f.key) })
    for (const a of f.aliases)
      candidates.push({ key: f.key, alias: normalizeHeader(a) })
  }
  candidates.sort((a, b) => b.alias.length - a.alias.length)

  for (const { key, alias } of candidates) {
    if (mapping[key] != null) continue
    const idx = normalized.findIndex((h, i) => !claimed.has(i) && h === alias)
    if (idx !== -1) {
      mapping[key] = idx
      claimed.add(idx)
    }
  }

  for (const f of fields) if (!(f.key in mapping)) mapping[f.key] = null
  // A full-name column makes split first/last columns redundant.
  return mapping
}

/** How well a header row fits a type: share of headers it recognises,
 *  weighted by whether its required fields are present. */
function fitScore(type: ImportType, headers: string[]): number {
  const mapping = suggestMapping(type, headers)
  const matched = Object.values(mapping).filter((v) => v != null).length
  const specific = SIGNATURE[type].filter((k) => mapping[k] != null).length
  return matched + specific * 3 - missingRequired(type, mapping).length * 5
}

/** Fields that only make sense for one type — they decide close calls. */
const SIGNATURE: Record<ImportType, string[]> = {
  students: [
    "studentId",
    "yearLevel",
    "section",
    "dateOfBirth",
    "guardianName",
    "fatherName",
    "motherName",
  ],
  teachers: ["subjects", "qualification"],
  staff: ["position", "employmentType"],
  guardians: ["relation"],
}

/** The type this file most looks like, or null when it fits `current` best
 *  (or nothing fits clearly better). */
export function detectBetterType(
  current: ImportType,
  headers: string[]
): ImportType | null {
  const own = fitScore(current, headers)
  let best: ImportType | null = null
  let bestScore = own
  for (const t of IMPORT_TYPES) {
    if (t === current) continue
    const s = fitScore(t, headers)
    if (s > bestScore + 2) {
      best = t
      bestScore = s
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Templates — the headers of each type plus two example rows, Arabic first
// (the default school language), so a downloaded template is also a guide.
// ---------------------------------------------------------------------------

export const TEMPLATES: Record<ImportType, string> = {
  students: [
    "name,studentId,yearLevel,section,gender,dateOfBirth,phone,email,fatherName,fatherPhone,fatherEmail,motherName,motherPhone,motherEmail",
    "أحمد محمد علي,1001,الصف الخامس,أ,ذكر,2015-05-15,,,محمد علي أحمد,+249912345678,father@example.com,فاطمة حسن,+249912345679,",
    "سارة عمر,1002,Grade 3,B,female,2017-03-22,,,عمر خالد,+249923456789,,,,",
  ].join("\n"),
  teachers: [
    "name,employeeId,email,phone,gender,department,subjects,qualification",
    'خالد عبدالله,T001,khalid@example.com,+249911111111,ذكر,العلوم,"الرياضيات,الفيزياء",بكالوريوس',
    "منى يوسف,T002,,+249922222222,أنثى,اللغات,اللغة العربية,ماجستير",
  ].join("\n"),
  staff: [
    "name,employeeId,email,phone,gender,position,department,employmentType",
    "عمر حسن,S001,omar@example.com,+249933333333,ذكر,محاسب,المالية,FULL_TIME",
    "آمنة علي,S002,,+249944444444,أنثى,أمينة مكتبة,المكتبة,PART_TIME",
  ].join("\n"),
  guardians: [
    "name,phone,email,relation,studentId",
    "يوسف أحمد,+249955555555,yousif@example.com,الأب,1001",
    "ليلى حسن,+249966666666,,الأم,1002",
  ].join("\n"),
}
