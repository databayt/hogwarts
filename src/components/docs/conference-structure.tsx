"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { File, Folder } from "lucide-react"

interface ConferenceNode {
  name: string
  type: "file" | "directory"
  description?: string
  children?: ConferenceNode[]
}

interface ConferenceStructureProps {
  className?: string
}

export function ConferenceStructure({ className }: ConferenceStructureProps) {
  const nodes: ConferenceNode[] = [
    {
      name: "src/components/school-dashboard/conference/",
      type: "directory",
      description: "one block, mirrored 1:1 to /conference",
      children: [
        {
          name: "content.tsx",
          type: "file",
          description: "server list (fetch + batched translate → table)",
        },
        {
          name: "queries.ts",
          type: "file",
          description: "read-only Prisma builders",
        },
        {
          name: "actions.ts",
          type: "file",
          description: "server-action barrel",
        },
        {
          name: "list-actions.ts",
          type: "file",
          description: "list-layer CRUD (create/update/delete/list)",
        },
        {
          name: "actions/",
          type: "directory",
          description: "rich sessions-layer server actions",
          children: [
            {
              name: "helpers.ts",
              type: "file",
              description: "requireContext · canAccessSession",
            },
            {
              name: "sessions.ts",
              type: "file",
              description: "lifecycle state machine",
            },
            {
              name: "tokens.ts",
              type: "file",
              description: "join → 5-min JWT",
            },
            {
              name: "recordings.ts",
              type: "file",
              description: "list / signed-URL / delete",
            },
            {
              name: "notifications.ts",
              type: "file",
              description: "5 events → notification hub (in-app + email)",
            },
            {
              name: "attendance-sync.ts",
              type: "file",
              description: "presence → attendance (opt-in, LiveKit-only)",
            },
            {
              name: "settings.ts",
              type: "file",
              description: "capacity + recording + attendance-sync opt-in",
            },
            {
              name: "moderation.ts",
              type: "file",
              description: "kickParticipant",
            },
            {
              name: "recurring.ts",
              type: "file",
              description: "link carry-forward across terms",
            },
          ],
        },
        {
          name: "authorization.ts",
          type: "file",
          description: "PERMISSION_MATRIX (strict RBAC)",
        },
        {
          name: "permissions.ts",
          type: "file",
          description: "UI gating (rich layer)",
        },
        {
          name: "list-permissions.ts",
          type: "file",
          description: "UI gating + CRUD guards (list layer)",
        },
        { name: "validation.ts", type: "file", description: "Zod (sessions)" },
        {
          name: "list-validation.ts",
          type: "file",
          description: "Zod (table)",
        },
        { name: "list-params.ts", type: "file", description: "nuqs URL cache" },
        { name: "table.tsx", type: "file", description: "DataTable + grid" },
        {
          name: "columns.tsx",
          type: "file",
          description: "column defs + action menu",
        },
        {
          name: "form.tsx",
          type: "file",
          description: "create/edit 5-step wizard (modal)",
        },
        {
          name: "form-steps.tsx",
          type: "file",
          description:
            "wizard steps: basics · schedule · meeting · references · access",
        },
        {
          name: "schedule-form.tsx",
          type: "file",
          description: "standalone scheduler",
        },
        {
          name: "settings-form.tsx",
          type: "file",
          description: "admin school-policy form",
        },
        {
          name: "section-recording-policy.tsx",
          type: "file",
          description: "per-section recording opt-out",
        },
        {
          name: "detail.tsx",
          type: "file",
          description: "single-session detail",
        },
        { name: "room.tsx", type: "file", description: "in-app LiveKit room" },
        {
          name: "participants-panel.tsx",
          type: "file",
          description: "HOST/CO_HOST in-room kick UI",
        },
        {
          name: "recordings.tsx",
          type: "file",
          description: "recordings list",
        },
        {
          name: "recording-player.tsx",
          type: "file",
          description: "lazy signed-URL player",
        },
        {
          name: "network-test.tsx",
          type: "file",
          description: "LiveKit RTT/ICE diagnostic",
        },
        { name: "empty-state.tsx", type: "file", description: "empty state" },
        {
          name: "loading-skeleton.tsx",
          type: "file",
          description: "loading skeleton",
        },
        {
          name: "types.ts",
          type: "file",
          description: "domain types + RoomJoinTicket",
        },
        {
          name: "error-map.ts",
          type: "file",
          description: "error-code → string",
        },
        {
          name: "network-protocol.ts",
          type: "file",
          description: "pure ICE-path classifier",
        },
        {
          name: "livekit/",
          type: "directory",
          description: "SFU server SDK wrappers",
          children: [
            {
              name: "client.ts",
              type: "file",
              description: "singletons + readiness",
            },
            {
              name: "token.ts",
              type: "file",
              description: "role → VideoGrant",
            },
            { name: "rooms.ts", type: "file", description: "room lifecycle" },
            {
              name: "egress.ts",
              type: "file",
              description: "recording egress",
            },
            {
              name: "recording-urls.ts",
              type: "file",
              description: "signed S3 URLs",
            },
            {
              name: "room-naming.ts",
              type: "file",
              description: "sch-{schoolId}-lc-{id}",
            },
            {
              name: "webhook.ts",
              type: "file",
              description: "HMAC verify + idempotent router",
            },
          ],
        },
        {
          name: "providers/",
          type: "directory",
          description: "link-provider adapters",
          children: [
            { name: "types.ts", type: "file", description: "adapter contract" },
            {
              name: "external.ts",
              type: "file",
              description: "pasted link (live)",
            },
            {
              name: "google-meet.ts",
              type: "file",
              description: "wired, dark",
            },
            { name: "zoom.ts", type: "file", description: "wired, dark" },
            { name: "teams.ts", type: "file", description: "wired, dark" },
            {
              name: "token-cache.ts",
              type: "file",
              description: "OAuth token cache",
            },
            { name: "index.ts", type: "file", description: "registry" },
            {
              name: "README.md",
              type: "file",
              description: "provisioning reference",
            },
          ],
        },
        {
          name: "RUNBOOK.md",
          type: "file",
          description: "LiveKit 6-gate provisioning",
        },
        {
          name: "README.md",
          type: "file",
          description: "feature purpose, routes, status",
        },
        {
          name: "ISSUE.md",
          type: "file",
          description: "open backlog and follow-ups",
        },
        {
          name: "CLAUDE.md",
          type: "file",
          description: "block-level context",
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
    item: ConferenceNode
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
