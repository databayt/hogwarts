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
    description: "Replace 'abc' with your feature name",
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
        name: "src/",
        type: "directory",
        description: "Source code",
        children: [
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
                description: "Feature layout",
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
                name: "[id]/page.tsx",
                type: "file",
                description: "Detail view",
              },
            ],
          },
          {
            name: "components/",
            type: "directory",
            description: "Component layer",
            children: [
              {
                name: "atom/",
                type: "directory",
                description: "Reusable UI atoms",
                children: [
                  {
                    name: "page-title.tsx",
                    type: "file",
                    description: "Page title display",
                  },
                  {
                    name: "page-nav.tsx",
                    type: "file",
                    description: "Sub-navigation tabs",
                  },
                  {
                    name: "toolbar.tsx",
                    type: "file",
                    description: "Action toolbar",
                  },
                  {
                    name: "search-input.tsx",
                    type: "file",
                    description: "Debounced search",
                  },
                  {
                    name: "view-toggle.tsx",
                    type: "file",
                    description: "Grid/Table toggle",
                  },
                  {
                    name: "grid-container.tsx",
                    type: "file",
                    description: "Responsive grid",
                  },
                  {
                    name: "empty-state.tsx",
                    type: "file",
                    description: "Empty state display",
                  },
                  {
                    name: "modal/",
                    type: "directory",
                    description: "Modal system",
                    children: [
                      {
                        name: "context.tsx",
                        type: "file",
                        description: "Modal state (useModal)",
                      },
                      {
                        name: "modal.tsx",
                        type: "file",
                        description: "Modal wrapper",
                      },
                      {
                        name: "modal-form-layout.tsx",
                        type: "file",
                        description: "Two-column layout",
                      },
                      {
                        name: "modal-footer.tsx",
                        type: "file",
                        description: "Progress + navigation",
                      },
                    ],
                  },
                ],
              },
              {
                name: "table/",
                type: "directory",
                description: "Reusable table components",
                children: [
                  {
                    name: "data-table.tsx",
                    type: "file",
                    description: "Main DataTable",
                  },
                  {
                    name: "data-table-toolbar.tsx",
                    type: "file",
                    description: "Table toolbar",
                  },
                  {
                    name: "data-table-column-header.tsx",
                    type: "file",
                    description: "Sortable header",
                  },
                  {
                    name: "use-data-table.ts",
                    type: "file",
                    description: "Table state hook",
                  },
                ],
              },
              {
                name: "platform/listings/abc/",
                type: "directory",
                description: "Feature logic (mirrors route)",
                children: [
                  {
                    name: "content.tsx",
                    type: "file",
                    description: "Server: data fetching",
                  },
                  {
                    name: "table.tsx",
                    type: "file",
                    description: "Client: interactive table",
                  },
                  {
                    name: "columns.tsx",
                    type: "file",
                    description: "Column definitions",
                  },
                  {
                    name: "form.tsx",
                    type: "file",
                    description: "Create/Edit form",
                  },
                  {
                    name: "actions.ts",
                    type: "file",
                    description: "Server actions",
                  },
                  {
                    name: "queries.ts",
                    type: "file",
                    description: "Query builders",
                  },
                  {
                    name: "authorization.ts",
                    type: "file",
                    description: "RBAC checks",
                  },
                  {
                    name: "validation.ts",
                    type: "file",
                    description: "Zod schemas",
                  },
                  {
                    name: "types.ts",
                    type: "file",
                    description: "TypeScript types",
                  },
                ],
              },
            ],
          },
          {
            name: "hooks/",
            type: "directory",
            description: "Shared hooks",
            children: [
              {
                name: "use-platform-data.ts",
                type: "file",
                description: "Optimistic updates + infinite scroll",
              },
              {
                name: "use-platform-view.ts",
                type: "file",
                description: "View mode (URL-persisted)",
              },
            ],
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
