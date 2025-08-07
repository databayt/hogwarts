'use client'

import { Folder, File } from 'lucide-react'

interface DirectoryNode {
  name: string
  type: 'file' | 'directory'
  description?: string
  children?: DirectoryNode[]
}

interface DirectoryStructureProps {
  className?: string
}

export function DirectoryStructure({ className }: DirectoryStructureProps) {
  const topLevelStructure: DirectoryNode = {
    name: "project-root/",
    type: "directory",
    children: [
      {
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
                name: "abc/",
                type: "directory",
                description: "URL route: /abc"
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
                description: "Mirrors app/abc/"
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
          },
          {
            name: "lib/",
            type: "directory",
            description: "Shared utilities & functions"
          },
          {
            name: "styles/",
            type: "directory",
            description: "Global styles and CSS"
          }
        ]
      }
    ]
  }

  const deeperStructure: DirectoryNode = {
    name: "src/",
    type: "directory",
    children: [
      {
        name: "app/",
        type: "directory",
        children: [
          {
            name: "page.tsx",
            type: "file",
            description: "Root page component"
          },
          {
            name: "layout.tsx",
            type: "file",
            description: "Root layout component"
          },
          {
            name: "abc/",
            type: "directory",
            description: "URL route: /abc",
            children: [
              {
                name: "page.tsx",
                type: "file",
                description: "ABC main page component"
              },
              {
                name: "layout.tsx",
                type: "file",
                description: "ABC route-specific layout"
              },
              {
                name: "loading.tsx",
                type: "file",
                description: "ABC loading state component"
              }
            ]
          }
        ]
      },
      {
        name: "components/",
        type: "directory",
        children: [
          {
            name: "abc/",
            type: "directory",
            description: "Mirrors app/abc/",
            children: [
              {
                name: "content.tsx",
                type: "file",
                description: "ABC UI content components"
              },
              {
                name: "actions.ts",
                type: "file",
                description: "Server actions & API calls"
              },
              {
                name: "constants.ts",
                type: "file",
                description: "Arrays, enums, static data"
              },
              {
                name: "validation.ts",
                type: "file",
                description: "Zod schemas & validation logic"
              },
              {
                name: "types.ts",
                type: "file",
                description: "TypeScript interfaces & types"
              },
              {
                name: "form.tsx",
                type: "file",
                description: "Form components"
              },
              {
                name: "cards.tsx",
                type: "file",
                description: "Card components"
              },
              {
                name: "hooks.ts",
                type: "file",
                description: "Custom React hooks"
              }
            ]
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
          {/* Vertical lines from parent levels */}
          {parentIsLast.slice(0, -1).map((isLastParent, idx) => (
            !isLastParent && (
              <div
                key={idx}
                className="absolute border-l h-full"
                style={{ left: `${(idx + 1) * 24 - 20}px` }}
              />
            )
          ))}
          {/* Current level vertical line */}
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
          <code className={`text-sm bg-transparent px-0 py-0 ${
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
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Top-Level Structure
        </h4>
        <FileTree item={topLevelStructure} />
      </div>

      <div className="py-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <File className="w-4 h-4" />
          Deeper Layer Structure
        </h4>
        <FileTree item={deeperStructure} />
      </div>

      <div className="border rounded-lg p-4 mt-8">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <File className="w-4 h-4" />
          Standardized File Patterns
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>actions.ts:</span>
            <span className="font-medium">Server actions, API calls</span>
          </div>
          <div className="flex justify-between">
            <span>constants.ts:</span>
            <span className="font-medium">Static data, enums</span>
          </div>
          <div className="flex justify-between">
            <span>validation.ts:</span>
            <span className="font-medium">Zod schemas, validation</span>
          </div>
          <div className="flex justify-between">
            <span>types.ts:</span>
            <span className="font-medium">TypeScript interfaces</span>
          </div>
          <div className="flex justify-between">
            <span>form.tsx:</span>
            <span className="font-medium">Form components</span>
          </div>
          <div className="flex justify-between">
            <span>cards.tsx:</span>
            <span className="font-medium">Card-based UI</span>
          </div>
          <div className="flex justify-between">
            <span>content.tsx:</span>
            <span className="font-medium">UI content & layout</span>
          </div>
          <div className="flex justify-between">
            <span>hooks.ts:</span>
            <span className="font-medium">Custom React hooks</span>
          </div>
        </div>
      </div>

      <div className="border-l-4 p-4 rounded-r-lg">
        <h4 className="font-semibold mb-2">Mirror-Pattern Benefits</h4>
        <ul className="text-sm space-y-1">
          <li>• <strong>URL-to-Directory Mapping:</strong> Every URL route has a corresponding mirrored directory structure</li>
          <li>• <strong>Predictable Navigation:</strong> If you can see a URL, you know exactly where to find its code</li>
          <li>• <strong>Intuitive Mental Model:</strong> Creates a clear relationship between routing and component logic</li>
          <li>• <strong>Enhanced Discoverability:</strong> Makes it easy to locate and understand feature organization</li>
        </ul>
      </div>
    </div>
  )
}
