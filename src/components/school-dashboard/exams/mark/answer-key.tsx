// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Answer Key Display for Marking UI
// Shows correct answers alongside student submissions per question type

import type { QuestionBank } from "@prisma/client"
import { CheckCircle, FileText, Key, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MCQOption {
  text: string
  isCorrect: boolean
  explanation?: string
}

interface FillBlankOptions {
  acceptedAnswers: string[]
  caseSensitive?: boolean
}

interface AnswerKeyProps {
  question: QuestionBank
  studentAnswer?: string | null
}

function parseMCQOptions(options: unknown): MCQOption[] {
  if (!options) return []
  if (Array.isArray(options)) return options as MCQOption[]
  return []
}

function parseFillBlankOptions(options: unknown): FillBlankOptions | null {
  if (!options || Array.isArray(options)) return null
  const opt = options as Record<string, unknown>
  if (opt.acceptedAnswers && Array.isArray(opt.acceptedAnswers)) {
    return opt as unknown as FillBlankOptions
  }
  return null
}

export function AnswerKeyCell({ question, studentAnswer }: AnswerKeyProps) {
  const { questionType, options, sampleAnswer, gradingRubric } = question

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Key className="h-3.5 w-3.5" />
          Answer Key
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="text-primary h-4 w-4" />
            <h4 className="text-sm font-semibold">Answer Key</h4>
            <Badge variant="outline" className="text-xs">
              {questionType.replace("_", " ")}
            </Badge>
          </div>

          {/* MCQ / True-False */}
          {(questionType === "MULTIPLE_CHOICE" ||
            questionType === "TRUE_FALSE") && (
            <MCQAnswerKey
              options={parseMCQOptions(options)}
              studentAnswer={studentAnswer}
            />
          )}

          {/* Fill in Blank */}
          {questionType === "FILL_BLANK" && (
            <FillBlankAnswerKey
              options={parseFillBlankOptions(options)}
              studentAnswer={studentAnswer}
            />
          )}

          {/* Short Answer / Essay */}
          {(questionType === "SHORT_ANSWER" || questionType === "ESSAY") && (
            <EssayAnswerKey
              sampleAnswer={sampleAnswer}
              gradingRubric={gradingRubric}
            />
          )}

          {/* Matching */}
          {questionType === "MATCHING" && (
            <MatchingAnswerKey options={options} />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MCQAnswerKey({
  options,
  studentAnswer,
}: {
  options: MCQOption[]
  studentAnswer?: string | null
}) {
  if (options.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">No options configured</p>
    )
  }

  return (
    <div className="space-y-1.5">
      {options.map((opt, i) => {
        const isStudentChoice =
          studentAnswer?.toLowerCase() === opt.text.toLowerCase()
        return (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs ${
              opt.isCorrect
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : isStudentChoice
                  ? "bg-red-50 dark:bg-red-950/30"
                  : ""
            }`}
          >
            {opt.isCorrect ? (
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : isStudentChoice ? (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            ) : (
              <span className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0 text-center">
                {String.fromCharCode(65 + i)}
              </span>
            )}
            <span className={opt.isCorrect ? "font-medium" : ""}>
              {opt.text}
            </span>
          </div>
        )
      })}
      {options.find((o) => o.isCorrect)?.explanation && (
        <p className="text-muted-foreground border-t pt-1.5 text-xs">
          {options.find((o) => o.isCorrect)?.explanation}
        </p>
      )}
    </div>
  )
}

function FillBlankAnswerKey({
  options,
  studentAnswer,
}: {
  options: FillBlankOptions | null
  studentAnswer?: string | null
}) {
  if (!options) {
    return (
      <p className="text-muted-foreground text-xs">
        No accepted answers configured
      </p>
    )
  }

  const isCorrect = options.acceptedAnswers.some((ans) =>
    options.caseSensitive
      ? studentAnswer === ans
      : studentAnswer?.toLowerCase() === ans.toLowerCase()
  )

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">Accepted answers:</p>
      <div className="flex flex-wrap gap-1">
        {options.acceptedAnswers.map((ans, i) => (
          <Badge
            key={i}
            variant={
              studentAnswer?.toLowerCase() === ans.toLowerCase()
                ? isCorrect
                  ? "default"
                  : "destructive"
                : "secondary"
            }
            className="text-xs"
          >
            {ans}
          </Badge>
        ))}
      </div>
      {!options.caseSensitive && (
        <p className="text-muted-foreground text-xs italic">Case insensitive</p>
      )}
    </div>
  )
}

function EssayAnswerKey({
  sampleAnswer,
  gradingRubric,
}: {
  sampleAnswer?: string | null
  gradingRubric?: string | null
}) {
  if (!sampleAnswer && !gradingRubric) {
    return (
      <p className="text-muted-foreground text-xs">
        No sample answer or rubric available
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sampleAnswer && (
        <div>
          <div className="mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span className="text-xs font-medium">Sample Answer</span>
          </div>
          <p className="bg-muted/50 max-h-32 overflow-y-auto rounded-md p-2 text-xs">
            {sampleAnswer}
          </p>
        </div>
      )}
      {gradingRubric && (
        <div>
          <div className="mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span className="text-xs font-medium">Rubric</span>
          </div>
          <p className="bg-muted/50 max-h-32 overflow-y-auto rounded-md p-2 text-xs">
            {gradingRubric}
          </p>
        </div>
      )}
    </div>
  )
}

function MatchingAnswerKey({ options }: { options: unknown }) {
  if (!options) {
    return (
      <p className="text-muted-foreground text-xs">
        No matching pairs configured
      </p>
    )
  }

  const pairs = Array.isArray(options) ? options : []
  return (
    <div className="space-y-1">
      {pairs.map((pair: { left?: string; right?: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            {pair.left || `Item ${i + 1}`}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="secondary" className="text-xs">
            {pair.right || `Match ${i + 1}`}
          </Badge>
        </div>
      ))}
    </div>
  )
}
