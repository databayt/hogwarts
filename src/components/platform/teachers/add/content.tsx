'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TeacherCreateForm } from '../form'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function AddTeacherContent({ dictionary, lang }: Props) {
  const router = useRouter()

  const t = {
    title: lang === 'ar' ? 'إضافة معلم جديد' : 'Add New Teacher',
    description: lang === 'ar' ? 'أدخل معلومات المعلم الجديد' : 'Enter the new teacher\'s information',
    back: lang === 'ar' ? 'العودة' : 'Back',
  }

  const handleSuccess = () => {
    router.push(`/${lang}/teachers`)
    router.refresh()
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
          <TeacherCreateForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
