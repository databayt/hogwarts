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
            <div className="text-sm font-medium mb-2">{b.title}</div>
            <ul className="list-disc ps-4 text-sm text-muted-foreground space-y-1">
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
      items: ["Auth", "Business logic", "Prisma + Postgres (tenant scoped)"]
    },
  ]
  return <StackedBlocks blocks={blocks} title="High-level Blocks" />
}


