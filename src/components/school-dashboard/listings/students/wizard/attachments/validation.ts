// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Re-export only. The definition lives in `@/components/form/attachments-schema`
 * and is shared with the other student-intake wizard — these two step dirs used
 * to carry byte-identical copies, which is exactly the dashboard/marketing drift
 * `.claude/rules/blocks/admission.md` warns about. This file stays so the step
 * keeps the `validation.ts` every other wizard step has.
 */

export {
  attachmentsSchema,
  type AttachmentsFormData,
} from "@/components/form/attachments-schema"
