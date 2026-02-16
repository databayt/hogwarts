"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { deleteCatalogQuestion } from "./question-actions"

export interface CatalogQuestionRow {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  approvalStatus: string
  visibility: string
  usageCount: number
  averageScore: number
  qualityScore: number
  status: string
  tags: string[]
  createdAt: Date
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

function getApprovalVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

function getDifficultyVariant(
  difficulty: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (difficulty) {
    case "EASY":
      return "secondary"
    case "MEDIUM":
      return "default"
    case "HARD":
      return "destructive"
    default:
      return "outline"
  }
}

export const questionColumns: ColumnDef<CatalogQuestionRow>[] = [
  {
    accessorKey: "questionText",
    header: "Question",
    cell: ({ row }) => {
      const text = row.original.questionText
      return (
        <span className="max-w-[300px] truncate font-medium" title={text}>
          {truncateText(text, 80)}
        </span>
      )
    },
  },
  {
    accessorKey: "questionType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.questionType
      return (
        <Badge variant="outline" className="text-xs">
          {type.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => {
      const difficulty = row.original.difficulty
      return (
        <Badge variant={getDifficultyVariant(difficulty)} className="text-xs">
          {difficulty}
        </Badge>
      )
    },
  },
  {
    accessorKey: "bloomLevel",
    header: "Bloom Level",
    cell: ({ row }) => {
      const level = row.original.bloomLevel
      return (
        <Badge variant="outline" className="text-xs">
          {level}
        </Badge>
      )
    },
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => {
      const status = row.original.approvalStatus
      return (
        <Badge variant={getApprovalVariant(status)} className="text-xs">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "usageCount",
    header: "Usage",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original

      async function handleDelete() {
        if (!confirm("Are you sure you want to delete this question?")) return
        await deleteCatalogQuestion(id)
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
