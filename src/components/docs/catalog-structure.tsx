"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { File, Folder } from "lucide-react"

interface CatalogNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: CatalogNode[]
}

interface CatalogStructureProps {
  className?: string
}

export function CatalogStructure({ className }: CatalogStructureProps) {
  const nodes: CatalogNode[] = [
    {
      name: "prisma/models/",
      type: "directory",
      description: "catalog data model",
      children: [
        {
          name: "catalog.prisma",
          type: "file",
          description: "Subject — content root",
        },
        { name: "chapter.prisma", type: "file", description: "Chapter" },
        { name: "lesson.prisma", type: "file", description: "Lesson" },
        { name: "curriculum.prisma", type: "file", description: "Curriculum" },
        {
          name: "video.prisma",
          type: "file",
          description: "Video, VideoPurchase, Attachment",
        },
        {
          name: "qbank.prisma",
          type: "file",
          description: "Question, ExamQuestion",
        },
        {
          name: "exam.prisma",
          type: "file",
          description: "Exam, ExamTemplate",
        },
        { name: "material.prisma", type: "file", description: "Material" },
        { name: "assignment.prisma", type: "file", description: "Assignment" },
        { name: "book.prisma", type: "file", description: "Book" },
        { name: "textbook.prisma", type: "file", description: "Textbook" },
        { name: "document.prisma", type: "file", description: "Document" },
        { name: "proposal.prisma", type: "file", description: "Proposal" },
        {
          name: "bridge.prisma",
          type: "file",
          description:
            "SubjectSelection, ContentOverride, InstructorPreference, BookSelection",
        },
        {
          name: "enrollment.prisma",
          type: "file",
          description: "Enrollment, LessonProgress, SubjectCertificate",
        },
        {
          name: "academic.prisma",
          type: "file",
          description: "AcademicLevel, AcademicGrade, AcademicStream",
        },
      ],
    },
    {
      name: "prisma/seeds/catalog/",
      type: "directory",
      description: "load content into the DB",
      children: [
        {
          name: "index.ts",
          type: "file",
          description:
            "orchestrator: seedCatalog (US + full SD) + seedFullCatalog",
        },
        {
          name: "engine.ts",
          type: "file",
          description:
            "seedSubjectsOnly — the shallow nationals' shared seeder",
        },
        {
          name: "registry.ts",
          type: "file",
          description: "all 12 Curriculum records + curriculumId backfill",
        },
        {
          name: "us.ts",
          type: "file",
          description: "US — the US-curriculum source backbone",
        },
        {
          name: "tree.ts",
          type: "file",
          description:
            "the catalog repo (../catalog) → sd · gb · cbse · ib-dp · caie-igcse: subjects, chapters, lessons, questions, exams — ids preserved",
        },
        {
          name: "sa.ts · eg.ts · ae.ts · qa.ts · kw.ts · jo.ts",
          type: "file",
          description:
            "subjects-only nationals (split from world.ts; graduate to deep trees)",
        },
        {
          name: "concepts.ts",
          type: "file",
          description: "concept images to S3",
        },
        {
          name: "banners.ts",
          type: "file",
          description: "concept banners to S3 (owned, shared)",
        },
        {
          name: "lesson-covers.ts",
          type: "file",
          description: "per-lesson/chapter covers to S3 (US, legacy)",
        },
        { name: "books.ts", type: "file", description: "global catalog books" },
        {
          name: "content.ts",
          type: "file",
          description: "materials, exams, questions",
        },
        { name: "videos.ts", type: "file", description: "lesson videos" },
        {
          name: "exam-templates.ts",
          type: "file",
          description: "exam blueprints + templates",
        },
        {
          name: "demo.ts",
          type: "file",
          description: "demo-school structure + bridges",
        },
      ],
    },
    {
      name: "src/components/catalog/",
      type: "directory",
      description: "shared core — every surface imports from here",
      children: [
        {
          name: "concepts-data.ts",
          type: "file",
          description:
            "23 concepts, colors, nearestConcept, exact-match maps + pools — single source",
        },
        {
          name: "setup.ts",
          type: "file",
          description: "provisions a school onto the catalog",
        },
        {
          name: "provision.ts",
          type: "file",
          description:
            "schedule/sections/timetable/library provisioning + the repair doctor",
        },
        {
          name: "image.ts",
          type: "file",
          description: "Sharp pipeline + S3 upload",
        },
        {
          name: "image-url.ts",
          type: "file",
          description: "resolve image URLs (CloudFront)",
        },
      ],
    },
    {
      name: "src/components/saas-dashboard/catalog/",
      type: "directory",
      description: "platform authoring (DEVELOPER)",
    },
    {
      name: "src/components/school-dashboard/listings/subjects/catalog/",
      type: "directory",
      description: "school adoption + contribution",
    },
    {
      name: "src/components/lumos/data/catalog/",
      type: "directory",
      description: "LMS read queries",
    },
    {
      name: "../catalog/",
      type: "directory",
      description:
        "github.com/databayt/catalog — the curriculum repo; mirrors cdn.databayt.org/catalog/",
      children: [
        {
          name: "sd/ · gb/ · us/ · cbse/ · ib-dp/ · caie-igcse/",
          type: "directory",
          description:
            "<cur>/<grade>/<subject>/{structure,qbank,exams}.json, c<N>/l<N>/ — read by tree.ts (us is not adopted)",
        },
        {
          name: "scripts/migrate/renames.json",
          type: "file",
          description:
            "pre-catalog slug → catalog id (tree.ts adopts rows by it)",
        },
      ],
    },
    {
      name: "public/subjects/concepts/",
      type: "directory",
      description: "23 source concept images",
    },
    {
      name: "scripts/",
      type: "directory",
      children: [
        {
          name: "us-curriculum/us-inventory.json",
          type: "file",
          description: "US source data",
        },
        {
          name: "sudan-data/",
          type: "directory",
          description: "Sudan source data + TOC + PDFs",
        },
      ],
    },
  ]

  const FileIcon = ({ type }: { type: string }) =>
    type === "directory" ? (
      <Folder className="h-4 w-4 shrink-0" />
    ) : (
      <File className="h-4 w-4 shrink-0" />
    )

  const FileTree = ({
    item,
    level = 0,
    isLast = false,
    parentIsLast = [],
  }: {
    item: CatalogNode
    level?: number
    isLast?: boolean
    parentIsLast?: boolean[]
  }) => (
    <div className="relative">
      {level > 0 && (
        <>
          {parentIsLast
            .slice(0, -1)
            .map(
              (isLastParent, idx) =>
                !isLastParent && (
                  <div
                    key={idx}
                    className="absolute h-full border-s"
                    style={{ insetInlineStart: `${(idx + 1) * 24 - 20}px` }}
                  />
                )
            )}
          {!isLast && (
            <div
              className="absolute h-full border-s"
              style={{ insetInlineStart: `${level * 24 - 20}px` }}
            />
          )}
        </>
      )}
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingInlineStart: `${level * 24}px` }}
      >
        <FileIcon type={item.type} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          <code
            className={`bg-transparent px-0 py-0 ${
              item.type === "directory" ? "font-semibold" : ""
            }`}
          >
            {item.name}
          </code>
          {item.description && (
            <span className="text-muted-foreground text-sm">
              — {item.description}
            </span>
          )}
        </div>
      </div>
      {item.children && (
        <div className="mt-1">
          {item.children.map((child, index) => (
            <FileTree
              key={index}
              item={child}
              level={level + 1}
              isLast={index === (item.children?.length ?? 0) - 1}
              parentIsLast={[...parentIsLast, isLast]}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={`py-4 ${className ?? ""}`}>
      {nodes.map((node, index) => (
        <FileTree key={index} item={node} isLast={index === nodes.length - 1} />
      ))}
    </div>
  )
}
