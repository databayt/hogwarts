/**
 * Validation schemas for Marketing components
 *
 * Zod schemas for contact forms, newsletter signups, and lead generation.
 */

import { z } from "zod";

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject is too long").optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message is too long"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number").optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Newsletter subscription schema
 */
export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to receive marketing emails",
  }),
});

export type NewsletterData = z.infer<typeof newsletterSchema>;

/**
 * Demo request schema
 */
export const demoRequestSchema = z.object({
  schoolName: z.string().min(2, "School name is required").max(200, "School name is too long"),
  contactName: z.string().min(2, "Contact name is required").max(100, "Contact name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  numberOfStudents: z.number().int().positive("Number of students must be positive").max(100000, "Number exceeds maximum"),
  numberOfTeachers: z.number().int().positive("Number of teachers must be positive").max(10000, "Number exceeds maximum"),
  preferredDate: z.date().min(new Date(), "Date must be in the future").optional(),
  notes: z.string().max(500, "Notes are too long").optional(),
});

export type DemoRequestData = z.infer<typeof demoRequestSchema>;

/**
 * Trial signup schema
 */
export const trialSignupSchema = z.object({
  schoolName: z.string().min(2, "School name is required").max(200, "School name is too long"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain is too long")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  adminEmail: z.string().email("Please enter a valid email address"),
  adminName: z.string().min(2, "Name is required").max(100, "Name is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type TrialSignupData = z.infer<typeof trialSignupSchema>;

/**
 * Lead capture schema (simplified)
 */
export const leadCaptureSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  source: z.enum(["homepage", "pricing", "features", "blog", "other"]).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type LeadCaptureData = z.infer<typeof leadCaptureSchema>;

/**
 * Feedback form schema
 */
export const feedbackSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional(),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  category: z.enum(["feature_request", "bug_report", "general_feedback", "other"]),
  message: z.string().min(10, "Feedback must be at least 10 characters").max(1000, "Feedback is too long"),
  canContact: z.boolean().default(false),
});

export type FeedbackData = z.infer<typeof feedbackSchema>;

/**
 * Waitlist signup schema
 */
export const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  schoolType: z.enum(["primary", "secondary", "university", "other"]).optional(),
  region: z.string().max(100, "Region is too long").optional(),
  estimatedStudents: z.number().int().positive().optional(),
});

export type WaitlistData = z.infer<typeof waitlistSchema>;
