"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MaterialItem {
  id: string
  title: string
  description: string | null
  type: string
  fileUrl: string | null
  externalUrl: string | null
  pageCount: number | null
  mimeType: string | null
  tags: string[]
  imageUrl: string | null
  color: string | null
}

interface SubjectSummary {
  name: string
  slug: string
  color: string | null
}

interface Props {
  subject: SubjectSummary
  materials: MaterialItem[]
  lang: Locale
  subdomain: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Types that use the subject card style (bordered, 56px image) */
const SUBJECT_CARD_TYPES = new Set(["TEXTBOOK", "SYLLABUS", "REFERENCE"])

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  TEXTBOOK: "Textbook",
  SYLLABUS: "Syllabus",
  REFERENCE: "Reference",
  STUDY_GUIDE: "Study Guide",
  PROJECT: "Project",
  WORKSHEET: "Worksheet",
  PRESENTATION: "Presentation",
  LESSON_NOTES: "Lesson Notes",
  VIDEO_GUIDE: "Video Guide",
  LAB_MANUAL: "Lab Manual",
  OTHER: "Other",
}

const MATERIAL_TYPE_ORDER = [
  "TEXTBOOK",
  "SYLLABUS",
  "REFERENCE",
  "STUDY_GUIDE",
  "PROJECT",
  "WORKSHEET",
  "PRESENTATION",
  "LESSON_NOTES",
  "VIDEO_GUIDE",
  "LAB_MANUAL",
  "OTHER",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogMaterialsContent({
  subject,
  materials,
  lang,
  subdomain,
}: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined

  const matTypes = cat?.materialTypes as Record<string, string> | undefined

  const t = useMemo(
    () => ({
      exploreMaterial: cat?.exploreMaterial || "Explore Material",
      exploreDescription: (
        cat?.exploreDescription || "Explore {name} material and videos"
      ).replace("{name}", subject.name),
      pages: cat?.pages || "pages",
      // Material types
      TEXTBOOK: matTypes?.TEXTBOOK || "Textbook",
      SYLLABUS: matTypes?.SYLLABUS || "Syllabus",
      REFERENCE: matTypes?.REFERENCE || "Reference",
      STUDY_GUIDE: matTypes?.STUDY_GUIDE || "Study Guide",
      PROJECT: matTypes?.PROJECT || "Project",
      WORKSHEET: matTypes?.WORKSHEET || "Worksheet",
      PRESENTATION: matTypes?.PRESENTATION || "Presentation",
      LESSON_NOTES: matTypes?.LESSON_NOTES || "Lesson Notes",
      VIDEO_GUIDE: matTypes?.VIDEO_GUIDE || "Video Guide",
      LAB_MANUAL: matTypes?.LAB_MANUAL || "Lab Manual",
      OTHER: matTypes?.OTHER || "Other",
    }),
    [cat, matTypes, subject.name]
  )

  // Group materials by type in pipeline order
  const groupedByType = useMemo(() => {
    const grouped: Record<string, MaterialItem[]> = {}
    for (const mat of materials) {
      if (!grouped[mat.type]) grouped[mat.type] = []
      grouped[mat.type].push(mat)
    }
    return MATERIAL_TYPE_ORDER.filter((type) => grouped[type]).map((type) => ({
      type,
      label: t[type as keyof typeof t] ?? MATERIAL_TYPE_LABELS[type] ?? type,
      items: grouped[type],
    }))
  }, [materials, t])

  const [activeType, setActiveType] = useState<string | null>(
    groupedByType[0]?.type ?? null
  )

  // Scroll-spy for sidebar
  useEffect(() => {
    if (groupedByType.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const type = entry.target.id.replace("material-type-", "")
            setActiveType(type)
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    for (const group of groupedByType) {
      const el = document.getElementById(`material-type-${group.type}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [groupedByType])

  const accentColor = subject.color ?? "#1e40af"

  return (
    <div id="all-materials">
      <div className="flex gap-8">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="space-y-8">
            {groupedByType.map((group) => (
              <MaterialTypeSection
                key={group.type}
                type={group.type}
                label={group.label}
                items={group.items}
                accentColor={accentColor}
                t={t}
              />
            ))}
          </div>

          {/* Bottom CTA bar */}
          <div
            className="mt-12 flex items-center justify-between rounded-lg px-6 py-4"
            style={{ backgroundColor: accentColor }}
          >
            <p className="text-base font-semibold text-white">
              {t.exploreDescription}
            </p>
            <Link
              href={`../${subject.slug}`}
              className="bg-background text-foreground border-foreground shrink-0 rounded-sm border px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-90"
            >
              {t.exploreMaterial}
            </Link>
          </div>
        </div>

        {/* Sidebar nav */}
        <aside className="sticky top-24 hidden w-48 shrink-0 self-start lg:block">
          <p className="mb-2 text-sm font-semibold">{subject.name}</p>
          <nav className="relative">
            <span className="border-muted-foreground/20 absolute start-0 top-3 bottom-3 border-s" />
            {groupedByType.map((group) => {
              const isActive = activeType === group.type
              return (
                <a
                  key={group.type}
                  href={`#material-type-${group.type}`}
                  className={`relative flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="bg-foreground absolute start-[-5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full" />
                  )}
                  <span className="line-clamp-1">{group.label}</span>
                  <span className="text-muted-foreground/60 ms-auto text-[10px]">
                    {group.items.length}
                  </span>
                </a>
              )
            })}
          </nav>
        </aside>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Material Type Section
// ---------------------------------------------------------------------------

function MaterialTypeSection({
  type,
  label,
  items,
  accentColor,
  t,
}: {
  type: string
  label: string
  items: MaterialItem[]
  accentColor: string
  t: Record<string, string>
}) {
  const isSubjectStyle = SUBJECT_CARD_TYPES.has(type)

  return (
    <section id={`material-type-${type}`} className="scroll-mt-24">
      <h2 className="mb-4 text-lg font-semibold">{label}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((material) =>
          isSubjectStyle ? (
            <SubjectStyleCard
              key={material.id}
              material={material}
              accentColor={accentColor}
              t={t}
            />
          ) : (
            <LessonStyleCard
              key={material.id}
              material={material}
              accentColor={accentColor}
              t={t}
            />
          )
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Subject-style card (TEXTBOOK, SYLLABUS) — bordered, 56px image
// ---------------------------------------------------------------------------

function SubjectStyleCard({
  material,
  accentColor,
  t,
}: {
  material: MaterialItem
  accentColor: string
  t: Record<string, string>
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const onError = useCallback(() => setImgFailed(true), [])
  const thumbColor = material.color ?? accentColor

  return (
    <div className="group hover:bg-muted/50 flex items-center gap-3 rounded-lg border transition-colors">
      {/* Image — rounded on outer edge, sharp on text side */}
      <div
        className="bg-muted relative h-14 w-14 shrink-0 overflow-hidden rounded-s-lg rounded-e-none"
        style={{ backgroundColor: thumbColor }}
      >
        {material.imageUrl && !imgFailed && (
          <Image
            src={material.imageUrl}
            alt={material.title}
            fill
            className="object-cover"
            sizes="56px"
            onError={onError}
            unoptimized
          />
        )}
      </div>

      <div className="min-w-0 flex-1 pe-3">
        <p className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
          {material.title}
        </p>
        {material.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {material.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lesson-style card (STUDY_GUIDE, etc.) — no border, 72px thumbnail
// ---------------------------------------------------------------------------

function LessonStyleCard({
  material,
  accentColor,
  t,
}: {
  material: MaterialItem
  accentColor: string
  t: Record<string, string>
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const onError = useCallback(() => setImgFailed(true), [])
  const thumbColor = material.color ?? accentColor

  return (
    <div className="group hover:bg-muted/50 flex items-start gap-3 rounded-md transition-colors">
      {/* Thumbnail */}
      <div
        className="relative h-18 w-18 shrink-0 overflow-hidden rounded-sm transition-[border-radius] group-hover:rounded-e-none"
        style={{ backgroundColor: thumbColor }}
      >
        {material.imageUrl && !imgFailed && (
          <Image
            src={material.imageUrl}
            alt={material.title}
            fill
            className="object-cover"
            quality={100}
            sizes="72px"
            onError={onError}
            unoptimized
          />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pt-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium">
          {material.title}
        </p>
        {material.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {material.description}
          </p>
        )}
      </div>
    </div>
  )
}
