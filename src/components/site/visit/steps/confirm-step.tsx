"use client"

import { format } from "date-fns"
import { Calendar, Clock, FileText, Mail, Phone, Users } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { VISIT_PURPOSES } from "../config"
import type { VisitFormData } from "../validation"

interface ConfirmStepProps {
  schoolName?: string
}

export function ConfirmStep({ schoolName }: ConfirmStepProps) {
  const { watch } = useFormContext<VisitFormData>()
  const values = watch()

  const purposeLabel =
    VISIT_PURPOSES.find((p) => p.value === values.purpose)?.label ||
    values.purpose

  const formattedDate = values.date
    ? format(new Date(values.date), "EEEE, MMMM d, yyyy")
    : "Not selected"

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-center text-sm">
        Please review your booking details before confirming
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {schoolName && (
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{schoolName}</h3>
                <p className="text-muted-foreground text-sm">School Visit</p>
              </div>
              <Separator />
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-muted-foreground text-sm">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-muted-foreground text-sm">
                  {values.startTime || "Not selected"}
                  {values.endTime && ` - ${values.endTime}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Visitor</p>
                <p className="text-muted-foreground text-sm">
                  {values.visitorName || "Not provided"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {values.visitors || 1}{" "}
                  {(values.visitors || 1) === 1 ? "person" : "people"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Purpose</p>
                <p className="text-muted-foreground text-sm">{purposeLabel}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{values.email || "Not provided"}</span>
            </div>
            {values.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{values.phone}</span>
              </div>
            )}
          </div>

          {values.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-muted-foreground text-sm">{values.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-xs">
        By confirming, you agree to receive email notifications about your
        booking.
      </p>
    </div>
  )
}
