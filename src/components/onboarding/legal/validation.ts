import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createLegalSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    operationalStatus: z.enum(
      ["existing-licensed", "new-seeking-registration"],
      {
        message: v.get("operationalStatusRequired"),
      }
    ),
    hasCCTV: z.boolean().default(false),
    hasEmergencyAlarm: z.boolean().default(false),
    hasTransportation: z.boolean().default(false),
    complianceAcknowledged: z.boolean().refine((val) => val === true, {
      message: v.get("complianceAcknowledgmentRequired"),
    }),
  })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const legalSchema = z.object({
  operationalStatus: z
    .enum(["existing-licensed", "new-seeking-registration"])
    .describe("Please select operational status"),
  hasCCTV: z.boolean().default(false),
  hasEmergencyAlarm: z.boolean().default(false),
  hasTransportation: z.boolean().default(false),
  complianceAcknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge compliance with local laws",
  }),
})

export type LegalFormData = z.infer<typeof legalSchema>
