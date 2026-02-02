/**
 * Compliance Letters Content
 *
 * UI for generating and managing attendance compliance letters.
 */
"use client"

import { useCallback, useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  bulkGenerateLetters,
  getStudentsNeedingLetters,
  previewLetter,
} from "./actions"
import {
  letterTemplates,
  letterTypes,
  type DeliveryMethod,
  type LetterType,
} from "./validation"

interface StudentForLetter {
  id: string
  name: string
  grNumber: string | null
  yearLevel?: string
  absenceRate: number
  absentDays: number
  totalDays: number
  guardianEmail?: string | null
  hasGuardianEmail: boolean
}

const letterTypeLabels: Record<LetterType, { en: string; ar: string }> = {
  ATTENDANCE_NOTICE_1: { en: "First Notice", ar: "الإشعار الأول" },
  ATTENDANCE_NOTICE_2: { en: "Second Notice", ar: "الإشعار الثاني" },
  ATTENDANCE_NOTICE_3: { en: "Final Notice", ar: "الإشعار النهائي" },
  TRUANCY_WARNING: { en: "Truancy Warning", ar: "تحذير التغيب" },
  ATTENDANCE_CONTRACT: { en: "Attendance Contract", ar: "عقد الحضور" },
  ATTENDANCE_IMPROVEMENT: { en: "Improvement Recognition", ar: "تقدير التحسن" },
  PERFECT_ATTENDANCE: { en: "Perfect Attendance", ar: "الحضور المثالي" },
}

const tierColors: Record<string, string> = {
  TIER_1: "bg-green-100 text-green-700",
  TIER_2: "bg-yellow-100 text-yellow-700",
  TIER_3: "bg-red-100 text-red-700",
}

interface LettersContentProps {
  locale: string
}

export function LettersContent({ locale }: LettersContentProps) {
  const isRTL = locale === "ar"
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLetterType, setSelectedLetterType] = useState<LetterType | "">(
    ""
  )
  const [students, setStudents] = useState<StudentForLetter[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  )
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("EMAIL")

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<StudentForLetter | null>(
    null
  )
  const [previewContent, setPreviewContent] = useState<{
    subject: string
    body: string
  } | null>(null)

  // Sending state
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    succeeded: number
    failed: number
  } | null>(null)

  const loadStudents = useCallback(async () => {
    if (!selectedLetterType) {
      setStudents([])
      return
    }

    setIsLoading(true)
    const result = await getStudentsNeedingLetters(selectedLetterType)
    if (result.success && result.data) {
      setStudents(result.data as StudentForLetter[])
    }
    setIsLoading(false)
    setSelectedStudents(new Set())
  }, [selectedLetterType])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const handlePreview = async (student: StudentForLetter) => {
    if (!selectedLetterType) return

    const result = await previewLetter(
      student.id,
      selectedLetterType,
      isRTL ? "ar" : "en"
    )

    if (result.success && result.data) {
      const data = result.data as { subject: string; body: string }
      setPreviewStudent(student)
      setPreviewContent({ subject: data.subject, body: data.body })
      setPreviewOpen(true)
    }
  }

  const handleSendLetters = async () => {
    if (!selectedLetterType || selectedStudents.size === 0) return

    setIsSending(true)
    const result = await bulkGenerateLetters(
      Array.from(selectedStudents),
      selectedLetterType,
      deliveryMethod
    )

    if (result.success && result.data) {
      const data = result.data as { succeeded: number; failed: number }
      setSendResult(data)
      loadStudents() // Refresh list
    }
    setIsSending(false)
  }

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id)))
    }
  }

  const template = selectedLetterType
    ? letterTemplates[selectedLetterType]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isRTL ? "رسائل الحضور" : "Attendance Letters"}
        </h1>
        <p className="text-muted-foreground">
          {isRTL
            ? "إنشاء وإرسال رسائل الامتثال للحضور"
            : "Generate and send attendance compliance letters"}
        </p>
      </div>

      {/* Letter Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRTL ? "اختر نوع الرسالة" : "Select Letter Type"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedLetterType}
            onValueChange={(v) => setSelectedLetterType(v as LetterType)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isRTL ? "اختر نوع الرسالة..." : "Choose letter type..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {letterTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={tierColors[letterTemplates[type].tier]}
                    >
                      {letterTemplates[type].tier.replace("_", " ")}
                    </Badge>
                    {letterTypeLabels[type][isRTL ? "ar" : "en"]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {template && (
            <div className={cn("rounded-lg p-4", tierColors[template.tier])}>
              <p className="text-sm">
                {isRTL
                  ? `هذه الرسالة للطلاب بنسبة غياب ${template.tier === "TIER_1" ? "أقل من 10%" : template.tier === "TIER_2" ? "10-19%" : "20% أو أكثر"}`
                  : `This letter is for students with ${template.tier === "TIER_1" ? "<10%" : template.tier === "TIER_2" ? "10-19%" : "20%+"} absence rate`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      {selectedLetterType && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isRTL ? "الطلاب المؤهلون" : "Eligible Students"}
              <Badge variant="secondary" className="ms-2">
                {students.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={deliveryMethod}
                onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">
                    {isRTL ? "بريد إلكتروني" : "Email"}
                  </SelectItem>
                  <SelectItem value="PRINT">
                    {isRTL ? "طباعة" : "Print"}
                  </SelectItem>
                  <SelectItem value="PORTAL">
                    {isRTL ? "البوابة" : "Portal"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSendLetters}
                disabled={selectedStudents.size === 0 || isSending}
              >
                {isSending
                  ? isRTL
                    ? "جاري الإرسال..."
                    : "Sending..."
                  : isRTL
                    ? `إرسال (${selectedStudents.size})`
                    : `Send (${selectedStudents.size})`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {isRTL
                  ? "لا يوجد طلاب يحتاجون هذه الرسالة"
                  : "No students need this letter"}
              </p>
            ) : (
              <div className="space-y-2">
                {/* Select all header */}
                <div className="flex items-center gap-3 border-b pb-2">
                  <Checkbox
                    checked={selectedStudents.size === students.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-muted-foreground text-sm">
                    {isRTL ? "تحديد الكل" : "Select all"}
                  </span>
                </div>

                {/* Student rows */}
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={cn(
                      "hover:bg-accent flex items-center justify-between rounded-lg p-3 transition-colors",
                      selectedStudents.has(student.id) && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {student.grNumber} • {student.yearLevel}
                          {!student.hasGuardianEmail && (
                            <span className="text-destructive ms-2">
                              {isRTL ? "(لا يوجد بريد)" : "(No email)"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="font-bold text-red-600">
                          {student.absenceRate}%
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {student.absentDays}/{student.totalDays}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(student)}
                      >
                        {isRTL ? "معاينة" : "Preview"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Send Result */}
      {sendResult && (
        <Card className="border-green-500">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p>
                {isRTL
                  ? `تم إرسال ${sendResult.succeeded} رسالة بنجاح`
                  : `Successfully sent ${sendResult.succeeded} letters`}
                {sendResult.failed > 0 && (
                  <span className="text-destructive ms-2">
                    ({sendResult.failed} {isRTL ? "فشل" : "failed"})
                  </span>
                )}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSendResult(null)}
              >
                {isRTL ? "إغلاق" : "Dismiss"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? "معاينة الرسالة" : "Letter Preview"}
            </DialogTitle>
            <DialogDescription>{previewStudent?.name}</DialogDescription>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground mb-1 text-sm">
                  {isRTL ? "الموضوع:" : "Subject:"}
                </p>
                <p className="font-medium">{previewContent.subject}</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground mb-2 text-sm">
                  {isRTL ? "المحتوى:" : "Body:"}
                </p>
                <pre className="font-sans text-sm whitespace-pre-wrap">
                  {previewContent.body}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              {isRTL ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
