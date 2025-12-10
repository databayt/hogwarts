'use client'

import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Box } from 'lucide-react'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function StructureTab({ dictionary, lang }: Props) {
  const isArabic = lang === 'ar'

  return (
    <div className="space-y-4">
      {/* Departments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'الأقسام' : 'Departments'}</CardTitle>
              <CardDescription>
                {isArabic ? 'إنشاء وإدارة الأقسام الأكاديمية' : 'Create and manage academic departments'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة الأقسام قادمة قريباً' : 'Department management coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Classrooms */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'الفصول الدراسية' : 'Classrooms'}</CardTitle>
              <CardDescription>
                {isArabic ? 'إدارة الفصول والقاعات الدراسية' : 'Manage classrooms and physical spaces'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة الفصول قادمة قريباً' : 'Classroom management coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
