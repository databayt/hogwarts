// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Expire Invitations & Send Reminders
 *
 * Two responsibilities:
 * 1. Auto-expire PENDING invitations past their expiresAt date
 * 2. Send reminder emails for invitations expiring within 3 days
 *
 * TRIGGER: Vercel Cron (daily) or manual POST with Bearer token
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET
 * 2. Find and expire overdue PENDING invitations (set REJECTED + reason)
 * 3. Find invitations expiring soon and send reminder emails
 * 4. Return JSON report with counts
 *
 * @see https://vercel.com/docs/cron-jobs
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { REMINDER_COOLDOWN_HOURS } from "@/lib/invitation-utils"

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[expire-invitations] CRON_SECRET not configured")
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startTime = Date.now()

    // --- Step 1: Expire overdue invitations ---
    const expiredResult = await db.membershipRequest.updateMany({
      where: {
        status: "PENDING",
        joinMethod: "INVITATION",
        expiresAt: { lt: now },
      },
      data: {
        status: "REJECTED",
        rejectionReason: "Invitation expired",
        reviewedAt: now,
      },
    })

    if (expiredResult.count > 0) {
      console.log(
        `[expire-invitations] Expired ${expiredResult.count} invitations`
      )
    }

    // --- Step 2: Send reminders for soon-to-expire invitations ---
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const cooldownCutoff = new Date(
      now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000
    )

    const expiringInvitations = await db.membershipRequest.findMany({
      where: {
        status: "PENDING",
        joinMethod: "INVITATION",
        expiresAt: {
          gt: now,
          lte: threeDaysFromNow,
        },
        OR: [{ lastResentAt: null }, { lastResentAt: { lt: cooldownCutoff } }],
      },
      include: {
        school: { select: { name: true, domain: true } },
      },
    })

    let remindersSent = 0

    for (const invitation of expiringInvitations) {
      const schoolName = invitation.school?.name || "School Portal"
      const subdomain = invitation.school?.domain || ""
      const daysLeft = Math.ceil(
        ((invitation.expiresAt?.getTime() ?? 0) - now.getTime()) /
          (24 * 60 * 60 * 1000)
      )

      try {
        await sendEmail({
          to: invitation.email,
          subject: `Reminder: Your invitation to ${schoolName} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
          template: "invitation-reminder",
          data: {
            schoolName,
            role: invitation.requestedRole,
            daysLeft,
            portalUrl: subdomain
              ? `https://${subdomain}.databayt.org`
              : "https://ed.databayt.org",
          },
        })

        // Update lastResentAt to prevent re-sending within cooldown
        await db.membershipRequest.update({
          where: { id: invitation.id },
          data: { lastResentAt: now },
        })

        remindersSent++
      } catch (emailError) {
        console.error(
          `[expire-invitations] Failed to send reminder to ${invitation.email}:`,
          emailError
        )
      }
    }

    if (remindersSent > 0) {
      console.log(`[expire-invitations] Sent ${remindersSent} reminder emails`)
    }

    return NextResponse.json({
      success: true,
      expired: expiredResult.count,
      reminders: remindersSent,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[expire-invitations] Error:", error)

    return NextResponse.json(
      {
        error: "Failed to process invitation expiry",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
