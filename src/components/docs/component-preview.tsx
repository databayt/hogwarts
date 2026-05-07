// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import fs from "node:fs/promises"
import path from "node:path"
import * as React from "react"
import { AtomsIndex } from "@/registry/atoms-index"
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/docs/copy-button"

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  align?: "center" | "start" | "end"
  hideCode?: boolean
  chromeLessOnMobile?: boolean
  code?: string
}

// Server component still: it reads the source file from disk via the
// AtomsIndex registry. Highlighting itself moves to the client via
// DynamicCodeBlock (lazy shiki) so the build heap stays untouched.
export async function ComponentPreview({
  name,
  children,
  className,
  align = "center",
  hideCode = false,
  chromeLessOnMobile = false,
  code: codeProp,
  ...props
}: ComponentPreviewProps) {
  let code = codeProp

  // If name provided, fetch code from registry
  if (name && !code) {
    const item = AtomsIndex[name]
    if (item?.files?.[0]) {
      const filePath = path.join(process.cwd(), item.files[0].path)
      try {
        code = await fs.readFile(filePath, "utf-8")
        // Transform imports for user consumption
        code = code
          .replace(/^"use client"\s*\n?/m, "")
          .replace(/\/\* eslint-disable \*\/\s*\n?/g, "")
      } catch (error) {
        console.error(`Failed to read file: ${filePath}`, error)
      }
    }
  }

  return (
    <div
      className={cn(
        "group relative mt-4 mb-12 flex flex-col gap-2 rounded-lg border",
        className
      )}
      {...props}
    >
      <div data-slot="preview">
        <div
          data-align={align}
          className={cn(
            "preview flex w-full justify-center data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start",
            chromeLessOnMobile ? "sm:p-10" : "h-[450px] p-10"
          )}
        >
          {children}
        </div>
        {!hideCode && code && (
          <div
            data-slot="code"
            className="overflow-hidden [&_[data-rehype-pretty-code-figure]]:!m-0 [&_[data-rehype-pretty-code-figure]]:rounded-t-none [&_[data-rehype-pretty-code-figure]]:border-t [&_pre]:max-h-[400px]"
          >
            <ComponentCode code={code} />
          </div>
        )}
      </div>
    </div>
  )
}

function ComponentCode({ code }: { code: string }) {
  return (
    <figure data-rehype-pretty-code-figure="" className="[&>pre]:max-h-96">
      <CopyButton value={code} />
      <DynamicCodeBlock lang="tsx" code={code} />
    </figure>
  )
}
