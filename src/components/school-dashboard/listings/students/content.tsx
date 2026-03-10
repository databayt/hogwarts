// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type StudentRow } from "@/components/school-dashboard/listings/students/columns"
import { studentsSearchParams } from "@/components/school-dashboard/listings/students/list-params"
import { StudentsTable } from "@/components/school-dashboard/listings/students/table"
import { googleTranslateBatch } from "@/components/translation/google"

interface Props {
  searchParams: Promise<SearchParams>
  school?: any
  dictionary?: Dictionary["school"]
  lang: Locale
}

/**
 * Batch-translate unique texts with DB cache check first, then Google API for misses.
 * Returns a Map<sourceText, translatedText>.
 */
async function batchTranslate(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  schoolId: string
): Promise<Map<string, string>> {
  const unique = [...new Set(texts.filter((t) => t.trim() !== ""))]
  if (unique.length === 0) return new Map()

  // Check cache for all unique texts
  const cached = await db.translationCache.findMany({
    where: {
      schoolId,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      sourceText: { in: unique },
    },
    select: { sourceText: true, translatedText: true, id: true },
  })

  const result = new Map<string, string>()
  const cachedTexts = new Set<string>()
  for (const c of cached) {
    result.set(c.sourceText, c.translatedText)
    cachedTexts.add(c.sourceText)
  }

  // Update hit counts (fire-and-forget)
  if (cached.length > 0) {
    db.translationCache
      .updateMany({
        where: { id: { in: cached.map((c) => c.id) } },
        data: { hitCount: { increment: 1 }, lastAccessedAt: new Date() },
      })
      .catch(() => {})
  }

  // Translate cache misses via batch API
  const misses = unique.filter((t) => !cachedTexts.has(t))
  if (misses.length > 0) {
    try {
      // Google Translate batch API: up to 128 texts per call
      const BATCH_SIZE = 128
      for (let i = 0; i < misses.length; i += BATCH_SIZE) {
        const chunk = misses.slice(i, i + BATCH_SIZE)
        const translated = await googleTranslateBatch(
          chunk,
          sourceLang,
          targetLang
        )
        for (let j = 0; j < chunk.length; j++) {
          result.set(chunk[j], translated[j] || chunk[j])
        }

        // Cache new translations (fire-and-forget)
        Promise.allSettled(
          chunk.map((text, j) =>
            db.translationCache
              .create({
                data: {
                  schoolId,
                  sourceText: text,
                  sourceLanguage: sourceLang,
                  targetLanguage: targetLang,
                  translatedText: translated[j] || "",
                  provider: "google",
                },
              })
              .catch(() => {})
          )
        )
      }
    } catch (error) {
      // On API failure, return originals for misses
      console.error("[batchTranslate] API error, using originals:", error)
      for (const text of misses) {
        if (!result.has(text)) result.set(text, text)
      }
    }
  }

  return result
}

export default async function StudentsContent({
  searchParams,
  school,
  dictionary,
  lang,
}: Props) {
  const sp = await studentsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()

  const effectiveSchoolId = school?.id || schoolId

  let data: StudentRow[] = []
  let total = 0
  const studentModel = getModel("student")
  if (effectiveSchoolId && studentModel) {
    const where: any = {
      schoolId: effectiveSchoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
              { studentId: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { status: "ACTIVE" }
          : sp.status === "inactive"
            ? { status: "INACTIVE" }
            : {}
        : {}),
    }
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]
    const [rows, count] = await Promise.all([
      studentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              studentClasses: true,
              results: true,
            },
          },
          section: {
            select: { name: true, lang: true },
          },
          academicGrade: {
            select: { name: true, lang: true },
          },
        },
      }),
      studentModel.count({ where }),
    ])

    // Collect all texts that need translation
    const textsToTranslate: string[] = []
    const needsTranslation = (row: any) => row.lang && row.lang !== lang

    for (const s of rows as any[]) {
      if (needsTranslation(s)) {
        textsToTranslate.push(`${s.givenName} ${s.surname}`.trim())
      }
      if (s.section?.name && s.section.lang && s.section.lang !== lang) {
        textsToTranslate.push(s.section.name)
      }
      if (
        s.academicGrade?.name &&
        s.academicGrade.lang &&
        s.academicGrade.lang !== lang
      ) {
        textsToTranslate.push(s.academicGrade.name)
      }
    }

    // Single batch translation for all texts
    const translationMap =
      textsToTranslate.length > 0
        ? await batchTranslate(textsToTranslate, "ar", lang, effectiveSchoolId!)
        : new Map<string, string>()

    // Map rows using the translation lookup
    data = (rows as any[]).map((s) => {
      const rawName = `${s.givenName} ${s.surname}`.trim()
      const name = needsTranslation(s)
        ? translationMap.get(rawName) || rawName
        : rawName

      const sectionName = s.section?.name
        ? s.section.lang && s.section.lang !== lang
          ? translationMap.get(s.section.name) || s.section.name
          : s.section.name
        : "-"

      const gradeName = s.academicGrade?.name
        ? s.academicGrade.lang && s.academicGrade.lang !== lang
          ? translationMap.get(s.academicGrade.name) || s.academicGrade.name
          : s.academicGrade.name
        : null

      return {
        id: s.id,
        userId: s.userId,
        name,
        studentId: s.studentId || null,
        sectionName: sectionName !== "-" ? sectionName : gradeName || "-",
        gradeName,
        status: s.status === "ACTIVE" ? "active" : "inactive",
        createdAt: (s.createdAt as Date).toISOString(),
        classCount: s._count?.studentClasses || 0,
        gradeCount: s._count?.results || 0,
        email: s.email || null,
        dateOfBirth: s.dateOfBirth
          ? (s.dateOfBirth as Date).toISOString()
          : null,
        enrollmentDate: s.enrollmentDate
          ? (s.enrollmentDate as Date).toISOString()
          : null,
      }
    })
    total = count as number
  }
  return (
    <StudentsTable
      initialData={data}
      total={total}
      dictionary={dictionary?.students}
      lang={lang}
      perPage={sp.perPage}
    />
  )
}
