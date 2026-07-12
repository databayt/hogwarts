"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { File, Folder } from "lucide-react"

interface StreamNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: StreamNode[]
}

interface StreamStructureProps {
  className?: string
}

export function StreamStructure({ className }: StreamStructureProps) {
  const nodes: StreamNode[] = [
    {
      name: "src/components/stream/",
      type: "directory",
      description: "one block, mirrored 1:1 to /stream",
      children: [
        {
          name: "types.ts",
          type: "file",
          description: "StreamDictionary, StreamContentProps, course types",
        },
        {
          name: "authorization.ts",
          type: "file",
          description: "RBAC matrix (DEVELOPER > ADMIN > TEACHER > STUDENT)",
        },
        {
          name: "list-params.ts",
          type: "file",
          description: "URL state (search, category, grade)",
        },
        {
          name: "header.tsx",
          type: "file",
          description: "stream navigation header",
        },
        {
          name: "search-bar.tsx",
          type: "file",
          description: "localized search + Explore dropdown (popular chips)",
        },
        {
          name: "lib/quota.ts",
          type: "file",
          description: "per-school video storage quota (check / inc / dec)",
        },
        {
          name: "home/",
          type: "directory",
          description: "landing page — server sections",
          children: [
            {
              name: "content.tsx",
              type: "file",
              description: "orchestrator (hero, skills, releases, continue)",
            },
            {
              name: "continue-watching-section.tsx",
              type: "file",
              description: "resume strip from LessonProgress",
            },
          ],
        },
        {
          name: "courses/",
          type: "directory",
          description: "catalog browse + detail + enrollment",
          children: [
            {
              name: "content.tsx",
              type: "file",
              description: "course grid (search, grade badges)",
            },
            {
              name: "[slug]/content.tsx",
              type: "file",
              description: "course detail — chapters, lessons, progress",
            },
            {
              name: "enrollment/",
              type: "directory",
              description: "free enroll + Stripe checkout actions",
            },
          ],
        },
        {
          name: "dashboard/",
          type: "directory",
          description: "the learning surfaces",
          children: [
            {
              name: "content.tsx",
              type: "file",
              description: "student dashboard (enrolled courses)",
            },
            {
              name: "lesson/content.tsx",
              type: "file",
              description:
                "lesson player — fallback clip, unlock pill, progress",
            },
            {
              name: "lesson/catalog-actions.ts",
              type: "file",
              description: "progress writes, complete/incomplete, quiz",
            },
            {
              name: "parent/",
              type: "directory",
              description: "guardian read-only child progress",
            },
          ],
        },
        {
          name: "lesson/instructor-switcher.tsx",
          type: "file",
          description: "instructor chips + per-video unlock",
        },
        {
          name: "settings/",
          type: "directory",
          description: "admin hub — 5 tabs",
          children: [
            {
              name: "content.tsx",
              type: "file",
              description:
                "tab shell (overview / enrollments / instructors / review / videos)",
            },
            {
              name: "video-review-actions.ts",
              type: "file",
              description: "school review lane (platform gate for PUBLIC/PAID)",
            },
            {
              name: "video-review-content.tsx",
              type: "file",
              description: "pending queue UI (localized)",
            },
            {
              name: "instructor-settings.tsx",
              type: "file",
              description: "per-subject instructor preference",
            },
            {
              name: "enrollments/",
              type: "directory",
              description: "school enrollment management",
            },
          ],
        },
        {
          name: "teach/",
          type: "directory",
          description: "contributor surfaces",
          children: [
            {
              name: "videos-content.tsx",
              type: "file",
              description: "My Videos table + upload entry",
            },
            {
              name: "propose-video-dialog.tsx",
              type: "file",
              description: "3-step wizard — URL or direct S3 upload",
            },
            {
              name: "video-settings-dialog.tsx",
              type: "file",
              description: "owner controls (visibility, revoke, delete)",
            },
            {
              name: "get-proposable-lessons.ts",
              type: "file",
              description: "lessons the caller may contribute to",
            },
          ],
        },
        {
          name: "video/",
          type: "directory",
          description: "video lifecycle actions",
          children: [
            {
              name: "video-actions.ts",
              type: "file",
              description: "uploadVideo — quota, HEAD size, reviewer notify",
            },
            {
              name: "video-owner-actions.ts",
              type: "file",
              description: "visibility / paywall / revoke / replace / delete",
            },
            {
              name: "video-purchase-actions.ts",
              type: "file",
              description: "per-video Stripe unlock checkout",
            },
          ],
        },
        {
          name: "payment/",
          type: "directory",
          description: "Stripe success / cancel pages",
        },
        {
          name: "emails/",
          type: "directory",
          description: "enrollment + completion templates (Resend)",
        },
        {
          name: "shared/",
          type: "directory",
          description: "player + validators + email service",
          children: [
            {
              name: "video-player/",
              type: "directory",
              description: "player, seek, up-next, watermark, onSourceError",
            },
            {
              name: "url-validators.ts",
              type: "file",
              description: "video / image / document URL allowlists",
            },
          ],
        },
        {
          name: "data/catalog/",
          type: "directory",
          description: 'read fetchers — React cache(), NOT "use server"',
          children: [
            {
              name: "get-lesson-with-progress.ts",
              type: "file",
              description: "ranked videos, paywall nulls, preference sort",
            },
            {
              name: "get-all-courses.ts",
              type: "file",
              description: "published subjects + search + filters",
            },
          ],
        },
        {
          name: "README.md",
          type: "file",
          description: "feature purpose, routes, status",
        },
        {
          name: "ISSUE.md",
          type: "file",
          description: "close log + post-release engineering debt",
        },
        {
          name: "CLAUDE.md",
          type: "file",
          description: "block-level context and key decisions",
        },
      ],
    },
    {
      name: "integration points",
      type: "directory",
      description: "outside the block",
      children: [
        {
          name: "src/app/[lang]/s/[subdomain]/(school-dashboard)/stream/",
          type: "directory",
          description: "route mirrors (page.tsx thin wrappers)",
        },
        {
          name: "src/app/api/blob/presign/route.ts",
          type: "file",
          description: "direct-upload presign (POST) + orphan cleanup (DELETE)",
        },
        {
          name: "src/app/api/webhooks/stripe/route.ts",
          type: "file",
          description: "enrollment + video_purchase completion",
        },
        {
          name: "src/lib/s3.ts",
          type: "file",
          description: "HEAD (authoritative bytes) + DELETE helpers",
        },
        {
          name: "src/components/internationalization/stream-{en,ar}.json",
          type: "file",
          description: "the stream dictionary subtree",
        },
        {
          name: "src/tests/school-dashboard/stream/",
          type: "directory",
          description: "278 unit tests across 19 files",
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
    item: StreamNode
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
              isLast={index === item.children!.length - 1}
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
