"use client"

// All Questions List View with Advanced Filtering
import { useMemo, useState } from "react"
import Link from "next/link"
import type {
  BloomLevel,
  DifficultyLevel,
  QuestionType,
  Rubric,
} from "@prisma/client"
import { ListFilter, Plus, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { QuestionCard } from "./card"

interface Question {
  id: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  subject: { subjectName: string }
  tags?: string[]
  rubrics?: Rubric[]
  _count?: {
    examQuestions: number
    studentAnswers: number
  }
}

interface AllQuestionsProps {
  questions: Question[]
  dictionary: Dictionary
  locale: string
}

export function AllQuestions({
  questions,
  dictionary,
  locale,
}: AllQuestionsProps) {
  const dict = dictionary.marking
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<QuestionType | "ALL">("ALL")
  const [difficultyFilter, setDifficultyFilter] = useState<
    DifficultyLevel | "ALL"
  >("ALL")
  const [bloomFilter, setBloomFilter] = useState<BloomLevel | "ALL">("ALL")
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL")
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique subjects
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(questions.map((q) => q.subject.subjectName))
    return Array.from(uniqueSubjects)
  }, [questions])

  // ListFilter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Text search
      if (
        searchQuery &&
        !q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Type filter
      if (typeFilter !== "ALL" && q.questionType !== typeFilter) {
        return false
      }

      // Difficulty filter
      if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) {
        return false
      }

      // Bloom's level filter
      if (bloomFilter !== "ALL" && q.bloomLevel !== bloomFilter) {
        return false
      }

      // Subject filter
      if (subjectFilter !== "ALL" && q.subject.subjectName !== subjectFilter) {
        return false
      }

      return true
    })
  }, [
    questions,
    searchQuery,
    typeFilter,
    difficultyFilter,
    bloomFilter,
    subjectFilter,
  ])

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("ALL")
    setDifficultyFilter("ALL")
    setBloomFilter("ALL")
    setSubjectFilter("ALL")
  }

  const activeFiltersCount =
    (typeFilter !== "ALL" ? 1 : 0) +
    (difficultyFilter !== "ALL" ? 1 : 0) +
    (bloomFilter !== "ALL" ? 1 : 0) +
    (subjectFilter !== "ALL" ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{dict.questionBank.title}</h2>
          <p className="text-muted-foreground text-sm">
            {filteredQuestions.length} of {questions.length} questions
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/exams/mark/questions/create`}>
            <Plus className="mr-2 h-4 w-4" />
            {dict.buttons.newQuestion}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={dict.table.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* ListFilter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <ListFilter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* ListFilter Controls */}
        {showFilters && (
          <div className="bg-muted/50 grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-4">
            {/* Type ListFilter */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {dict.questionForm.questionType}
              </label>
              <Select
                value={typeFilter}
                onValueChange={(value) =>
                  setTypeFilter(value as QuestionType | "ALL")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {Object.entries(dict.questionTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty ListFilter */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {dict.questionForm.difficulty}
              </label>
              <Select
                value={difficultyFilter}
                onValueChange={(value) =>
                  setDifficultyFilter(value as DifficultyLevel | "ALL")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  {Object.entries(dict.difficulty).map(([key, label]) => (
                    <SelectItem key={key} value={key.toUpperCase()}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bloom's Level ListFilter */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                {dict.questionForm.bloomLevel}
              </label>
              <Select
                value={bloomFilter}
                onValueChange={(value) =>
                  setBloomFilter(value as BloomLevel | "ALL")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  {Object.entries(dict.bloomLevels).map(([key, label]) => (
                    <SelectItem key={key} value={key.toUpperCase()}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject ListFilter */}
            <div>
              <label className="mb-2 block text-sm font-medium">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              id={question.id}
              questionText={question.questionText}
              questionType={question.questionType}
              difficulty={question.difficulty}
              bloomLevel={question.bloomLevel}
              points={Number(question.points)}
              subjectName={question.subject.subjectName}
              tags={question.tags}
              usageCount={question._count?.examQuestions}
              hasRubric={question.rubrics ? question.rubrics.length > 0 : false}
              dictionary={dictionary}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {dict.questionBank.noQuestions}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/${locale}/exams/mark/questions/create`}>
              <Plus className="mr-2 h-4 w-4" />
              {dict.questionBank.createFirst}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
