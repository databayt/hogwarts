'use client'

import { Folder, File } from 'lucide-react'

interface DirectoryNode {
  name: string
  type: 'file' | 'directory'
  description?: string
  children?: DirectoryNode[]
}

interface StructureProps {
  className?: string
}

export function Structure({ className }: StructureProps) {
  const topLevelStructure: DirectoryNode = {
    name: "src/",
    type: "directory",
    description: "Source code directory",
    children: [
      {
        name: "app/",
        type: "directory",
        description: "Next.js App Router (Routing & Layouts)",
        children: [
          {
            name: "[lang]/",
            type: "directory",
            description: "i18n support",
            children: [
              {
                name: "abc/",
                type: "directory",
                description: "URL route: /abc",
                children: [
                  { name: "page.tsx", type: "file", description: "Route entry point" },
                  { name: "layout.tsx", type: "file", description: "Route layout" }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "components/",
        type: "directory",
        description: "Component Logic (Mirrors app structure)",
        children: [
          {
            name: "abc/",
            type: "directory",
            description: "Mirrors app/[lang]/abc/",
            children: [
              { name: "content.tsx", type: "file", description: "Page UI: headings, sections, layout" },
              { name: "actions.ts", type: "file", description: "Server actions: validate, mutate" },
              { name: "config.ts", type: "file", description: "Enums, option lists, defaults" },
              { name: "validation.ts", type: "file", description: "Zod schemas & refinements" },
              { name: "types.ts", type: "file", description: "Domain and UI types" },
              { name: "form.tsx", type: "file", description: "Typed forms (RHF)" },
              { name: "card.tsx", type: "file", description: "KPIs, summaries, quick actions" },
              { name: "all.tsx", type: "file", description: "List view with table, filters" },
              { name: "detail.tsx", type: "file", description: "Detail view with sections" },
              { name: "column.tsx", type: "file", description: "Table column builders" },
              { name: "use-abc.ts", type: "file", description: "Feature hooks" },
              { name: "README.md", type: "file", description: "Feature purpose, APIs, decisions" },
              { name: "ISSUE.md", type: "file", description: "Known issues and follow-ups" }
            ]
          },
          {
            name: "atom/",
            type: "directory",
            description: "Atomic UI components"
          },
          {
            name: "template/",
            type: "directory",
            description: "Reusable layout templates"
          },
          {
            name: "ui/",
            type: "directory",
            description: "Base UI components (shadcn/ui)"
          }
        ]
      }
    ]
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type === "directory") {
      return <Folder className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const FileTree = ({
    item,
    level = 0,
    isLast = false,
    parentIsLast = []
  }: {
    item: DirectoryNode
    level?: number
    isLast?: boolean
    parentIsLast?: boolean[]
  }) => (
    <div className="relative">
      {level > 0 && (
        <>
          {parentIsLast.slice(0, -1).map((isLastParent, idx) => (
            !isLastParent && (
              <div
                key={idx}
                className="absolute border-l h-full"
                style={{ left: `${(idx + 1) * 24 - 20}px` }}
              />
            )
          ))}
          {!isLast && (
            <div
              className="absolute border-l h-full"
              style={{ left: `${level * 24 - 20}px` }}
            />
          )}
        </>
      )}
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        <FileIcon type={item.type} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <code className={`bg-transparent px-0 py-0 ${
            item.type === 'directory' ? 'font-semibold' : ''
          }`}>
            {item.name}
          </code>
          {item.description && (
            <span className="text-sm text-muted-foreground">
              — {item.description}
            </span>
          )}
        </div>
      </div>
      {item.children && (
        <div className="mt-1">
          {item.children.map((child: DirectoryNode, index: number) => (
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
    <div className={`space-y-6 ${className}`}>
      <div className="py-4">
        <FileTree item={topLevelStructure} />
      </div>
    </div>
  )
}
