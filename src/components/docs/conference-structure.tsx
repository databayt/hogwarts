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
          description: "server list (DataTable index)",
        },
        { name: "actions.ts", type: "file", description: "barrel" },
        {
          name: "actions/",
          type: "directory",
          description: "server actions",
          children: [
            { name: "sessions.ts", type: "file", description: "lifecycle" },
            { name: "tokens.ts", type: "file", description: "join tokens" },
            { name: "recordings.ts", type: "file", description: "recordings" },
            {
              name: "notifications.ts",
              type: "file",
              description: "notifications",
            },
            { name: "settings.ts", type: "file", description: "settings" },
            { name: "moderation.ts", type: "file", description: "kick" },
            {
              name: "recurring.ts",
              type: "file",
              description: "link carry-forward",
            },
            { name: "helpers.ts", type: "file", description: "shared helpers" },
          ],
        },
        {
          name: "queries.ts",
          type: "file",
          description: "DataTable reads",
        },
        {
          name: "authorization.ts",
          type: "file",
          description: "RBAC permission matrix",
        },
        {
          name: "permissions.ts",
          type: "file",
          description: "UI gating (rich)",
        },
        {
          name: "list-permissions.ts",
          type: "file",
          description: "UI gating (listings)",
        },
        {
          name: "validation.ts",
          type: "file",
          description: "Zod (sessions)",
        },
        {
          name: "list-validation.ts",
          type: "file",
          description: "Zod (listings)",
        },
        {
          name: "columns.tsx",
          type: "file",
          description: "DataTable columns",
        },
        { name: "table.tsx", type: "file", description: "DataTable" },
        { name: "form.tsx", type: "file", description: "create form" },
        {
          name: "list-params.ts",
          type: "file",
          description: "nuqs URL cache",
        },
        {
          name: "detail.tsx",
          type: "file",
          description: "single-conference detail",
        },
        {
          name: "room.tsx",
          type: "file",
          description: "in-app LiveKit room",
        },
        {
          name: "recordings.tsx",
          type: "file",
          description: "recordings list",
        },
        {
          name: "recording-player.tsx",
          type: "file",
          description: "player",
        },
        {
          name: "network-test.tsx",
          type: "file",
          description: "LiveKit RTT/TURN + readiness diagnostic",
        },
        {
          name: "schedule-form.tsx",
          type: "file",
          description: "scheduler",
        },
        {
          name: "settings-form.tsx",
          type: "file",
          description: "admin config form",
        },
        { name: "empty-state.tsx", type: "file", description: "empty state" },
        {
          name: "loading-skeleton.tsx",
          type: "file",
          description: "loading skeleton",
        },
        { name: "types.ts", type: "file", description: "domain types" },
        {
          name: "error-map.ts",
          type: "file",
          description: "error-code → string",
        },
        {
          name: "list-actions.ts",
          type: "file",
          description: "listing actions",
        },
        {
          name: "livekit/",
          type: "directory",
          description: "SFU server lib",
          children: [
            {
              name: "client.ts",
              type: "file",
              description: "config + readiness",
            },
            { name: "token.ts", type: "file", description: "access tokens" },
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
              description: "deterministic room IDs",
            },
            {
              name: "webhook.ts",
              type: "file",
              description: "event verification",
            },
            {
              name: "__tests__/",
              type: "directory",
              description: "SFU lib tests",
            },
          ],
        },
        {
          name: "providers/",
          type: "directory",
          description: "link-provider adapters",
          children: [
            {
              name: "types.ts",
              type: "file",
              description: "adapter contract",
            },
            {
              name: "external.ts",
              type: "file",
              description: "pasted link (live)",
            },
            {
              name: "google-meet.ts",
              type: "file",
              description: "stub",
            },
            { name: "zoom.ts", type: "file", description: "stub" },
            { name: "teams.ts", type: "file", description: "stub" },
            { name: "index.ts", type: "file", description: "registry" },
            { name: "README.md", type: "file" },
          ],
        },
        {
          name: "RUNBOOK.md",
          type: "file",
          description: "LiveKit 6-gate provisioning",
        },
        {
          name: "__tests__/",
          type: "directory",
          description: "block tests",
        },
        {
          name: "README.md",
          type: "file",
          description: "feature purpose, APIs, decisions",
        },
        {
          name: "ISSUE.md",
          type: "file",
          description: "known issues and follow-ups",
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
