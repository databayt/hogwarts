"use client"

import React from "react"
import { Check, Copy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Prompt } from "./prompt-types"

interface PromptTableProps {
  prompts: Prompt[]
}

export function PromptTable({ prompts }: PromptTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content)
    setCopiedId(prompt.id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const scrollToPrompt = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[120px]">Category</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[80px] text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => scrollToPrompt(prompt.id)}
                  className="text-primary text-start hover:underline"
                >
                  {prompt.name}
                </button>
              </TableCell>
              <TableCell>
                <p className="muted line-clamp-2">{prompt.description}</p>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {prompt.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    prompt.source === "command" ? "secondary" : "outline"
                  }
                  className="text-xs"
                >
                  {prompt.source}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(prompt)}
                  title="Copy prompt"
                >
                  {copiedId === prompt.id ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  <span className="sr-only">Copy</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
