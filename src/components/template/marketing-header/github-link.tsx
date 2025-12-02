import { Suspense } from "react"
import Link from "next/link"

import { siteConfig } from "./config"
import { Icons } from "./icons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function GitHubLink() {
  return (
    <Button asChild size="sm" variant="ghost" className="h-8 shadow-none">
      <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
        <Icons.gitHub />
        <Suspense fallback={<Skeleton className="h-4 w-8" />}>
          <StarsCount />
        </Suspense>
      </Link>
    </Button>
  )
}

async function StarsCount() {
  try {
    const res = await fetch("https://api.github.com/repos/databayt/hogwarts", {
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return <span className="text-muted-foreground text-xs">0</span>
    }

    const json = await res.json()
    const count = json.stargazers_count ?? 0

    const formattedCount =
      count >= 1000
        ? count % 1000 === 0
          ? `${Math.floor(count / 1000)}k`
          : `${(count / 1000).toFixed(1)}k`
        : count.toLocaleString()

    return (
      <span className="text-muted-foreground w-fit text-xs tabular-nums">
        {formattedCount.replace(".0k", "k")}
      </span>
    )
  } catch {
    return <span className="text-muted-foreground text-xs">0</span>
  }
}
