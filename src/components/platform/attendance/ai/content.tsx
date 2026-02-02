/**
 * AI Attendance Content
 *
 * Main UI for AI-powered attendance predictions and analytics.
 */
"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import {
  createInterventionFromRecommendation,
  getAtRiskStudents,
  runRiskPredictions,
  translateMessage,
} from "./actions"
import {
  RISK_LEVELS,
  type AtRiskStudent,
  type PredictionSummary,
} from "./validation"

interface AIContentProps {
  locale: string
}

export function AIContent({ locale }: AIContentProps) {
  const isRTL = locale === "ar"
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningPredictions, setIsRunningPredictions] = useState(false)
  const [students, setStudents] = useState<AtRiskStudent[]>([])
  const [summary, setSummary] = useState<PredictionSummary | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(
    null
  )
  const [activeTab, setActiveTab] = useState("predictions")

  // Translation state
  const [translateInput, setTranslateInput] = useState("")
  const [translateOutput, setTranslateOutput] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [targetLang, setTargetLang] = useState<"ar" | "en">(isRTL ? "en" : "ar")

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const result = await getAtRiskStudents()

    if (result.success && result.data) {
      const data = result.data as {
        students: AtRiskStudent[]
        summary: PredictionSummary
      }
      setStudents(data.students)
      setSummary(data.summary)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRunPredictions = async () => {
    setIsRunningPredictions(true)
    const result = await runRiskPredictions()

    if (result.success && result.data) {
      const data = result.data as {
        students: AtRiskStudent[]
        summary: PredictionSummary
      }
      setStudents(data.students)
      setSummary(data.summary)
    }
    setIsRunningPredictions(false)
  }

  const handleCreateIntervention = async (
    studentId: string,
    recommendation: string
  ) => {
    const result = await createInterventionFromRecommendation(
      studentId,
      recommendation
    )
    if (result.success) {
      loadData()
      setSelectedStudent(null)
    }
  }

  const handleTranslate = async () => {
    if (!translateInput.trim()) return

    setIsTranslating(true)
    const result = await translateMessage({
      message: translateInput,
      targetLanguage: targetLang,
      context: "School attendance communication",
    })

    if (result.success && result.data) {
      setTranslateOutput(
        (result.data as { translatedText: string }).translatedText
      )
    }
    setIsTranslating(false)
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-500 text-white"
      case "HIGH":
        return "bg-orange-500 text-white"
      case "MODERATE":
        return "bg-yellow-500 text-black"
      default:
        return "bg-green-500 text-white"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "تحليلات الذكاء الاصطناعي" : "AI Analytics"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL
              ? "التنبؤ بالمخاطر والترجمة التلقائية"
              : "Risk predictions and auto-translation"}
          </p>
        </div>
        <Button onClick={handleRunPredictions} disabled={isRunningPredictions}>
          {isRunningPredictions
            ? isRTL
              ? "جاري التحليل..."
              : "Analyzing..."
            : isRTL
              ? "تشغيل التنبؤات"
              : "Run Predictions"}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? "إجمالي المعرضين للخطر" : "Total At-Risk"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                {RISK_LEVELS.CRITICAL.label[isRTL ? "ar" : "en"]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {summary.critical}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                {RISK_LEVELS.HIGH.label[isRTL ? "ar" : "en"]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">
                {summary.high}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">
                {RISK_LEVELS.MODERATE.label[isRTL ? "ar" : "en"]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {summary.moderate}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? "متوسط المخاطر" : "Avg. Risk Score"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.averageRiskScore.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predictions">
            {isRTL ? "تنبؤات المخاطر" : "Risk Predictions"}
          </TabsTrigger>
          <TabsTrigger value="translator">
            {isRTL ? "الترجمة التلقائية" : "Auto-Translation"}
          </TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="mt-4">
          {students.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {isRTL
                    ? "لا يوجد طلاب معرضين للخطر حالياً"
                    : "No at-risk students currently"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleRunPredictions}
                >
                  {isRTL ? "تشغيل التنبؤات" : "Run Predictions"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <Card
                  key={student.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedStudent?.id === student.id && "ring-primary ring-2"
                  )}
                  onClick={() =>
                    setSelectedStudent(
                      selectedStudent?.id === student.id ? null : student
                    )
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Photo */}
                        <div className="bg-muted h-12 w-12 overflow-hidden rounded-full">
                          {student.profilePhotoUrl ? (
                            <Image
                              src={student.profilePhotoUrl}
                              alt={student.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg">
                              {student.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {student.grNumber} • {student.yearLevel}
                          </p>
                        </div>
                      </div>

                      {/* Risk score and level */}
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="mb-1 flex justify-between text-sm">
                            <span>{isRTL ? "المخاطر" : "Risk"}</span>
                            <span className="font-bold">
                              {student.riskScore}%
                            </span>
                          </div>
                          <Progress
                            value={student.riskScore}
                            className={cn(
                              "h-2",
                              student.riskLevel === "CRITICAL" &&
                                "[&>div]:bg-red-500",
                              student.riskLevel === "HIGH" &&
                                "[&>div]:bg-orange-500",
                              student.riskLevel === "MODERATE" &&
                                "[&>div]:bg-yellow-500"
                            )}
                          />
                        </div>

                        <Badge className={getRiskBadgeColor(student.riskLevel)}>
                          {
                            RISK_LEVELS[student.riskLevel].label[
                              isRTL ? "ar" : "en"
                            ]
                          }
                        </Badge>

                        {student.hasActiveIntervention && (
                          <Badge variant="outline">
                            {isRTL ? "تدخل نشط" : "Active"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {selectedStudent?.id === student.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Stats */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-muted-foreground text-sm">
                              {isRTL ? "نسبة الغياب" : "Absence Rate"}
                            </p>
                            <p className="text-lg font-bold">
                              {student.absenceRate}%
                            </p>
                          </div>
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-muted-foreground text-sm">
                              {isRTL
                                ? "الغياب المتوقع (30 يوم)"
                                : "Predicted (30d)"}
                            </p>
                            <p className="text-lg font-bold">
                              {student.predictedAbsences30Days}{" "}
                              {isRTL ? "يوم" : "days"}
                            </p>
                          </div>
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-muted-foreground text-sm">
                              {isRTL ? "الثقة" : "Confidence"}
                            </p>
                            <p className="text-lg font-bold">
                              {(student.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {/* Risk factors */}
                        {student.factors.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-medium">
                              {isRTL ? "عوامل الخطر" : "Risk Factors"}
                            </p>
                            <div className="space-y-2">
                              {student.factors.map((factor, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "rounded-lg p-2 text-sm",
                                    factor.impact === "high" &&
                                      "bg-red-50 text-red-700",
                                    factor.impact === "medium" &&
                                      "bg-yellow-50 text-yellow-700",
                                    factor.impact === "low" &&
                                      "bg-green-50 text-green-700"
                                  )}
                                >
                                  <strong>{factor.factor}:</strong>{" "}
                                  {factor.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {student.recommendations.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-medium">
                              {isRTL ? "التوصيات" : "Recommended Interventions"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {student.recommendations.map((rec, i) => (
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCreateIntervention(student.id, rec)
                                  }}
                                >
                                  {rec}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Translation Tab */}
        <TabsContent value="translator" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? "ترجمة الرسائل" : "Message Translation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-muted-foreground mb-2 block text-sm">
                  {isRTL ? "النص المصدر" : "Source Text"}
                </label>
                <Textarea
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                  placeholder={
                    isRTL
                      ? "أدخل النص للترجمة..."
                      : "Enter text to translate..."
                  }
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() =>
                    setTargetLang(targetLang === "ar" ? "en" : "ar")
                  }
                  variant="outline"
                >
                  {isRTL
                    ? `ترجمة إلى: ${targetLang === "ar" ? "العربية" : "الإنجليزية"}`
                    : `Translate to: ${targetLang === "ar" ? "Arabic" : "English"}`}
                </Button>
                <Button onClick={handleTranslate} disabled={isTranslating}>
                  {isTranslating
                    ? isRTL
                      ? "جاري الترجمة..."
                      : "Translating..."
                    : isRTL
                      ? "ترجمة"
                      : "Translate"}
                </Button>
              </div>

              {translateOutput && (
                <div>
                  <label className="text-muted-foreground mb-2 block text-sm">
                    {isRTL ? "الترجمة" : "Translation"}
                  </label>
                  <Textarea
                    value={translateOutput}
                    readOnly
                    rows={4}
                    className="bg-muted"
                    dir={targetLang === "ar" ? "rtl" : "ltr"}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
