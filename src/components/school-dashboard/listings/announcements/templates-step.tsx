"use client"

import { useEffect, useState } from "react"
import type { AnnouncementTemplate } from "@prisma/client"
import {
  AlertTriangle,
  Bell,
  Calendar,
  CalendarCheck,
  FileCheck,
  FileText,
  GraduationCap,
  Megaphone,
  MessageSquare,
  UserCheck,
  Users,
} from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"

import { getTemplates } from "./template-actions"
import type { AnnouncementFormData } from "./validation"

interface TemplatesStepProps {
  form: UseFormReturn<AnnouncementFormData>
  lang: Locale
  onTemplateSelect?: () => void
}

// Quick presets for common announcement types
const QUICK_PRESETS = [
  {
    id: "urgent-school",
    icon: AlertTriangle,
    label: "عاجل للمدرسة",
    scope: "school" as const,
    priority: "urgent" as const,
  },
  {
    id: "class-meeting",
    icon: Users,
    label: "اجتماع الفصل",
    scope: "class" as const,
    priority: "normal" as const,
  },
  {
    id: "staff-notice",
    icon: Bell,
    label: "إشعار الموظفين",
    scope: "role" as const,
    priority: "normal" as const,
    role: "STAFF" as const,
  },
  {
    id: "parent-update",
    icon: UserCheck,
    label: "تحديث أولياء الأمور",
    scope: "role" as const,
    priority: "normal" as const,
    role: "GUARDIAN" as const,
  },
]

// System templates for common announcement categories
const SYSTEM_TEMPLATES = [
  {
    type: "holiday",
    icon: Calendar,
    label: "عطلة",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    type: "exam",
    icon: GraduationCap,
    label: "جدول الامتحانات",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  {
    type: "event",
    icon: CalendarCheck,
    label: "فعالية",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  {
    type: "meeting",
    icon: Users,
    label: "اجتماع",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    type: "policy",
    icon: FileCheck,
    label: "تحديث السياسة",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    type: "emergency",
    icon: AlertTriangle,
    label: "طوارئ",
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  {
    type: "general",
    icon: MessageSquare,
    label: "عام",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
]

export function TemplatesStep({
  form,
  lang,
  onTemplateSelect,
}: TemplatesStepProps) {
  const isRTL = lang === "ar"
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    "scratch"
  )
  const [userTemplates, setUserTemplates] = useState<AnnouncementTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const result = await getTemplates()
        if (result.success) {
          // Filter to only show user-created templates (not system)
          setUserTemplates(result.data.filter((t) => !t.isSystem))
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  // Handle template selection
  const handleSelect = (
    templateId: string,
    templateData?: Partial<AnnouncementFormData>
  ) => {
    setSelectedTemplate(templateId)

    if (templateId === "scratch") {
      // Reset form to defaults
      form.reset({
        title: "",
        body: "",
        lang: "ar",
        scope: "school",
        priority: "normal",
        classId: "",
        role: undefined,
        published: false,
      })
    } else if (templateData) {
      // Apply template data
      form.reset({
        ...form.getValues(),
        ...templateData,
      })
    }

    onTemplateSelect?.()
  }

  // Apply quick preset
  const applyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    handleSelect(preset.id, {
      scope: preset.scope,
      priority: preset.priority,
      role: preset.role,
    })
  }

  // Apply system template type
  const applySystemTemplate = (template: (typeof SYSTEM_TEMPLATES)[0]) => {
    handleSelect(`system-${template.type}`, {
      scope: "school",
      priority: template.type === "emergency" ? "urgent" : "normal",
    })
  }

  // Apply user template
  const applyUserTemplate = (template: AnnouncementTemplate) => {
    handleSelect(`user-${template.id}`, {
      title: template.title || "",
      body: template.body || "",
      lang: (template.lang as "ar" | "en") || "ar",
      scope: template.scope,
      priority: template.priority,
      classId: template.classId || "",
      role: template.role || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Start from Scratch */}
      <div>
        <h4 className="mb-3 text-sm font-medium">
          {isRTL ? "البدء من الصفر" : "Start Fresh"}
        </h4>
        <Card
          className={cn(
            "hover:border-primary/50 cursor-pointer transition-all",
            selectedTemplate === "scratch" &&
              "border-primary ring-primary/20 ring-2"
          )}
          onClick={() => handleSelect("scratch")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
              <FileText className="text-muted-foreground h-6 w-6" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">
                {isRTL ? "إعلان جديد" : "New Announcement"}
              </h5>
              <p className="text-muted-foreground text-sm">
                {isRTL ? "ابدأ بإعلان فارغ" : "Start with a blank announcement"}
              </p>
            </div>
            {selectedTemplate === "scratch" && (
              <Badge variant="default" className="shrink-0">
                {isRTL ? "محدد" : "Selected"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Presets */}
      <div>
        <h4 className="mb-3 text-sm font-medium">
          {isRTL ? "إعدادات سريعة" : "Quick Presets"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_PRESETS.map((preset) => {
            const Icon = preset.icon
            const isSelected = selectedTemplate === preset.id
            return (
              <Card
                key={preset.id}
                className={cn(
                  "hover:border-primary/50 cursor-pointer transition-all",
                  isSelected && "border-primary ring-primary/20 ring-2"
                )}
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-sm font-medium">
                      {preset.label}
                    </h5>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* System Templates */}
      <div>
        <h4 className="mb-3 text-sm font-medium">
          {isRTL ? "أنواع الإعلانات" : "Announcement Types"}
        </h4>
        <div className="flex flex-wrap gap-2">
          {SYSTEM_TEMPLATES.map((template) => {
            const Icon = template.icon
            const isSelected = selectedTemplate === `system-${template.type}`
            return (
              <button
                key={template.type}
                type="button"
                onClick={() => applySystemTemplate(template)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  template.color,
                  isSelected && "ring-primary ring-2 ring-offset-2"
                )}
              >
                <Icon className="h-4 w-4" />
                {template.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* User's Saved Templates */}
      {(isLoading || userTemplates.length > 0) && (
        <div>
          <h4 className="mb-3 text-sm font-medium">
            {isRTL ? "قوالبي المحفوظة" : "My Saved Templates"}
          </h4>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : userTemplates.length > 0 ? (
            <div className="space-y-2">
              {userTemplates.map((template) => {
                const isSelected = selectedTemplate === `user-${template.id}`
                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "hover:border-primary/50 cursor-pointer transition-all",
                      isSelected && "border-primary ring-primary/20 ring-2"
                    )}
                    onClick={() => applyUserTemplate(template)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Megaphone className="text-muted-foreground h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="truncate font-medium">
                          {template.name}
                        </h5>
                        {template.description && (
                          <p className="text-muted-foreground truncate text-sm">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {template.type}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
