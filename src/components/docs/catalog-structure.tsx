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
          description: "orchestrator: US + Sudan",
        },
        {
          name: "us.ts",
          type: "file",
          description: "US K-12 from master-inventory.json",
        },
        {
          name: "sd.ts",
          type: "file",
          description: "full Sudan from curriculum/sd/",
        },
        {
          name: "sd-base.ts",
          type: "file",
          description: "Sudan base from sudan-curriculum.json",
        },
        { name: "world.ts", type: "file", description: "8 more curricula" },
        {
          name: "meta.ts",
          type: "file",
          description: "Curriculum records + curriculumId backfill",
        },
        {
          name: "concepts.ts",
          type: "file",
          description: "concept images to S3",
        },
        {
          name: "banners.ts",
          type: "file",
          description: "ClickView banners to concept paths",
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
          name: "setup.ts",
          type: "file",
          description: "provisions a school onto the catalog",
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
      name: "src/components/stream/data/catalog/",
      type: "directory",
      description: "LMS read queries",
    },
    {
      name: "curriculum/",
      type: "directory",
      description: "on-disk content source",
      children: [
        {
          name: "sd/",
          type: "directory",
          description: "Sudan — read by sd",
        },
        {
          name: "us/",
          type: "directory",
          description: "authored, not yet ingested",
        },
        {
          name: "uk/",
          type: "directory",
          description: "authored, not yet ingested",
        },
        {
          name: "fr/",
          type: "directory",
          description: "authored, not yet ingested",
        },
        {
          name: "in/",
          type: "directory",
          description: "authored, not yet ingested",
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
          name: "clickview-data/master-inventory.json",
          type: "file",
          description: "US source data",
        },
        {
          name: "sudan-data/",
          type: "directory",
          description: "Sudan source data + TOC + PDFs",
        },
        {
          name: "upload-textbooks-all.ts",
          type: "file",
          description: "upload Sudan textbook PDFs to S3",
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
