"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import { Shell as PageContainer } from "@/components/table/shell"

import { BOOK_GRADE_LEVELS } from "../config"
import { contributeBook } from "./actions"

interface Props {
  lang: Locale
}

const GRADE_LEVEL_LABELS: Record<string, Record<string, string>> = {
  en: {
    GENERAL: "General",
    KG: "KG",
    PRIMARY: "Primary",
    INTERMEDIATE: "Intermediate",
    SECONDARY: "Secondary",
  },
  ar: {
    GENERAL: "عام",
    KG: "رياض الأطفال",
    PRIMARY: "ابتدائي",
    INTERMEDIATE: "متوسط",
    SECONDARY: "ثانوي",
  },
}

export function ContributeBookContent({ lang }: Props) {
  const isRTL = lang === "ar"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [isbn, setIsbn] = useState("")
  const [genre, setGenre] = useState("")
  const [description, setDescription] = useState("")
  const [summary, setSummary] = useState("")
  const [coverColor, setCoverColor] = useState("#3B82F6")
  const [coverUrl, setCoverUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [gradeLevel, setGradeLevel] = useState("GENERAL")
  const [publisher, setPublisher] = useState("")
  const [publicationYear, setPublicationYear] = useState("")
  const [bookLanguage, setBookLanguage] = useState("")
  const [pageCount, setPageCount] = useState("")
  const [tags, setTags] = useState("")

  const t = {
    heading: isRTL ? "المساهمة بكتاب" : "Contribute a Book",
    subtitle: isRTL
      ? "أضف كتابًا إلى الكتالوج العالمي. سيتم مراجعته قبل النشر."
      : "Add a book to the global catalog. It will be reviewed before publishing.",
    title: isRTL ? "العنوان" : "Title",
    author: isRTL ? "المؤلف" : "Author",
    isbn: isRTL ? "رقم ISBN" : "ISBN",
    genre: isRTL ? "النوع" : "Genre",
    description: isRTL ? "الوصف" : "Description",
    summary: isRTL ? "الملخص" : "Summary",
    coverColor: isRTL ? "لون الغلاف" : "Cover Color",
    coverUrl: isRTL ? "رابط صورة الغلاف" : "Cover Image URL",
    videoUrl: isRTL ? "رابط الفيديو" : "Video URL",
    gradeLevel: isRTL ? "المرحلة الدراسية" : "Grade Level",
    publisher: isRTL ? "الناشر" : "Publisher",
    publicationYear: isRTL ? "سنة النشر" : "Publication Year",
    language: isRTL ? "لغة الكتاب" : "Language",
    pageCount: isRTL ? "عدد الصفحات" : "Page Count",
    tags: isRTL ? "الوسوم (مفصولة بفاصلة)" : "Tags (comma separated)",
    submit: isRTL ? "إرسال للمراجعة" : "Submit for Review",
    cancel: isRTL ? "إلغاء" : "Cancel",
    required: isRTL
      ? "العنوان والمؤلف والنوع مطلوبة"
      : "Title, author, and genre are required",
    success: isRTL ? "تم الإرسال للمراجعة" : "Submitted for review",
  }

  const gradeLevelLabels = GRADE_LEVEL_LABELS[lang] || GRADE_LEVEL_LABELS.en

  function handleSubmit() {
    if (!title.trim() || !author.trim() || !genre.trim()) {
      toast.error(t.required)
      return
    }

    startTransition(async () => {
      try {
        const result = await contributeBook({
          title: title.trim(),
          author: author.trim(),
          isbn: isbn.trim() || undefined,
          genre: genre.trim(),
          description: description.trim() || undefined,
          summary: summary.trim() || undefined,
          coverColor,
          coverUrl: coverUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          gradeLevel,
          publisher: publisher.trim() || undefined,
          publicationYear: publicationYear
            ? parseInt(publicationYear, 10)
            : undefined,
          language: bookLanguage.trim() || undefined,
          pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        })
        if (result.success) {
          toast.success(t.success)
          router.back()
        } else {
          toast.error(result.error || "Failed")
        }
      } catch {
        toast.error("Failed to submit")
      }
    })
  }

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>{t.heading}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Required fields */}
            <div className="space-y-2">
              <Label>{t.title} *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isRTL ? "عنوان الكتاب" : "Book title"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.author} *</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={isRTL ? "اسم المؤلف" : "Author name"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.genre} *</Label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder={
                  isRTL ? "مثال: الأدب العربي" : "e.g., Arabic Literature"
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t.gradeLevel}</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_GRADE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {gradeLevelLabels[level] || level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <Label>{t.isbn}</Label>
              <Input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t.publisher}</Label>
              <Input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder={isRTL ? "دار النشر" : "Publisher name"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.publicationYear}</Label>
              <Input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
                placeholder="2024"
                min={1000}
                max={2100}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.language}</Label>
              <Input
                value={bookLanguage}
                onChange={(e) => setBookLanguage(e.target.value)}
                placeholder={isRTL ? "العربية" : "Arabic"}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.pageCount}</Label>
              <Input
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                placeholder="320"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.coverColor}</Label>
              <Input
                type="color"
                value={coverColor}
                onChange={(e) => setCoverColor(e.target.value)}
              />
            </div>

            {/* Media */}
            <div className="space-y-2">
              <Label>{t.coverUrl}</Label>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t.videoUrl}</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>

            {/* Tags */}
            <div className="space-y-2 sm:col-span-2">
              <Label>{t.tags}</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={
                  isRTL ? "أدب, شعر, تراث" : "literature, poetry, heritage"
                }
              />
            </div>

            {/* Text areas */}
            <div className="space-y-2 sm:col-span-2">
              <Label>{t.description}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t.summary}</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              {t.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
