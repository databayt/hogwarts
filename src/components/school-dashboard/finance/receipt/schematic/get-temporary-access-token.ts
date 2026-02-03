"use server"

import { auth } from "@/auth"

import { logger } from "@/lib/logger"
import { getTenantContext } from "@/lib/tenant-context"

import { schematicClient } from "./client"

/**
 * Get a temporary Schematic access token for the current user/school
 *
 * This token allows the user to access the Schematic customer portal
 * to manage their subscription plan.
 *
 * @returns Temporary access token or null if not authenticated
 */
export async function getTemporaryAccessToken(): Promise<string | null> {
  try {
    // 1. Authenticate
    const session = await auth()

    if (!session?.user?.id) {
      logger.warn("getTemporaryAccessToken: No authenticated user")
      return null
    }

    // 2. Get tenant context (schoolId)
    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      logger.warn("getTemporaryAccessToken: No schoolId found")
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
