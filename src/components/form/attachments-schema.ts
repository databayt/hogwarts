// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Canonical student-attachments schema — the six document URLs collected on the
 * `attachments` step of BOTH one-by-one student intake wizards:
 *
 *  - `school-dashboard/listings/students/wizard/attachments/` (ADMIN_DIRECT)
 *  - `school-marketing/application/attachments/`              (PORTAL)
 *
 * The two shipped byte-identical copies of this. `.claude/rules/blocks/admission.md`
 * warns that the dashboard and marketing `validation.ts` files "may need sync" —
 * this is that sync, made structural instead of manual. Each step dir keeps a
 * `validation.ts` (the wizard-step convention every other step follows) which now
 * re-exports from here rather than redeclaring.
 *
 * NOT shared with `listings/teachers/wizard/attachments/`: that one is genuinely
 * a different document set (`certificationUrl`, no `transcriptUrl`) because a
 * teacher is not a student. Leave it alone.
 */

import { z } from "zod"

export const attachmentsSchema = z.object({
  profilePhotoUrl: z.string().nullable().optional().default(""),
  degreeUrl: z.string().nullable().optional().default(""),
  transcriptUrl: z.string().nullable().optional().default(""),
  idUrl: z.string().nullable().optional().default(""),
  resumeUrl: z.string().nullable().optional().default(""),
  otherUrl: z.string().nullable().optional().default(""),
})

export type AttachmentsFormData = z.infer<typeof attachmentsSchema>
