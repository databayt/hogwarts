"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { File, Folder } from "lucide-react"

interface DirectoryNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: DirectoryNode[]
}

const roots: DirectoryNode[] = [
  {
    name: "src/components/translation/",
    type: "directory",
    description: "the whole feature — one self-contained module",
    children: [
      {
        name: "display.ts",
        type: "file",
        description: "getText, getFields — read-time translation",
      },
      {
        name: "actions.ts",
        type: "file",
        description: "translate, autoTranslate, translateText/Fields",
      },
      {
        name: "google.ts",
        type: "file",
        description: "translateRaw, translateBatch — provider calls",
      },
      {
        name: "person.ts",
        type: "file",
        description: "getName, getNames, getLabels",
      },
      {
        name: "search.ts",
        type: "file",
        description: "search — bilingual, cache-only",
      },
      {
        name: "transliterate.ts",
        type: "file",
        description: "transliterate, formatName — ar→Latin",
      },
      {
        name: "util.ts",
        type: "file",
        description: "withLang, detectScript, detectLang, fullName",
      },
      {
        name: "types.ts",
        type: "file",
        description: "Lang + request/result types",
      },
      {
        name: "config.ts",
        type: "file",
        description: "Google API URL + constants",
      },
      {
        name: "__tests__/",
        type: "directory",
        children: [
          { name: "actions.test.ts", type: "file" },
          { name: "display.test.ts", type: "file" },
          { name: "google.test.ts", type: "file" },
        ],
      },
    ],
  },
  {
    name: "prisma/models/translation.prisma",
    type: "file",
    description: "Translation model (table translation_cache)",
  },
  {
    name: "src/app/api/mobile/translate/route.ts",
    type: "file",
    description: "POST /api/mobile/translate",
  },
  {
    name: "scripts/audit-untranslated.ts",
    type: "file",
    description: "finds DB content rendered without translation",
  },
]

const FileIcon = ({ type }: { type: string }) =>
  type === "directory" ? (
    <Folder className="h-4 w-4" />
  ) : (
    <File className="h-4 w-4" />
  )

const FileTree = ({
  item,
  level = 0,
  isLast = false,
  parentIsLast = [],
}: {
  item: DirectoryNode
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
      <div className="flex min-w-0 flex-1 items-center gap-2">
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

export function TranslationStructure({ className }: { className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <div className="py-4">
        {roots.map((root, index) => (
          <FileTree
            key={index}
            item={root}
            isLast={index === roots.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
