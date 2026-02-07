import { z } from "zod"

export const certificateConfigCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    "ACHIEVEMENT",
    "COMPLETION",
    "PARTICIPATION",
    "MERIT",
    "EXCELLENCE",
    "CUSTOM",
  ]),
  description: z.string().optional(),
  templateStyle: z
    .enum(["elegant", "modern", "classic", "minimal"])
    .default("elegant"),
  orientation: z.enum(["landscape", "portrait"]).default("landscape"),
  titleText: z.string().default("Certificate of Achievement"),
  titleTextAr: z.string().optional(),
  bodyTemplate: z.string().min(1, "Body template is required"),
  bodyTemplateAr: z.string().optional(),
  minPercentage: z.number().min(0).max(100).optional(),
  minGrade: z.string().optional(),
  topPercentile: z.number().min(0).max(100).optional(),
  signatures: z
    .array(
      z.object({
        name: z.string(),
        title: z.string(),
        signatureUrl: z.string().optional(),
      })
    )
    .min(1, "At least one signature is required"),
  useSchoolLogo: z.boolean().default(true),
  customLogo: z.string().optional(),
  borderStyle: z.enum(["gold", "silver", "blue", "custom"]).default("gold"),
  expiryMonths: z.number().int().positive().optional(),
  enableVerification: z.boolean().default(true),
  verificationPrefix: z.string().optional(),
})

export const certificateConfigUpdateSchema = certificateConfigCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, "ID is required"),
  })

export const generateCertificateSchema = z.object({
  examResultId: z.string().min(1, "Exam result ID is required"),
  configId: z.string().min(1, "Config ID is required"),
})

export const batchGenerateCertificatesSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  configId: z.string().min(1, "Config ID is required"),
  minPassScore: z.number().min(0).max(100).optional(),
})

export const shareCertificateSchema = z.object({
  id: z.string().min(1, "Certificate ID is required"),
  isPublic: z.boolean(),
  expiryDays: z.number().int().min(1).max(365).default(30),
})

export const verifyCertificateSchema = z.object({
  code: z.string().min(1, "Verification code is required"),
})

export const revokeCertificateSchema = z.object({
  id: z.string().min(1, "Certificate ID is required"),
  reason: z.string().min(1, "Revocation reason is required"),
})
