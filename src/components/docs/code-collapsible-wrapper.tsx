"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import type { getDictionary } from "@/components/internationalization/dictionaries"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export function CodeCollapsibleWrapper({
  className,
  children,
  dictionary,
  ...props
}: React.ComponentProps<typeof Collapsible> & { dictionary?: Dictionary }) {
  const [isOpened, setIsOpened] = React.useState(false)
  const expandText = dictionary?.docs?.expand || "Expand"
  const collapseText = dictionary?.docs?.collapse || "Collapse"

  return (
    <Collapsible
      open={isOpened}
      onOpenChange={setIsOpened}
      className={cn("group/collapsible relative md:-mx-1", className)}
      {...props}
    >
      <CollapsibleTrigger asChild>
        <div className="absolute top-1.5 end-9 z-10 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 rounded-md px-2"
          >
            {isOpened ? collapseText : expandText}
          </Button>
          <Separator orientation="vertical" className="mx-1.5 !h-4" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        className="relative mt-6 overflow-hidden data-[state=closed]:max-h-64 [&>figure]:mt-0 [&>figure]:md:!mx-0"
      >
        {children}
      </CollapsibleContent>
      <CollapsibleTrigger className="from-code/70 to-code text-muted-foreground absolute inset-x-0 -bottom-2 flex h-20 items-center justify-center rounded-b-lg bg-gradient-to-b text-sm group-data-[state=open]/collapsible:hidden">
        {isOpened ? collapseText : expandText}
      </CollapsibleTrigger>
    </Collapsible>
  )
}
