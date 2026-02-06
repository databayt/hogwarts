"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { useFormContext, useWatch } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface PasswordFieldProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  showStrengthMeter?: boolean
  minLength?: number
  /** Labels for i18n (optional, English defaults) */
  dictionary?: {
    placeholder?: string
    showPassword?: string
    hidePassword?: string
    strengthLabel?: string
    veryWeak?: string
    weak?: string
    fair?: string
    good?: string
    strong?: string
    addMore?: string
    gettingBetter?: string
  }
}

/**
 * Password Field (Template - Composed Field)
 *
 * Password input with visibility toggle and optional strength meter.
 * Includes real-time strength calculation using useWatch.
 *
 * **Role**: Composed molecule for secure password entry
 *
 * **Usage Across App**:
 * - Registration forms
 * - Password reset forms
 * - Change password in settings
 * - Admin account creation
 *
 * @example
 * ```tsx
 * <PasswordField
 *   name="password"
 *   label="Password"
 *   showStrengthMeter
 *   minLength={8}
 * />
 * ```
 */
export function PasswordField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  showStrengthMeter = false,
  minLength = 8,
  dictionary,
}: PasswordFieldProps) {
  const placeholderText =
    placeholder ?? dictionary?.placeholder ?? "Enter password"
  const form = useFormContext()
  const [showPassword, setShowPassword] = React.useState(false)

  // Watch password value for strength calculation
  const password = useWatch({
    control: form.control,
    name,
    defaultValue: "",
  })

  // Calculate password strength
  const strength = React.useMemo(() => {
    if (!password || typeof password !== "string") return 0

    let score = 0

    // Length check
    if (password.length >= minLength) score += 25
    if (password.length >= 12) score += 15

    // Character variety
    if (/[a-z]/.test(password)) score += 15
    if (/[A-Z]/.test(password)) score += 15
    if (/[0-9]/.test(password)) score += 15
    if (/[^a-zA-Z0-9]/.test(password)) score += 15

    return Math.min(100, score)
  }, [password, minLength])

  const strengthLabel = React.useMemo(() => {
    if (strength < 25)
      return {
        label: dictionary?.veryWeak ?? "Very weak",
        color: "bg-destructive",
      }
    if (strength < 50)
      return { label: dictionary?.weak ?? "Weak", color: "bg-orange-500" }
    if (strength < 75)
      return { label: dictionary?.fair ?? "Fair", color: "bg-yellow-500" }
    if (strength < 100)
      return { label: dictionary?.good ?? "Good", color: "bg-green-500" }
    return { label: dictionary?.strong ?? "Strong", color: "bg-green-600" }
  }, [strength, dictionary])

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? "text" : "password"}
                placeholder={placeholderText}
                disabled={disabled}
                className="pe-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword
                    ? (dictionary?.hidePassword ?? "Hide password")
                    : (dictionary?.showPassword ?? "Show password")}
                </span>
              </Button>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}

          {/* Strength meter */}
          {showStrengthMeter && password && (
            <div className="space-y-1.5 pt-2">
              <Progress
                value={strength}
                className={cn("h-1.5", strengthLabel.color)}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {dictionary?.strengthLabel ?? "Password strength"}:{" "}
                  <span className="font-medium">{strengthLabel.label}</span>
                </span>
                {strength < 75 && (
                  <span className="text-muted-foreground">
                    {strength < 50
                      ? (dictionary?.addMore ??
                        "Add uppercase, numbers, or symbols")
                      : (dictionary?.gettingBetter ?? "Getting better!")}
                  </span>
                )}
              </div>
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  )
}
