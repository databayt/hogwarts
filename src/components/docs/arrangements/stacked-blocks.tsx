"use client"

type Block = {
  title: string
  items: string[]
}

export function StackedBlocks({
  blocks,
  title = "System Blocks",
}: {
  blocks: Block[]
  title?: string
}) {
  return (
    <div className="pb-10">
      {/* <div className="mb-4 text-lg font-medium">{title}</div> */}
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-md border p-4">
            <div className="mb-2 text-sm font-medium">{b.title}</div>
            <ul className="text-muted-foreground list-disc space-y-1 ps-4 text-sm">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DefaultStackedBlocks() {
  const blocks: Block[] = [
    {
      title: "Public Layer",
      items: ["Marketing website", "School landing per domain"],
    },
    {
      title: "App Layer",
      items: ["Core app (role dashboards)", "Server Actions / API"],
    },
    {
      title: "Shared Core",
      items: ["Auth", "Business logic", "Prisma + Postgres (tenant scoped)"],
    },
  ]
  return <StackedBlocks blocks={blocks} title="High-level Blocks" />
}
