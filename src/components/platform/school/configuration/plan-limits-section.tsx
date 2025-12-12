"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pencil,
  Check,
  X,
  Loader2,
  Crown,
  Users,
  GraduationCap,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { updatePlanLimits } from "./actions"
import type { Locale } from "@/components/internationalization/config"

const planLimitsSchema = z.object({
  planType: z.enum(["basic", "premium", "enterprise"]),
  maxStudents: z.number().min(1).max(100000),
  maxTeachers: z.number().min(1).max(10000),
  isActive: z.boolean(),
})

type PlanLimitsFormData = z.infer<typeof planLimitsSchema>

interface Props {
  schoolId: string
  initialData: PlanLimitsFormData
  currentUsage: {
    students: number
    teachers: number
  }
  lang: Locale
}

const PLAN_FEATURES = {
  basic: {
    label: "Basic",
    color: "bg-muted",
    textColor: "text-muted-foreground",
    maxStudents: 100,
    maxTeachers: 10,
    features: ["Up to 100 students", "Up to 10 teachers", "Basic reports"],
  },
  premium: {
    label: "Premium",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    maxStudents: 500,
    maxTeachers: 50,
    features: ["Up to 500 students", "Up to 50 teachers", "Advanced analytics", "Custom branding"],
  },
  enterprise: {
    label: "Enterprise",
    color: "bg-purple-500",
    textColor: "text-purple-500",
    maxStudents: 10000,
    maxTeachers: 1000,
    features: ["Unlimited students", "Unlimited teachers", "Priority support", "Custom integrations"],
  },
}

export function PlanLimitsSection({ schoolId, initialData, currentUsage, lang }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<PlanLimitsFormData>({
    resolver: zodResolver(planLimitsSchema),
    defaultValues: initialData,
  })

  const planConfig = PLAN_FEATURES[initialData.planType as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.basic

  // Calculate usage percentages
  const studentUsage = Math.round((currentUsage.students / initialData.maxStudents) * 100)
  const teacherUsage = Math.round((currentUsage.teachers / initialData.maxTeachers) * 100)

  const handleSave = () => {
    const data = form.getValues()

    startTransition(async () => {
      try {
        setError("")
        const result = await updatePlanLimits(schoolId, data)

        if (result.success) {
          setIsEditing(false)
        } else {
          setError(result.error || "Failed to update plan limits")
        }
      } catch (err) {
        setError("An unexpected error occurred")
      }
    })
  }

  const handleCancel = () => {
    form.reset(initialData)
    setIsEditing(false)
    setError("")
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-6">
            {/* Current Plan */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${planConfig.color}`}>
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{planConfig.label} Plan</h4>
                  <Badge variant={initialData.isActive ? "default" : "destructive"}>
                    {initialData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {initialData.maxStudents.toLocaleString()} students, {initialData.maxTeachers.toLocaleString()} teachers
                </p>
              </div>
            </div>

            {/* Usage Meters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Students Usage */}
              <div className="space-y-2 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Students</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentUsage.students.toLocaleString()} / {initialData.maxStudents.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={Math.min(studentUsage, 100)}
                  className={studentUsage > 90 ? "[&>div]:bg-destructive" : studentUsage > 75 ? "[&>div]:bg-yellow-500" : ""}
                />
                {studentUsage > 90 && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Approaching limit
                  </div>
                )}
              </div>

              {/* Teachers Usage */}
              <div className="space-y-2 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Teachers</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentUsage.teachers.toLocaleString()} / {initialData.maxTeachers.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={Math.min(teacherUsage, 100)}
                  className={teacherUsage > 90 ? "[&>div]:bg-destructive" : teacherUsage > 75 ? "[&>div]:bg-yellow-500" : ""}
                />
                {teacherUsage > 90 && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Approaching limit
                  </div>
                )}
              </div>
            </div>

            {/* Plan Features */}
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h5 className="text-sm font-medium mb-2">Plan Features</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {planConfig.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Plan Type */}
      <div className="space-y-2">
        <Label htmlFor="planType">Subscription Plan</Label>
        <Select
          value={form.watch("planType")}
          onValueChange={(value) => form.setValue("planType", value as "basic" | "premium" | "enterprise")}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                Basic
              </div>
            </SelectItem>
            <SelectItem value="premium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Premium
              </div>
            </SelectItem>
            <SelectItem value="enterprise">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Enterprise
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxStudents">Maximum Students</Label>
          <Input
            id="maxStudents"
            type="number"
            {...form.register("maxStudents", { valueAsNumber: true })}
            min={1}
            max={100000}
            disabled={isPending}
          />
          {form.formState.errors.maxStudents && (
            <p className="text-xs text-destructive">{form.formState.errors.maxStudents.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Current: {currentUsage.students.toLocaleString()} students
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxTeachers">Maximum Teachers</Label>
          <Input
            id="maxTeachers"
            type="number"
            {...form.register("maxTeachers", { valueAsNumber: true })}
            min={1}
            max={10000}
            disabled={isPending}
          />
          {form.formState.errors.maxTeachers && (
            <p className="text-xs text-destructive">{form.formState.errors.maxTeachers.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Current: {currentUsage.teachers.toLocaleString()} teachers
          </p>
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label htmlFor="isActive" className="cursor-pointer">School Active Status</Label>
            <p className="text-xs text-muted-foreground">
              Deactivating will prevent all users from accessing the platform
            </p>
          </div>
        </div>
        <Switch
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
          disabled={isPending}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={handleCancel} disabled={isPending} size="sm">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
