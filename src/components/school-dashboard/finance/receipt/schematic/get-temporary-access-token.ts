"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { logger } from "@/lib/logger"
import { getTenantContext } from "@/lib/tenant-context"

import { schematicClient } from "./client"

/**
 * Roles allowed into the school's Schematic customer portal. The token is
 * scoped to the SCHOOL (Schematic "company"), not the caller — it can change
 * or cancel the school's plan — so it is a school-administrator capability,
 * not a per-user one, and no FinancePermission grant widens it.
 */
const PLAN_MANAGER_ROLES = new Set(["ADMIN", "DEVELOPER"])

/**
 * Get a temporary Schematic access token for the current school
 *
 * This token allows a school administrator to access the Schematic customer
 * portal to manage the school's subscription plan.
 *
 * @returns Temporary access token or null if not authenticated / not allowed
 */
export async function getTemporaryAccessToken(): Promise<string | null> {
  try {
    // 1. Authenticate
    const session = await auth()

    if (!session?.user?.id) {
      logger.warn("getTemporaryAccessToken: No authenticated user")
      return null
    }

    // 2. Get tenant context (schoolId + role)
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      logger.warn("getTemporaryAccessToken: No schoolId found")
      return null
    }

    if (!role || !PLAN_MANAGER_ROLES.has(role)) {
      logger.warn(
        `getTemporaryAccessToken: role ${role ?? "none"} may not manage the school plan`
      )
      return null
    }

    // 3. Issue token for the school (company in Schematic terms)
    logger.info(`Issuing Schematic access token for school: ${schoolId}`)

    const resp = await schematicClient.accesstokens.issueTemporaryAccessToken({
      resource_type: "company",
      lookup: { id: schoolId }, // Use schoolId as the company identifier
    })

    if (!resp.data?.token) {
      logger.error("getTemporaryAccessToken: No token in response")
      return null
    }

    logger.info("Schematic access token issued successfully")
    return resp.data.token
  } catch (error) {
    logger.error("getTemporaryAccessToken error:", error)
    return null
  }
}
