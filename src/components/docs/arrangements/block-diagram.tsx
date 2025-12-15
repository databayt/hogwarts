"use client"

import { Badge } from "@/components/ui/badge"

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

interface Section {
  title: string
  items: string[]
}

export function BuildingBlocks({
  sections,
  title = "Building Blocks",
}: {
  sections: Section[]
  title?: string
}) {
  return (
    <div className="">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="text-muted-foreground text-xs">{section.title}</div>
            {chunk(section.items, 3).map((row, rowIdx) => (
              <div
                key={`${section.title}-row-${rowIdx}`}
                className="flex gap-2"
              >
                {row.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="w-auto px-2 py-1 text-xs font-normal"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-muted-foreground mt-4 text-xs">
        Theme and assets are applied per school domain at runtime; all data
        remains centrally stored and scoped by schoolId.
      </div>
    </div>
  )
}

export function LowLevelBlockDiagram() {
  const sections: Section[] = [
    {
      title: "UI",
      items: ["Theme", "shadcn", "Blocks"],
    },
    {
      title: "Apps",
      items: ["Operator", "School", "Marketing", "Landing"],
    },
    {
      title: "Onboarding",
      items: ["Create", "Invite", "Seed", "Branding", "Setup"],
    },
    {
      title: "Tables",
      items: ["Table", "Filters", "Paging"],
    },
    {
      title: "Auth",
      items: ["Auth", "Gates", "Session"],
    },
    {
      title: "I18n",
      items: ["Arabic", "English", "Locale", "RTL"],
    },
    {
      title: "Domains",
      items: ["Subdomain", "Custom"],
    },
    {
      title: "Billing",
      items: ["Trials", "Receipts", "Invoices"],
    },
    {
      title: "Ops",
      items: ["Logs", "Errors", "Metrics", "Runbooks"],
    },
    {
      title: "Backups",
      items: ["Daily", "Retention", "Restores"],
    },
    {
      title: "Database",
      items: ["Neon", "Prisma", "Tenancy", "Indexes"],
    },
    {
      title: "Server",
      items: ["Actions", "Zod", "Revalidate"],
    },
    {
      title: "Patterns",
      items: ["shadcn", "ESLint", "pnpm", "CI"],
    },
    {
      title: "Community",
      items: ["Contribute", "Conduct", "Changelog", "Roadmap"],
    },
  ]

  return <BuildingBlocks sections={sections} title="Building Blocks" />
}

// Backward-compatible export (alias) if still imported elsewhere
export function BlockDiagram() {
  return <LowLevelBlockDiagram />
}
