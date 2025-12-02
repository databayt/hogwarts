"use client"

// Question Card Component

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pencil, Trash, Copy, Eye, EllipsisVertical, FileText } from "lucide-react";
import Link from "next/link"
import type { QuestionType, DifficultyLevel, BloomLevel } from "@prisma/client"
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
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Type and Difficulty Badges */}
            <div className="flex items-center gap-2 flex-wrap">
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
                  <FileText className="h-3 w-3 mr-1" />
                  {dict.rubric.title}
                </Badge>
              )}
            </div>

            {/* Question Text */}
            <p className="text-sm font-medium line-clamp-2 text-foreground">
              {questionText}
            </p>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {dict.buttons.viewAnswer}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {dict.buttons.editQuestion}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {dict.buttons.deleteQuestion}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
          <div className="flex items-center gap-1 mt-2 flex-wrap">
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
