"use client"

import { File, Folder } from "lucide-react"

interface DirectoryNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: DirectoryNode[]
}

interface ListingStructureProps {
  className?: string
}

export function ListingStructure({ className }: ListingStructureProps) {
  const listingStructure: DirectoryNode = {
    name: "Listing Feature Structure",
    type: "directory",
    description:
      "Complete pattern for any listing (replace 'abc' with feature name)",
    children: [
      {
        name: "prisma/",
        type: "directory",
        description: "Database layer",
        children: [
          {
            name: "models/abc.prisma",
            type: "file",
            description: "Model with schoolId scope",
          },
          {
            name: "seeds/abc.ts",
            type: "file",
            description: "Test seed data",
          },
        ],
      },
      {
        name: "app/[lang]/s/[subdomain]/(platform)/(listings)/abc/",
        type: "directory",
        description: "Route layer",
        children: [
          {
            name: "page.tsx",
            type: "file",
            description: "Imports AbcContent",
          },
          {
            name: "layout.tsx",
            type: "file",
            description: "Feature layout with PageNav",
          },
          {
            name: "loading.tsx",
            type: "file",
            description: "Loading skeleton",
          },
          {
            name: "error.tsx",
            type: "file",
            description: "Error boundary",
          },
          {
            name: "[id]/",
            type: "directory",
            description: "Detail route",
            children: [
              { name: "page.tsx", type: "file", description: "Detail view" },
              {
                name: "loading.tsx",
                type: "file",
                description: "Loading state",
              },
            ],
          },
        ],
      },
      {
        name: "components/platform/listings/abc/",
        type: "directory",
        description: "Feature logic (mirrors route)",
        children: [
          {
            name: "content.tsx",
            type: "file",
            description: "Server component: data fetching",
          },
          {
            name: "table.tsx",
            type: "file",
            description: "Client component: interactive table",
          },
          {
            name: "columns.tsx",
            type: "file",
            description: "Column definitions (client)",
          },
          {
            name: "form.tsx",
            type: "file",
            description: "Create/Edit form (client)",
          },
          {
            name: "actions.ts",
            type: "file",
            description: 'Server actions ("use server")',
          },
          {
            name: "queries.ts",
            type: "file",
            description: "Query builders with Prisma",
          },
          {
            name: "authorization.ts",
            type: "file",
            description: "RBAC permission checks",
          },
          {
            name: "validation.ts",
            type: "file",
            description: "Zod schemas",
          },
          {
            name: "types.ts",
            type: "file",
            description: "TypeScript interfaces",
          },
          {
            name: "config.ts",
            type: "file",
            description: "Constants & options",
          },
          {
            name: "list-params.ts",
            type: "file",
            description: "URL params (nuqs)",
          },
          {
            name: "README.md",
            type: "file",
            description: "Feature documentation",
          },
          {
            name: "ISSUE.md",
            type: "file",
            description: "Known issues tracker",
          },
        ],
      },
    ],
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type === "directory") {
      return <Folder className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

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
                    className="absolute h-full border-l"
                    style={{ left: `${(idx + 1) * 24 - 20}px` }}
                  />
                )
            )}
          {!isLast && (
            <div
              className="absolute h-full border-l"
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
        <FileTree item={listingStructure} />
      </div>
    </div>
  )
}
