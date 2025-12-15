"use client"

import { File, Folder } from "lucide-react"

interface DirectoryNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: DirectoryNode[]
}

interface DirectoryStructureProps {
  className?: string
}

export function DirectoryStructure({ className }: DirectoryStructureProps) {
  const topLevelStructure: DirectoryNode = {
    name: "src/",
    type: "directory",
    description: "Source code directory",
    children: [
      {
        name: "app/",
        type: "directory",
        description: "Next.js App Router",
        children: [
          {
            name: "[lang]/",
            type: "directory",
            description: "Internationalized routes",
            children: [
              {
                name: "(marketing)/",
                type: "directory",
                description: "Entry point 01: SaaS marketing",
              },
              {
                name: "(operator)/",
                type: "directory",
                description: "Entry point 02: SaaS dashboard",
              },
              {
                name: "(auth)/",
                type: "directory",
                description: "Authentication pages",
              },
              {
                name: "onboarding/",
                type: "directory",
                description: "User onboarding flow",
              },
              {
                name: "s/",
                type: "directory",
                description: "Multi-tenant routing",
                children: [
                  {
                    name: "[subdomain]/",
                    type: "directory",
                    description: "Tenant-specific routes",
                    children: [
                      {
                        name: "(platform)/",
                        type: "directory",
                        description: "Entry point 04: School dashboard",
                      },
                      {
                        name: "(site)/",
                        type: "directory",
                        description: "Entry point 03: School marketing",
                      },
                    ],
                  },
                ],
              },
              {
                name: "layout.tsx",
                type: "file",
                description: "Root layout component",
              },
            ],
          },
        ],
      },
      {
        name: "components/",
        type: "directory",
        description: "React components",
        children: [
          {
            name: "ui/",
            type: "directory",
            description: "shadcn/ui components",
          },
          {
            name: "atom/",
            type: "directory",
            description: "Complex components (2+ shadcn combined)",
          },
          {
            name: "template/",
            type: "directory",
            description: "Full sections (header, hero, footer)",
          },
          {
            name: "auth/",
            type: "directory",
            description: "Authentication components",
          },
          {
            name: "onboarding/",
            type: "directory",
            description: "Onboarding flow components",
          },
          {
            name: "marketing/",
            type: "directory",
            description: "Entry point 01: SaaS marketing",
          },
          {
            name: "operator/",
            type: "directory",
            description: "Entry point 02: SaaS dashboard",
          },
          {
            name: "site/",
            type: "directory",
            description: "Entry point 03: School marketing",
          },
          {
            name: "platform/",
            type: "directory",
            description: "Entry point 04: School dashboard",
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
        <FileTree item={topLevelStructure} />
      </div>
    </div>
  )
}
