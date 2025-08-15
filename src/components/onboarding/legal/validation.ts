import { z } from 'zod';

export const legalSchema = z.object({
  operationalStatus: z.enum(['existing-licensed', 'new-seeking-registration']).describe("Please select operational status"),
  hasCCTV: z.boolean().default(false),
  hasEmergencyAlarm: z.boolean().default(false),
  hasTransportation: z.boolean().default(false),
  complianceAcknowledged: z.boolean().refine(val => val === true, {
    message: "You must acknowledge compliance with local laws",
  }),
});

export type LegalFormData = z.infer<typeof legalSchema>;
