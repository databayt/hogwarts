"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { File, Folder } from "lucide-react"

interface TimetableNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: TimetableNode[]
}

interface TimetableStructureProps {
  className?: string
}

export function TimetableStructure({ className }: TimetableStructureProps) {
  const nodes: TimetableNode[] = [
    {
      name: "src/app/[lang]/s/[subdomain]/(school-dashboard)/timetable/",
      type: "directory",
      description: "routes — mirror the component tree",
      children: [
        {
          name: "page.tsx",
          type: "file",
          description: "Overview / Today — role-routed",
        },
        {
          name: "layout.tsx",
          type: "file",
          description: "role-based tab nav (PageNav)",
        },
        {
          name: "error.tsx",
          type: "file",
          description: "error boundary (top level only)",
        },
        { name: "loading.tsx", type: "file", description: "skeleton" },
        {
          name: "full/",
          type: "directory",
          children: [
            {
              name: "page.tsx",
              type: "file",
              description: 'Full-week tab (defaultTab="full")',
            },
          ],
        },
        {
          name: "analytics/",
          type: "directory",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "loading.tsx", type: "file" },
          ],
        },
        {
          name: "conflicts/",
          type: "directory",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "loading.tsx", type: "file" },
          ],
        },
        {
          name: "generate/",
          type: "directory",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "loading.tsx", type: "file" },
          ],
        },
        {
          name: "settings/",
          type: "directory",
          children: [
            { name: "page.tsx", type: "file" },
            { name: "loading.tsx", type: "file" },
          ],
        },
      ],
    },
    {
      name: "src/components/school-dashboard/timetable/",
      type: "directory",
      description: "the block — all UI and logic live here",
      children: [
        {
          name: "content.tsx",
          type: "file",
          description: "entry: SessionProvider → RoleRouter",
        },
        {
          name: "actions.ts",
          type: "file",
          description: 'server actions + queries ("use server", ~6k lines)',
        },
        { name: "validation.ts", type: "file", description: "Zod schemas" },
        { name: "types.ts", type: "file", description: "domain + UI types" },
        {
          name: "config.ts",
          type: "file",
          description: "options, labels, defaults + constants",
        },
        {
          name: "permissions-config.ts",
          type: "file",
          description: "client-safe PERMISSION_MATRIX + role checks",
        },
        {
          name: "permissions.ts",
          type: "file",
          description: "server-side access guards",
        },
        {
          name: "structures.ts",
          type: "file",
          description: "predefined school structures (sd-gov-default, …)",
        },
        {
          name: "util.ts",
          type: "file",
          description: "pure helpers (findAvailableSlots, …)",
        },
        {
          name: "live-class-join.ts",
          type: "file",
          description: "live-class join/start resolver (conference link)",
        },
        {
          name: "slot-editor-dialog.tsx",
          type: "file",
          description: "assign subject / teacher / room to a slot",
        },
        { name: "print.css", type: "file", description: "A4 print styles" },
        {
          name: "views/",
          type: "directory",
          description: "one view per role",
          children: [
            {
              name: "role-router.tsx",
              type: "file",
              description: "dispatch by role + editable flag",
            },
            {
              name: "admin-view.tsx",
              type: "file",
              description:
                "room / teacher grid, editable, cookie-persistent filter",
            },
            { name: "teacher-view.tsx", type: "file" },
            { name: "student-view.tsx", type: "file" },
            { name: "guardian-view.tsx", type: "file" },
            { name: "simple-grid.tsx", type: "file" },
            { name: "preview.tsx", type: "file" },
            { name: "live-join-button.tsx", type: "file" },
            { name: "start-live-class-button.tsx", type: "file" },
            { name: "index.ts", type: "file" },
          ],
        },
        {
          name: "generate/",
          type: "directory",
          description: "auto-generation",
          children: [
            { name: "content.tsx", type: "file", description: "Generate page" },
            {
              name: "algorithm.ts",
              type: "file",
              description: "section-based scheduler",
            },
          ],
        },
        {
          name: "analytics/",
          type: "directory",
          children: [
            {
              name: "content.tsx",
              type: "file",
              description: "utilization reporting",
            },
          ],
        },
        {
          name: "conflicts/",
          type: "directory",
          children: [
            { name: "content.tsx", type: "file", description: "conflict page" },
          ],
        },
        {
          name: "settings/",
          type: "directory",
          children: [
            { name: "content.tsx", type: "file", description: "config page" },
          ],
        },
        {
          name: "substitutions/",
          type: "directory",
          description: "BUILT but not wired to any route or tab",
          children: [
            { name: "content.tsx", type: "file" },
            { name: "absence-form.tsx", type: "file" },
            { name: "substitute-finder.tsx", type: "file" },
            { name: "substitution-list.tsx", type: "file" },
            { name: "index.ts", type: "file" },
          ],
        },
        {
          name: "export/",
          type: "directory",
          description: "PDF export",
          children: [
            { name: "timetable-pdf.tsx", type: "file" },
            { name: "use-timetable-export.ts", type: "file" },
            { name: "index.ts", type: "file" },
          ],
        },
        {
          name: "README.md",
          type: "file",
          description: "block docs (decisions, danger zones)",
        },
        { name: "ISSUE.md", type: "file" },
        { name: "FEATURES.md", type: "file" },
        { name: "CLAUDE.md", type: "file" },
      ],
    },
    {
      name: "src/tests/school-dashboard/timetable/",
      type: "directory",
      description: "Vitest suites",
      children: [
        { name: "actions.test.ts", type: "file" },
        { name: "structures.test.ts", type: "file" },
        { name: "validation.test.ts", type: "file" },
        { name: "production-readiness.test.ts", type: "file" },
      ],
    },
    {
      name: "prisma/models/",
      type: "directory",
      description: "data model",
      children: [
        {
          name: "timetable.prisma",
          type: "file",
          description:
            "Timetable, TeacherConstraint, RoomConstraint, TimetableTemplate, ScheduleException, TeacherAbsence, SubstitutionRecord",
        },
        {
          name: "school.prisma",
          type: "file",
          description: "Period (+ core school models)",
        },
        {
          name: "schedule.prisma",
          type: "file",
          description: "SchoolWeekConfig",
        },
      ],
    },
    {
      name: "src/app/api/mobile/",
      type: "directory",
      description: "REST — mobile only (web uses server actions directly)",
      children: [
        { name: "timetable/[userId]/route.ts", type: "file" },
        {
          name: "guardian/children/[childId]/timetable/route.ts",
          type: "file",
        },
      ],
    },
    {
      name: "src/components/onboarding/schedule/",
      type: "directory",
      description: "onboarding step (order 5, optional)",
      children: [
        {
          name: "content.tsx",
          type: "file",
          description: "structure picker",
        },
        {
          name: "structure-preview.tsx",
          type: "file",
          description: "visual timeline",
        },
        {
          name: "actions.ts",
          type: "file",
          description: "getSchoolScheduleData / saveScheduleChoice",
        },
        { name: "config.ts", type: "file", description: "constants" },
        { name: "validation.ts", type: "file", description: "Zod schema" },
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
    item: TimetableNode
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
