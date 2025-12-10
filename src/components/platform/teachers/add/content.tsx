'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { TeacherCreateForm } from '../form'
import { createTeacher } from '../actions'
import { SuccessToast, ErrorToast } from '@/components/atom/toast'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function AddTeacherContent({ dictionary, lang }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const t = {
    title: lang === 'ar' ? 'إضافة معلم جديد' : 'Add New Teacher',
    description: lang === 'ar' ? 'أدخل معلومات المعلم الجديد' : 'Enter the new teacher\'s information',
    back: lang === 'ar' ? 'العودة' : 'Back',
    success: lang === 'ar' ? 'تم إضافة المعلم بنجاح' : 'Teacher added successfully',
    error: lang === 'ar' ? 'حدث خطأ أثناء إضافة المعلم' : 'Error adding teacher',
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const result = await createTeacher(data)
      if (result.success) {
        SuccessToast(t.success)
        router.push(`/${lang}/teachers`)
      } else {
        ErrorToast(result.error || t.error)
      }
    } catch (error) {
      ErrorToast(t.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${lang}/teachers`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <TeacherCreateForm
            onSubmit={handleSubmit}
            dictionary={dictionary?.teachers}
            lang={lang}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  )
}
