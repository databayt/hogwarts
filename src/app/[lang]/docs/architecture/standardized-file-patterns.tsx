"use client"

import { Fragment } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FilePattern = {
  file: string
  purpose: string
}

const FILE_PATTERNS: FilePattern[] = [
  { file: "content.tsx", purpose: "Compose feature/page UI: headings, sections, layout orchestration." },
  { file: "action.ts", purpose: "Server actions & API calls: validate, scope tenant, mutate." },
  { file: "constant.ts", purpose: "Enums, option lists, labels, defaults for the feature." },
  { file: "validation.ts", purpose: "Zod schemas & refinements; parse and infer types." },
  { file: "type.ts", purpose: "Domain and UI types; generic helpers for forms/tables." },
  { file: "form.tsx", purpose: "Typed forms (RHF) with resolvers and submit handling." },
  { file: "card.tsx", purpose: "Card components for KPIs, summaries, quick actions." },
  { file: "all.tsx", purpose: "List view with table, filters, pagination." },
  { file: "featured.tsx", purpose: "Curated feature list showcasing selections." },
  { file: "detail.tsx", purpose: "Detail view with sections, relations, actions." },
  { file: "util.ts", purpose: "Pure utilities and mappers used in the feature." },
  { file: "column.tsx", purpose: "Typed Table column builders and cell renderers." },
  { file: "use-abc.ts", purpose: "Feature hooks: fetching, mutations, derived state." },
  { file: "README.md", purpose: "Feature README: purpose, APIs, decisions." },
  { file: "ISSUE.md", purpose: "Known issues and follow-ups for the feature." },
]

export function StandardizedFilePatterns() {
  return (
    <div>
      <Table className="w-full muted">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">File</TableHead>
            <TableHead>Purpose</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr]:border-t [&>tr:first-child]:border-0 [&>tr]:border-muted/30">
          {FILE_PATTERNS.map((item) => (
            <Fragment key={item.file}>
              <TableRow>
                <TableCell className="font-medium">
                  <span className="font-mono">{item.file}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.purpose}</TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


