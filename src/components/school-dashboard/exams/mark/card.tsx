"use client"

// Question Card Component
import Link from "next/link"
import type { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"
import {
  Copy,
  EllipsisVertical,
  Eye,
  FileText,
  Pencil,
  Trash,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { QUESTION_TYPES } from "./config"

interface QuestionCardProps {
  id: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  subjectName: string
  tags?: string[]
  usageCount?: number
  averageScore?: number
  hasRubric?: boolean
  dictionary: Dictionary
  locale: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  onPreview?: (id: string) => void
}

export function QuestionCard({
  id,
  questionText,
  questionType,
  difficulty,
  bloomLevel,
  points,
  subjectName,
  tags = [],
  usageCount = 0,
  averageScore,
  hasRubric = false,
  dictionary,
  locale,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
}: QuestionCardProps) {
  const dict = dictionary.marking
  const questionTypeConfig = QUESTION_TYPES[questionType]

  const difficultyKey = difficulty.toLowerCase() as keyof typeof dict.difficulty
  const bloomKey = bloomLevel.toLowerCase() as keyof typeof dict.bloomLevels
  const typeKey = questionType as keyof typeof dict.questionTypes

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Type and Difficulty Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {dict.questionTypes[typeKey]}
              </Badge>
              <Badge
                variant={
                  difficulty === "EASY"
                    ? "default"
                    : difficulty === "MEDIUM"
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs"
              >
                {dict.difficulty[difficultyKey]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {dict.bloomLevels[bloomKey]}
              </Badge>
              {hasRubric && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="mr-1 h-3 w-3" />
                  {dict.rubric.title}
                </Badge>
              )}
            </div>

            {/* Question Text */}
            <p className="text-foreground line-clamp-2 text-sm font-medium">
              {questionText}
            </p>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {dict.buttons.viewAnswer}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {dict.buttons.editQuestion}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {dict.buttons.deleteQuestion}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Metadata */}
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <span>{subjectName}</span>
          <span>
            {points.toString()} {dict.questionBank.points}
          </span>
          {usageCount > 0 && (
            <span>
              {usageCount} {usageCount === 1 ? "use" : "uses"}
            </span>
          )}
          {averageScore !== undefined && (
            <span>Avg: {Math.round(averageScore)}%</span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/${locale}/exams/mark/questions/${id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
