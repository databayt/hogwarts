import Link from "next/link"
import { BarChart3, BookOpen, FileText, Plus, Sparkles } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function GenerateContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get stats
  let questionCount = 0
  let templateCount = 0
  let generatedExamCount = 0

  if (schoolId) {
    ;[questionCount, templateCount, generatedExamCount] = await Promise.all([
      db.questionBank.count({ where: { schoolId } }),
      db.examTemplate.count({ where: { schoolId } }),
      db.generatedExam.count({ where: { schoolId } }),
    ])
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeadingSetter
          title={dictionary.generate.pageTitle}
          description={dictionary.generate.pageDescription}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dictionary.generate.stats.questions}
              </CardTitle>
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionCount}</div>
              <p className="text-muted-foreground text-xs">
                {dictionary.generate.stats.inQuestionBank}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dictionary.generate.stats.templates}
              </CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templateCount}</div>
              <p className="text-muted-foreground text-xs">
                {dictionary.generate.stats.reusableBlueprints}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dictionary.generate.stats.generated}
              </CardTitle>
              <BarChart3 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generatedExamCount}</div>
              <p className="text-muted-foreground text-xs">
                {dictionary.generate.stats.examsCreated}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {dictionary.generate.cards.questionBank.title}
              </CardTitle>
              <CardDescription>
                {dictionary.generate.cards.questionBank.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {dictionary.generate.cards.questionBank.details}
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/${lang}/generate/questions`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {dictionary.generate.actions.viewQuestions}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/${lang}/generate/questions/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {dictionary.generate.actions.addQuestion}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {dictionary.generate.cards.aiGeneration.title}
              </CardTitle>
              <CardDescription>
                {dictionary.generate.cards.aiGeneration.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {dictionary.generate.cards.aiGeneration.details}
              </p>
              <Button asChild variant="secondary">
                <Link href={`/${lang}/generate/questions/ai-generate`}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {dictionary.generate.actions.generateWithAI}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {dictionary.generate.cards.examTemplates.title}
              </CardTitle>
              <CardDescription>
                {dictionary.generate.cards.examTemplates.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {dictionary.generate.cards.examTemplates.details}
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/${lang}/generate/templates`}>
                    <FileText className="mr-2 h-4 w-4" />
                    {dictionary.generate.actions.viewTemplates}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/${lang}/generate/templates/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {dictionary.generate.actions.createTemplate}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {dictionary.generate.cards.analytics.title}
              </CardTitle>
              <CardDescription>
                {dictionary.generate.cards.analytics.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {dictionary.generate.cards.analytics.details}
              </p>
              <Button asChild variant="outline">
                <Link href={`/${lang}/generate/analytics`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {dictionary.generate.actions.viewAnalytics}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.generate.quickStart.title}</CardTitle>
            <CardDescription>
              {dictionary.generate.quickStart.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  1
                </div>
                <div>
                  <h3 className="font-medium">
                    {dictionary.generate.quickStart.step1.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {dictionary.generate.quickStart.step1.description}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  2
                </div>
                <div>
                  <h3 className="font-medium">
                    {dictionary.generate.quickStart.step2.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {dictionary.generate.quickStart.step2.description}
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  3
                </div>
                <div>
                  <h3 className="font-medium">
                    {dictionary.generate.quickStart.step3.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {dictionary.generate.quickStart.step3.description}
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
