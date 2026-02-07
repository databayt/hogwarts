"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

import { createProgressSchedule, updateProgressSchedule } from "./actions"
import type { ProgressScheduleSummary } from "./types"

interface ProgressReportFormProps {
  schedule?: ProgressScheduleSummary
  classes?: Array<{ id: string; name: string }>
}

const FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "TERM_END", label: "Term End" },
]

const RECIPIENT_TYPES = [
  { value: "GUARDIAN", label: "Guardians" },
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
]

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "in_app", label: "In-App Notification" },
  { value: "sms", label: "SMS" },
]

export function ProgressReportForm({
  schedule,
  classes = [],
}: ProgressReportFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    classId: schedule?.classId || "",
    frequency: schedule?.frequency || "MONTHLY",
    includeExamResults: schedule?.includeExamResults ?? true,
    includeAttendance: schedule?.includeAttendance ?? true,
    includeAssignments: schedule?.includeAssignments ?? false,
    includeBehavior: schedule?.includeBehavior ?? false,
    recipientTypes: schedule?.recipientTypes || ["GUARDIAN"],
    channels: schedule?.channels || ["email", "in_app"],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        ...formData,
        classId: formData.classId || undefined,
      }

      const result = schedule
        ? await updateProgressSchedule({ id: schedule.id, ...data })
        : await createProgressSchedule(data)

      if (result.success) {
        toast({
          title: "Success",
          description: schedule
            ? "Schedule updated successfully"
            : "Schedule created successfully",
        })
        router.push("/exams/progress")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleRecipient = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      recipientTypes: prev.recipientTypes.includes(value)
        ? prev.recipientTypes.filter((t) => t !== value)
        : [...prev.recipientTypes, value],
    }))
  }

  const toggleChannel = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(value)
        ? prev.channels.filter((c) => c !== value)
        : [...prev.channels, value],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="class" className="text-sm font-medium">
            Class (Optional)
          </label>
          <Select
            value={formData.classId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, classId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Leave empty to include all classes
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="frequency" className="text-sm font-medium">
            Frequency
          </label>
          <Select
            value={formData.frequency}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, frequency: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Report Contents</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="includeExamResults" className="text-sm">
                Exam Results
              </label>
              <Switch
                id="includeExamResults"
                checked={formData.includeExamResults}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeExamResults: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="includeAttendance" className="text-sm">
                Attendance
              </label>
              <Switch
                id="includeAttendance"
                checked={formData.includeAttendance}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeAttendance: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="includeAssignments" className="text-sm">
                Assignments
              </label>
              <Switch
                id="includeAssignments"
                checked={formData.includeAssignments}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeAssignments: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="includeBehavior" className="text-sm">
                Behavior
              </label>
              <Switch
                id="includeBehavior"
                checked={formData.includeBehavior}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeBehavior: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Recipients</label>
          <div className="space-y-2">
            {RECIPIENT_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`recipient-${type.value}`}
                  checked={formData.recipientTypes.includes(type.value)}
                  onChange={() => toggleRecipient(type.value)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={`recipient-${type.value}`} className="text-sm">
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Delivery Channels</label>
          <div className="space-y-2">
            {CHANNELS.map((channel) => (
              <div key={channel.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`channel-${channel.value}`}
                  checked={formData.channels.includes(channel.value)}
                  onChange={() => toggleChannel(channel.value)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={`channel-${channel.value}`} className="text-sm">
                  {channel.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            formData.recipientTypes.length === 0 ||
            formData.channels.length === 0
          }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {schedule ? "Update Schedule" : "Create Schedule"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
