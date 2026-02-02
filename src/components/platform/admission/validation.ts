import { z } from "zod"

// Campaign validation schema - matches AdmissionCampaign Prisma model
export const campaignSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be at most 100 characters"),
  academicYear: z
    .string()
    .min(4, "Academic year is required")
    .max(20, "Academic year must be at most 20 characters"),
  startDate: z.coerce.date({ message: "Start date is required" }),
  endDate: z.coerce.date({ message: "End date is required" }),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "PROCESSING", "COMPLETED"], {
    message: "Status is required",
  }),
  description: z.string().max(500).optional().nullable(),
  totalSeats: z
    .number({ message: "Total seats is required" })
    .min(1, "Must have at least 1 seat"),
  applicationFee: z
    .number()
    .min(0, "Application fee cannot be negative")
    .optional()
    .nullable(),
})

// Refine to check end date is after start date
export const campaignSchemaWithValidation = campaignSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
)

export type CampaignFormData = z.infer<typeof campaignSchema>

// Status options for select
export const campaignStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
] as const
