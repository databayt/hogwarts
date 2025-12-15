"use client"

import { Box, Building } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function StructureTab({ dictionary, lang }: Props) {
  const isArabic = lang === "ar"

  return (
    <div className="space-y-4">
      {/* Departments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle>{isArabic ? "الأقسام" : "Departments"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "إنشاء وإدارة الأقسام الأكاديمية"
                  : "Create and manage academic departments"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-4 text-center">
            <p className="text-muted-foreground text-sm">
              {isArabic
                ? "إدارة الأقسام قادمة قريباً"
                : "Department management coming soon"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Classrooms */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle>
                {isArabic ? "الفصول الدراسية" : "Classrooms"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "إدارة الفصول والقاعات الدراسية"
                  : "Manage classrooms and physical spaces"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-4 text-center">
            <p className="text-muted-foreground text-sm">
              {isArabic
                ? "إدارة الفصول قادمة قريباً"
                : "Classroom management coming soon"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
