// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
"use server"

import { db } from "@/lib/db"

export interface AdmissionPortalFlags {
  enablePublicPortal: boolean
  enableInquiryForm: boolean
  enableTourBooking: boolean
  enableStatusTracker: boolean
  /**
   * Whether submission requires at least one uploaded document. Unlike the
   * portal toggles this defaults to FALSE when no settings row exists —
   * mirroring the submitApplication gate (`admissionSettings?.requireDocuments`),
   * which only enforces the requirement for schools that have a settings row.
   */
  requireDocuments: boolean
}

/**
 * Resolve the four public-portal feature toggles for a school in one query.
 *
 * Every flag DEFAULTS TO TRUE when there is no settings row yet, or a column
 * is null — a school that has never opened the admission settings page still
 * has a fully live portal. Pages/actions call this to render a "closed" notice
 * or short-circuit when an admin has explicitly turned a surface off.
 */
export async function getAdmissionPortalFlags(
  schoolId: string
): Promise<AdmissionPortalFlags> {
  const settings = await db.admissionSettings.findUnique({
    where: { schoolId },
    select: {
      enablePublicPortal: true,
      enableInquiryForm: true,
      enableTourBooking: true,
      enableStatusTracker: true,
      requireDocuments: true,
    },
  })
  return {
    enablePublicPortal: settings?.enablePublicPortal ?? true,
    enableInquiryForm: settings?.enableInquiryForm ?? true,
    enableTourBooking: settings?.enableTourBooking ?? true,
    enableStatusTracker: settings?.enableStatusTracker ?? true,
    requireDocuments: settings?.requireDocuments ?? false,
  }
}
