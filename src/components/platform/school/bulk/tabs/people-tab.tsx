'use client'

import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, Users, GraduationCap, UserCheck, Shield } from 'lucide-react'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function PeopleTab({ dictionary, lang }: Props) {
  const isArabic = lang === 'ar'

  function downloadStudentTemplate() {
    const template = 'FirstName,LastName,Email,DateOfBirth,GuardianName,GuardianPhone\nأحمد,محمد,ahmed@example.com,2010-01-15,محمد أحمد,+249123456789'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadTeacherTemplate() {
    const template = 'FirstName,LastName,Email,Phone,Department,Subject\nفاطمة,علي,fatima@example.com,+249987654321,العلوم,الكيمياء'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teachers-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Students Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'استيراد الطلاب' : 'Import Students'}</CardTitle>
              <CardDescription>
                {isArabic ? 'استيراد بيانات الطلاب من ملف CSV' : 'Bulk import student data from CSV file'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadStudentTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isArabic ? 'تحميل القالب' : 'Download Template'}
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                disabled
              />
            </div>
            <Button disabled>
              <Upload className="mr-2 h-4 w-4" />
              {isArabic ? 'قريباً' : 'Coming Soon'}
            </Button>
          </div>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'استيراد الطلاب الجماعي قادم قريباً' : 'Bulk student import will be available soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'استيراد المعلمين' : 'Import Teachers'}</CardTitle>
              <CardDescription>
                {isArabic ? 'استيراد بيانات المعلمين من ملف CSV' : 'Bulk import teacher data from CSV file'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTeacherTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isArabic ? 'تحميل القالب' : 'Download Template'}
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                disabled
              />
            </div>
            <Button disabled>
              <Upload className="mr-2 h-4 w-4" />
              {isArabic ? 'قريباً' : 'Coming Soon'}
            </Button>
          </div>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'استيراد المعلمين الجماعي قادم قريباً' : 'Bulk teacher import will be available soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staff Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'استيراد الموظفين' : 'Import Staff'}</CardTitle>
              <CardDescription>
                {isArabic ? 'استيراد بيانات الموظفين من ملف CSV' : 'Bulk import staff data from CSV file'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'استيراد الموظفين قادم قريباً' : 'Staff import coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Guardians Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{isArabic ? 'استيراد أولياء الأمور' : 'Import Guardians'}</CardTitle>
              <CardDescription>
                {isArabic ? 'استيراد بيانات أولياء الأمور من ملف CSV' : 'Bulk import guardian data from CSV file'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'استيراد أولياء الأمور قادم قريباً' : 'Guardian import coming soon'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
