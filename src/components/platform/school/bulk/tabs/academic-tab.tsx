'use client'

import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, GraduationCap, Target } from 'lucide-react'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function AcademicTab({ dictionary, lang }: Props) {
  const isArabic = lang === 'ar'

  return (
    <div className="space-y-4">
      {/* Academic Years */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'السنوات الأكاديمية' : 'Academic Years'}</CardTitle>
              <CardDescription>
                {isArabic ? 'إنشاء وإدارة السنوات الدراسية' : 'Create and manage school years'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة السنوات الأكاديمية قادمة قريباً' : 'Academic year management coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'الفصول الدراسية' : 'Terms'}</CardTitle>
              <CardDescription>
                {isArabic ? 'تحديد فصول السنة الدراسية' : 'Define terms within the academic year'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة الفصول الدراسية قادمة قريباً' : 'Term management coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Year Levels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'المراحل الدراسية' : 'Year Levels'}</CardTitle>
              <CardDescription>
                {isArabic ? 'تعريف المراحل والصفوف الدراسية' : 'Define grades and year levels'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة المراحل الدراسية قادمة قريباً' : 'Year level management coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grading Scale */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'نظام الدرجات' : 'Grading Scale'}</CardTitle>
              <CardDescription>
                {isArabic ? 'إعداد نظام التقييم والدرجات' : 'Configure grading and score ranges'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إعداد نظام الدرجات قادم قريباً' : 'Grading scale setup coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
