"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, Bell, BellRing, Info } from "lucide-react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getClassesForSelection } from "@/components/school-dashboard/attendance/actions"

import { AnnouncementFormStepProps } from "./types"
import { announcementCreateSchema } from "./validation"

interface ScopeStepProps extends AnnouncementFormStepProps {
  dictionary: Dictionary["school"]["announcements"]
  lang: Locale
}

export function ScopeStep({ form, isView, dictionary, lang }: ScopeStepProps) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const scope = form.watch("scope")
  const t = dictionary
  const isRTL = lang === "ar"

  // Priority options with icons and descriptions
  const priorityOptions = [
    {
      value: "low",
      label: isRTL ? "منخفض" : "Low",
      description: isRTL ? "إشعار عادي" : "Regular notification",
      icon: Bell,
      color: "bg-muted text-muted-foreground",
    },
    {
      value: "normal",
      label: isRTL ? "عادي" : "Normal",
      description: isRTL ? "إشعار قياسي" : "Standard notification",
      icon: Bell,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      value: "high",
      label: isRTL ? "مرتفع" : "High",
      description: isRTL ? "يظهر بشكل بارز" : "Shown prominently",
      icon: AlertTriangle,
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    {
      value: "urgent",
      label: isRTL ? "عاجل" : "Urgent",
      description: isRTL
        ? "إشعار فوري للجميع"
        : "Immediate notification to all",
      icon: BellRing,
      color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  ]

  const scopeOptions = [
    { label: t.school, value: "school" },
    { label: t.class, value: "class" },
    { label: t.role, value: "role" },
  ]

  const roleOptions = [
    { label: t.roleAdmin, value: "ADMIN" },
    { label: t.roleTeacher, value: "TEACHER" },
    { label: t.roleStudent, value: "STUDENT" },
    { label: t.roleGuardian, value: "GUARDIAN" },
    { label: t.roleStaff, value: "STAFF" },
    { label: t.roleAccountant, value: "ACCOUNTANT" },
  ]

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await getClassesForSelection()
        if (res.success && res.data) {
          setClasses(res.data.classes || [])
        }
      } catch (error) {
        console.error("Failed to load classes:", error)
      }
    }
    loadClasses()
  }, [])

  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="scope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.scopeLabel}</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.scopePlaceholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {scopeOptions.map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {scope === "class" && (
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.classLabel}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.classPlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {scope === "role" && (
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.roleLabel}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.rolePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Priority field with info popover */}
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => {
          const selectedPriority =
            priorityOptions.find((p) => p.value === field.value) ||
            priorityOptions[1]
          const PriorityIcon = selectedPriority.icon

          return (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>{isRTL ? "الأولوية" : "Priority"}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="start">
                    <div className="space-y-3">
                      <h4 className="font-medium">
                        {isRTL ? "مستويات الأولوية" : "Priority Levels"}
                      </h4>
                      <div className="space-y-2">
                        {priorityOptions.map((option) => {
                          const Icon = option.icon
                          return (
                            <div
                              key={option.value}
                              className="flex items-start gap-2"
                            >
                              <Badge
                                variant="secondary"
                                className={`${option.color} shrink-0`}
                              >
                                <Icon className="me-1 h-3 w-3" />
                                {option.label}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {option.description}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Select
                onValueChange={field.onChange}
                value={field.value || "normal"}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={selectedPriority.color}
                        >
                          <PriorityIcon className="me-1 h-3 w-3" />
                          {selectedPriority.label}
                        </Badge>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {priorityOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={option.color}>
                            <Icon className="me-1 h-3 w-3" />
                            {option.label}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )
        }}
      />

      <FormField
        control={form.control}
        name="published"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {t.publishImmediately}
              </FormLabel>
              <div className="text-muted-foreground text-sm">
                {t.publishImmediatelyDescription}
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isView}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
