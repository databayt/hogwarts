"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getTemplates } from "./template-actions";
import type { UseFormReturn } from "react-hook-form";
import type { AnnouncementFormData } from "./validation";
import type { Locale } from "@/components/internationalization/config";
import {
  FileText,
  Calendar,
  GraduationCap,
  CalendarCheck,
  Users,
  FileCheck,
  AlertTriangle,
  MessageSquare,
  Megaphone,
  Bell,
  UserCheck,
} from "lucide-react";
import type { AnnouncementTemplate } from "@prisma/client";

interface TemplatesStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  lang: Locale;
  onTemplateSelect?: () => void;
}

// Quick presets for common announcement types
const QUICK_PRESETS = [
  {
    id: "urgent-school",
    icon: AlertTriangle,
    labelEn: "Urgent School-wide",
    labelAr: "عاجل للمدرسة",
    scope: "school" as const,
    priority: "urgent" as const,
  },
  {
    id: "class-meeting",
    icon: Users,
    labelEn: "Class Meeting",
    labelAr: "اجتماع الفصل",
    scope: "class" as const,
    priority: "normal" as const,
  },
  {
    id: "staff-notice",
    icon: Bell,
    labelEn: "Staff Notice",
    labelAr: "إشعار الموظفين",
    scope: "role" as const,
    priority: "normal" as const,
    role: "STAFF" as const,
  },
  {
    id: "parent-update",
    icon: UserCheck,
    labelEn: "Parent Update",
    labelAr: "تحديث أولياء الأمور",
    scope: "role" as const,
    priority: "normal" as const,
    role: "GUARDIAN" as const,
  },
];

// System templates for common announcement categories
const SYSTEM_TEMPLATES = [
  { type: "holiday", icon: Calendar, labelEn: "Holiday", labelAr: "عطلة", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { type: "exam", icon: GraduationCap, labelEn: "Exam Schedule", labelAr: "جدول الامتحانات", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { type: "event", icon: CalendarCheck, labelEn: "Event", labelAr: "فعالية", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { type: "meeting", icon: Users, labelEn: "Meeting", labelAr: "اجتماع", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  { type: "policy", icon: FileCheck, labelEn: "Policy Update", labelAr: "تحديث السياسة", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { type: "emergency", icon: AlertTriangle, labelEn: "Emergency", labelAr: "طوارئ", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { type: "general", icon: MessageSquare, labelEn: "General", labelAr: "عام", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
];

export function TemplatesStep({ form, lang, onTemplateSelect }: TemplatesStepProps) {
  const isRTL = lang === "ar";
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("scratch");
  const [userTemplates, setUserTemplates] = useState<AnnouncementTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const result = await getTemplates();
        if (result.success) {
          // Filter to only show user-created templates (not system)
          setUserTemplates(result.data.filter((t) => !t.isSystem));
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  // Handle template selection
  const handleSelect = (templateId: string, templateData?: Partial<AnnouncementFormData>) => {
    setSelectedTemplate(templateId);

    if (templateId === "scratch") {
      // Reset form to defaults
      form.reset({
        titleEn: "",
        titleAr: "",
        bodyEn: "",
        bodyAr: "",
        scope: "school",
        priority: "normal",
        classId: "",
        role: undefined,
        published: false,
      });
    } else if (templateData) {
      // Apply template data
      form.reset({
        ...form.getValues(),
        ...templateData,
      });
    }

    onTemplateSelect?.();
  };

  // Apply quick preset
  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    handleSelect(preset.id, {
      scope: preset.scope,
      priority: preset.priority,
      role: preset.role,
    });
  };

  // Apply system template type
  const applySystemTemplate = (template: typeof SYSTEM_TEMPLATES[0]) => {
    handleSelect(`system-${template.type}`, {
      scope: "school",
      priority: template.type === "emergency" ? "urgent" : "normal",
    });
  };

  // Apply user template
  const applyUserTemplate = (template: AnnouncementTemplate) => {
    handleSelect(`user-${template.id}`, {
      titleEn: template.titleEn || "",
      titleAr: template.titleAr || "",
      bodyEn: template.bodyEn || "",
      bodyAr: template.bodyAr || "",
      scope: template.scope,
      priority: template.priority,
      classId: template.classId || "",
      role: template.role || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Start from Scratch */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          {isRTL ? "البدء من الصفر" : "Start Fresh"}
        </h4>
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            selectedTemplate === "scratch" && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => handleSelect("scratch")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium">
                {isRTL ? "إعلان جديد" : "New Announcement"}
              </h5>
              <p className="text-sm text-muted-foreground">
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
        <h4 className="text-sm font-medium mb-3">
          {isRTL ? "إعدادات سريعة" : "Quick Presets"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedTemplate === preset.id;
            return (
              <Card
                key={preset.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected && "border-primary ring-2 ring-primary/20"
                )}
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-medium truncate">
                      {isRTL ? preset.labelAr : preset.labelEn}
                    </h5>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* System Templates */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          {isRTL ? "أنواع الإعلانات" : "Announcement Types"}
        </h4>
        <div className="flex flex-wrap gap-2">
          {SYSTEM_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === `system-${template.type}`;
            return (
              <button
                key={template.type}
                type="button"
                onClick={() => applySystemTemplate(template)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  template.color,
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <Icon className="h-4 w-4" />
                {isRTL ? template.labelAr : template.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* User's Saved Templates */}
      {(isLoading || userTemplates.length > 0) && (
        <div>
          <h4 className="text-sm font-medium mb-3">
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
                const isSelected = selectedTemplate === `user-${template.id}`;
                return (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      isSelected && "border-primary ring-2 ring-primary/20"
                    )}
                    onClick={() => applyUserTemplate(template)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium truncate">{template.name}</h5>
                        {template.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {template.type}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
