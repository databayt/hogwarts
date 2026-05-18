// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server actions for Marketing components
 *
 * Handles form submissions, lead capture, and saas-marketing automation.
 *
 * Persistence: writes to `Prospect` (cold/inbound layer). On founder reply,
 * `promoteToLead(prospectId)` upgrades the row to a tenant-bound `Lead`.
 */

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

import {
  contactFormSchema,
  demoRequestSchema,
  feedbackSchema,
  leadCaptureSchema,
  newsletterSchema,
  trialSignupSchema,
  waitlistSchema,
} from "./validation"

const SALES_INBOX = process.env.SALES_NOTIFY_EMAIL ?? "hi@databayt.org"

async function notifySales(subject: string, data: Record<string, unknown>) {
  try {
    await sendEmail({
      to: SALES_INBOX,
      subject,
      template: "sales-notify",
      data,
    })
  } catch (err) {
    console.error("[sales] notify failed", err)
  }
}

/**
 * Upsert a Prospect by email. Inbound forms = self-identified, so they land
 * with status="replied" -- they bypass the cold queue and go straight to the
 * founder's reply SLA bucket.
 */
async function upsertInboundProspect(args: {
  email: string
  name?: string
  phone?: string
  website?: string
  country?: string
  source: string
  studentCountEstimate?: number
  tags?: string[]
  notes?: string
  status?: string
  rawPayload?: Record<string, unknown>
}) {
  const status = args.status ?? "replied"

  return db.prospect.upsert({
    where: {
      gmapsPlaceId: `inbound:${args.email}`, // synthetic unique key for inbound rows
    },
    create: {
      gmapsPlaceId: `inbound:${args.email}`,
      name: args.name ?? args.email,
      email: args.email,
      phone: args.phone,
      website: args.website,
      country: args.country ?? "unknown",
      source: args.source,
      status,
      studentCountEstimate: args.studentCountEstimate,
      tags: args.tags ?? [],
      notes: args.notes,
      lastTouchAt: new Date(),
    },
    update: {
      status,
      lastTouchAt: new Date(),
      tags: args.tags ?? [],
      ...(args.name ? { name: args.name } : {}),
      ...(args.phone ? { phone: args.phone } : {}),
      ...(args.website ? { website: args.website } : {}),
      ...(args.country ? { country: args.country } : {}),
      ...(args.studentCountEstimate !== undefined
        ? { studentCountEstimate: args.studentCountEstimate }
        : {}),
      ...(args.notes ? { notes: args.notes } : {}),
    },
  })
}

/**
 * Submit contact form
 */
export async function submitContactForm(
  data: z.infer<typeof contactFormSchema>
) {
  try {
    const validated = contactFormSchema.parse(data)

    await upsertInboundProspect({
      email: validated.email,
      name: validated.name,
      phone: validated.phone,
      source: "website_contact",
      notes: [validated.subject, validated.message]
        .filter(Boolean)
        .join("\n\n"),
      tags: ["contact_form"],
    })

    await notifySales(
      validated.subject ?? `Contact from ${validated.name}`,
      validated
    )

    return {
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] submitContactForm failed", error)
    return { success: false, error: "Failed to submit form. Please try again." }
  }
}

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(
  data: z.infer<typeof newsletterSchema>
) {
  try {
    const validated = newsletterSchema.parse(data)

    const fullName = [validated.firstName, validated.lastName]
      .filter(Boolean)
      .join(" ")

    await upsertInboundProspect({
      email: validated.email,
      name: fullName || undefined,
      source: "newsletter",
      status: "new",
      tags: ["newsletter"],
    })

    return { success: true, message: "Successfully subscribed to newsletter!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] subscribeToNewsletter failed", error)
    return { success: false, error: "Subscription failed. Please try again." }
  }
}

/**
 * Request a demo
 */
export async function requestDemo(data: z.infer<typeof demoRequestSchema>) {
  try {
    const validated = demoRequestSchema.parse(data)

    await upsertInboundProspect({
      email: validated.email,
      name: validated.contactName,
      phone: validated.phone,
      source: "demo_request",
      studentCountEstimate: validated.numberOfStudents,
      tags: ["demo_request"],
      notes: [
        `School: ${validated.schoolName}`,
        `Teachers: ${validated.numberOfTeachers}`,
        validated.preferredDate
          ? `Preferred: ${validated.preferredDate.toISOString()}`
          : null,
        validated.notes,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    await notifySales(`Demo request: ${validated.schoolName}`, validated)

    return {
      success: true,
      message: "Demo request submitted! Our team will contact you soon.",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] requestDemo failed", error)
    return {
      success: false,
      error: "Failed to submit demo request. Please try again.",
    }
  }
}

/**
 * Start free trial -- creates a real School tenant (kept as-is)
 */
export async function startFreeTrial(data: z.infer<typeof trialSignupSchema>) {
  try {
    const validated = trialSignupSchema.parse(data)

    const existingSchool = await db.school.findUnique({
      where: { domain: validated.subdomain },
    })

    if (existingSchool) {
      return {
        success: false,
        error: "This subdomain is already taken. Please choose another.",
      }
    }

    const school = await db.school.create({
      data: {
        name: validated.schoolName,
        domain: validated.subdomain,
        planType: "trial",
        isActive: true,
        // TODO: Add trialEndsAt field to School model in Prisma schema
        // trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    // Mark the inbound prospect as promoted so the cold pipeline drops it
    await db.prospect.updateMany({
      where: { email: validated.adminEmail },
      data: { status: "promoted", lastTouchAt: new Date() },
    })

    await notifySales(
      `Trial started: ${validated.schoolName} (${validated.subdomain})`,
      validated
    )

    revalidatePath("/")

    return {
      success: true,
      message:
        "Trial started successfully! Check your email for login instructions.",
      data: { schoolId: school.id, subdomain: school.domain },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] startFreeTrial failed", error)
    return { success: false, error: "Failed to start trial. Please try again." }
  }
}

/**
 * Capture lead (minimal email only)
 */
export async function captureLead(data: z.infer<typeof leadCaptureSchema>) {
  try {
    const validated = leadCaptureSchema.parse(data)

    await upsertInboundProspect({
      email: validated.email,
      source: validated.source ? `lead_${validated.source}` : "lead_capture",
      tags: ["lead_capture"],
      notes: [
        validated.utmSource ? `utm_source=${validated.utmSource}` : null,
        validated.utmMedium ? `utm_medium=${validated.utmMedium}` : null,
        validated.utmCampaign ? `utm_campaign=${validated.utmCampaign}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    })

    return { success: true, message: "Thank you for your interest!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] captureLead failed", error)
    return { success: false, error: "Failed to capture lead." }
  }
}

/**
 * Submit feedback -- not a sales channel; left as log-only for now
 */
export async function submitFeedback(data: z.infer<typeof feedbackSchema>) {
  try {
    const validated = feedbackSchema.parse(data)

    if (validated.canContact && validated.email) {
      await upsertInboundProspect({
        email: validated.email,
        source: "feedback",
        status: "new",
        tags: ["feedback", validated.category],
        notes: `Rating: ${validated.rating}/5\n${validated.message}`,
      })
    }

    await notifySales(
      `Feedback (${validated.category}, ${validated.rating}/5)`,
      validated
    )

    return { success: true, message: "Thank you for your feedback!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] submitFeedback failed", error)
    return { success: false, error: "Failed to submit feedback." }
  }
}

/**
 * Join waitlist
 */
export async function joinWaitlist(data: z.infer<typeof waitlistSchema>) {
  try {
    const validated = waitlistSchema.parse(data)

    await upsertInboundProspect({
      email: validated.email,
      country: validated.region,
      source: "waitlist",
      studentCountEstimate: validated.estimatedStudents,
      tags: [
        "waitlist",
        validated.schoolType ? `type:${validated.schoolType}` : null,
      ].filter((t): t is string => Boolean(t)),
    })

    await notifySales(`Waitlist: ${validated.email}`, validated)

    return { success: true, message: "You've been added to the waitlist!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error("[sales] joinWaitlist failed", error)
    return { success: false, error: "Failed to join waitlist." }
  }
}
