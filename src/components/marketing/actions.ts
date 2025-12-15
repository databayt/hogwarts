/**
 * Server actions for Marketing components
 *
 * Handles form submissions, lead capture, and marketing automation.
 */

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"

import {
  contactFormSchema,
  demoRequestSchema,
  feedbackSchema,
  leadCaptureSchema,
  newsletterSchema,
  trialSignupSchema,
  waitlistSchema,
} from "./validation"

/**
 * Submit contact form
 */
export async function submitContactForm(
  data: z.infer<typeof contactFormSchema>
) {
  try {
    const validated = contactFormSchema.parse(data)

    // In production, send email via Resend or save to DB
    // For now, we'll log it (replace with actual implementation)
    console.log("Contact form submission:", validated)

    // TODO: Send email notification
    // await sendEmail({
    //   to: process.env.CONTACT_EMAIL,
    //   subject: validated.subject || `Contact from ${validated.name}`,
    //   body: validated.message,
    // });

    return {
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
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

    // TODO: Add to email marketing platform (e.g., Mailchimp, ConvertKit)
    // TODO: Add Newsletter model to Prisma schema
    // await db.newsletter.create({
    //   data: {
    //     email: validated.email,
    //     firstName: validated.firstName,
    //     lastName: validated.lastName,
    //     subscribedAt: new Date(),
    //   },
    // });

    console.log("Newsletter subscription:", validated)

    return { success: true, message: "Successfully subscribed to newsletter!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "Subscription failed. Please try again." }
  }
}

/**
 * Request a demo
 */
export async function requestDemo(data: z.infer<typeof demoRequestSchema>) {
  try {
    const validated = demoRequestSchema.parse(data)

    // TODO: Add DemoRequest model to Prisma schema
    // await db.demoRequest.create({
    //   data: {
    //     schoolName: validated.schoolName,
    //     contactName: validated.contactName,
    //     email: validated.email,
    //     phone: validated.phone,
    //     numberOfStudents: validated.numberOfStudents,
    //     numberOfTeachers: validated.numberOfTeachers,
    //     preferredDate: validated.preferredDate,
    //     notes: validated.notes,
    //     status: "pending",
    //     createdAt: new Date(),
    //   },
    // });

    // TODO: Send confirmation email to requester
    // TODO: Notify sales team

    console.log("Demo request:", validated)

    return {
      success: true,
      message: "Demo request submitted! Our team will contact you soon.",
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return {
      success: false,
      error: "Failed to submit demo request. Please try again.",
    }
  }
}

/**
 * Start free trial
 */
export async function startFreeTrial(data: z.infer<typeof trialSignupSchema>) {
  try {
    const validated = trialSignupSchema.parse(data)

    // Check if subdomain is available
    const existingSchool = await db.school.findUnique({
      where: { domain: validated.subdomain },
    })

    if (existingSchool) {
      return {
        success: false,
        error: "This subdomain is already taken. Please choose another.",
      }
    }

    // Create school and admin user
    const school = await db.school.create({
      data: {
        name: validated.schoolName,
        domain: validated.subdomain,
        planType: "trial",
        isActive: true,
        // TODO: Add trialEndsAt field to School model in Prisma schema
        // trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
    })

    // TODO: Create admin user with Auth.js
    // TODO: Send welcome email with login instructions

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
    return { success: false, error: "Failed to start trial. Please try again." }
  }
}

/**
 * Capture lead (minimal email only)
 */
export async function captureLead(data: z.infer<typeof leadCaptureSchema>) {
  try {
    const validated = leadCaptureSchema.parse(data)

    // TODO: Add Lead model to Prisma schema
    // await db.lead.create({
    //   data: {
    //     email: validated.email,
    //     source: validated.source || "other",
    //     utmSource: validated.utmSource,
    //     utmMedium: validated.utmMedium,
    //     utmCampaign: validated.utmCampaign,
    //     capturedAt: new Date(),
    //   },
    // });

    console.log("Lead captured:", validated)

    return { success: true, message: "Thank you for your interest!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "Failed to capture lead." }
  }
}

/**
 * Submit feedback
 */
export async function submitFeedback(data: z.infer<typeof feedbackSchema>) {
  try {
    const validated = feedbackSchema.parse(data)

    // TODO: Add Feedback model to Prisma schema
    // await db.feedback.create({
    //   data: {
    //     email: validated.email,
    //     rating: validated.rating,
    //     category: validated.category,
    //     message: validated.message,
    //     canContact: validated.canContact,
    //     createdAt: new Date(),
    //   },
    // });

    console.log("Feedback submitted:", validated)

    return { success: true, message: "Thank you for your feedback!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "Failed to submit feedback." }
  }
}

/**
 * Join waitlist
 */
export async function joinWaitlist(data: z.infer<typeof waitlistSchema>) {
  try {
    const validated = waitlistSchema.parse(data)

    // TODO: Add Waitlist model to Prisma schema
    // await db.waitlist.create({
    //   data: {
    //     email: validated.email,
    //     schoolType: validated.schoolType,
    //     region: validated.region,
    //     estimatedStudents: validated.estimatedStudents,
    //     joinedAt: new Date(),
    //   },
    // });

    console.log("Waitlist joined:", validated)

    return { success: true, message: "You've been added to the waitlist!" }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "Failed to join waitlist." }
  }
}
