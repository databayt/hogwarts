import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { siteConfig } from "./config"
import { Icons } from "./icons"

export function GitHubLink() {
  return (
    <Button
      asChild
      size="sm"
      variant="ghost"
      className="h-8 gap-1.5 px-3 shadow-none has-[>svg]:px-2.5"
    >
      <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
        <Icons.gitHub className="size-4" />
        <React.Suspense fallback={<Skeleton className="h-4 w-8" />}>
          <StarsCount />
        </React.Suspense>
      </Link>
    </Button>
  )
}

async function StarsCount() {
  try {
    const data = await fetch("https://api.github.com/repos/databayt/hogwarts", {
      next: { revalidate: 86400 },
    })
    const json = await data.json()

    // Handle API errors or missing data
    const count = json?.stargazers_count
    if (typeof count !== "number") {
      return (
        <span className="text-muted-foreground w-fit text-xs tabular-nums">
          -
        </span>
      )
    }

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
    return (
      <span className="text-muted-foreground w-fit text-xs tabular-nums">
        -
      </span>
    )
  }
}
