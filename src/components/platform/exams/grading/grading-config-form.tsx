/**
 * Grading Configuration Form
 *
 * Form component for configuring school's grading system:
 * - Primary grading system selection
 * - GPA scale (4.0 or 5.0)
 * - Display preferences
 * - Passing threshold
 * - Exam type weightings
 * - Retake policies
 */

"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"

import { saveGradingConfig } from "./actions"
import { gradingConfigSchema, type GradingConfigInput } from "./validation"

// Grading system options
const GRADING_SYSTEMS = [
  { value: "PERCENTAGE", label: "Percentage (0-100%)" },
  { value: "GPA_4", label: "GPA 4.0 Scale" },
  { value: "GPA_5", label: "GPA 5.0 Scale" },
  { value: "LETTER", label: "Letter Grades (A-F)" },
  { value: "CGPA", label: "Cumulative GPA" },
  { value: "CCE", label: "CCE (Continuous and Comprehensive Evaluation)" },
  { value: "CBSE", label: "CBSE Pattern" },
  { value: "ICSE", label: "ICSE Pattern" },
] as const

// Retake policy options
const RETAKE_POLICIES = [
  {
    value: "best",
    label: "Best Score",
    description: "Use highest score from all attempts",
  },
  {
    value: "latest",
    label: "Latest Score",
    description: "Use most recent attempt",
  },
  {
    value: "average",
    label: "Average Score",
    description: "Average all attempts",
  },
] as const

interface GradingConfigFormProps {
  initialData?: Partial<GradingConfigInput>
  dictionary?: {
    grading?: {
      title?: string
      description?: string
      primarySystem?: string
      gpaScale?: string
      displayOptions?: string
      showPercentage?: string
      showGPA?: string
      showLetter?: string
      passingThreshold?: string
      examWeights?: string
      retakePolicy?: string
      maxRetakes?: string
      retakePenalty?: string
      save?: string
      saving?: string
    }
  }
}

export function GradingConfigForm({
  initialData,
  dictionary,
}: GradingConfigFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()

  const d = dictionary?.grading

  const form = useForm<GradingConfigInput>({
    resolver: zodResolver(gradingConfigSchema) as any,
    defaultValues: {
      primarySystem: initialData?.primarySystem ?? "GPA_4",
      gpaScale: initialData?.gpaScale ?? 4,
      showPercentage: initialData?.showPercentage ?? true,
      showGPA: initialData?.showGPA ?? true,
      showLetter: initialData?.showLetter ?? true,
      passingThreshold: initialData?.passingThreshold ?? 60,
      cgpaWeighting: initialData?.cgpaWeighting ?? {
        midterm: 0.3,
        final: 0.5,
        quiz: 0.1,
        assignment: 0.1,
      },
      retakePolicy: initialData?.retakePolicy ?? "best",
      maxRetakes: initialData?.maxRetakes ?? 2,
      retakePenaltyPercent: initialData?.retakePenaltyPercent ?? 0,
    },
  })

  const onSubmit = (data: GradingConfigInput) => {
    startTransition(async () => {
      try {
        await saveGradingConfig(data)
        toast({
          title: "Success",
          description: "Grading configuration saved successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to save configuration",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Primary Grading System */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.title ?? "Grading System"}</CardTitle>
            <CardDescription>
              {d?.description ??
                "Configure your school's primary grading system"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="primarySystem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {d?.primarySystem ?? "Primary Grading System"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grading system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GRADING_SYSTEMS.map((system) => (
                        <SelectItem key={system.value} value={system.value}>
                          {system.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gpaScale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{d?.gpaScale ?? "GPA Scale"}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GPA scale" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4">4.0 Scale</SelectItem>
                      <SelectItem value="5">5.0 Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.displayOptions ?? "Display Options"}</CardTitle>
            <CardDescription>
              Choose which grade formats to show on reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="showPercentage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {d?.showPercentage ?? "Show Percentage"}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showGPA"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{d?.showGPA ?? "Show GPA"}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showLetter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {d?.showLetter ?? "Show Letter Grade"}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="passingThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {d?.passingThreshold ?? "Passing Threshold"}: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum percentage required to pass
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Exam Type Weights */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.examWeights ?? "Exam Type Weights"}</CardTitle>
            <CardDescription>
              Configure weights for different exam types (must sum to 1.0)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cgpaWeighting.midterm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Midterm</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cgpaWeighting.final"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cgpaWeighting.quiz"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cgpaWeighting.assignment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Retake Policy */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.retakePolicy ?? "Retake Policy"}</CardTitle>
            <CardDescription>
              Configure how retake attempts are handled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="retakePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retake Scoring Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select retake policy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RETAKE_POLICIES.map((policy) => (
                        <SelectItem key={policy.value} value={policy.value}>
                          <div className="flex flex-col">
                            <span>{policy.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {policy.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxRetakes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{d?.maxRetakes ?? "Maximum Retakes"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of retake attempts allowed (0 = no retakes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retakePenaltyPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {d?.retakePenalty ?? "Retake Penalty"}: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      min={0}
                      max={50}
                      step={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Percentage deducted per retake attempt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {d?.saving ?? "Saving..."}
            </>
          ) : (
            (d?.save ?? "Save Configuration")
          )}
        </Button>
      </form>
    </Form>
  )
}
