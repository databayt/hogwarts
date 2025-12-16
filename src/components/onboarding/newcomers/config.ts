import {
  GraduationCap,
  Mail,
  Shield,
  User,
  UserCheck,
  Users,
} from "lucide-react"

import type {
  FormStep,
  FormStepGroup,
  MultiStepFormConfig,
} from "@/components/form"

import {
  infoStepSchema,
  profileStepSchema,
  roleStepSchema,
  verifyStepSchema,
} from "./validation"

/**
 * Newcomers Onboarding Configuration
 *
 * 5-step flow for internal school people to join:
 * 1. Role Selection - Choose role (teacher, staff, parent, student)
 * 2. Basic Info - Name, email, phone
 * 3. Email Verification - 6-digit code verification
 * 4. Profile Setup - Role-specific details
 * 5. Welcome - Success + pending approval notice
 */

export const NEWCOMER_ROLES = [
  {
    value: "teacher",
    label: "Teacher",
    description: "I teach classes at this school",
    icon: GraduationCap,
  },
  {
    value: "staff",
    label: "Staff",
    description: "I work in administration or support",
    icon: Users,
  },
  {
    value: "parent",
    label: "Parent/Guardian",
    description: "My child attends this school",
    icon: User,
  },
  {
    value: "student",
    label: "Student",
    description: "I am a student at this school",
    icon: GraduationCap,
  },
] as const

export type NewcomerRole = (typeof NEWCOMER_ROLES)[number]["value"]

export const NEWCOMER_STEPS: FormStep[] = [
  {
    id: "role",
    title: "Select Your Role",
    description: "Choose the role that best describes you",
    icon: UserCheck,
    fields: ["role"],
  },
  {
    id: "info",
    title: "Basic Information",
    description: "Tell us a bit about yourself",
    icon: User,
    fields: ["givenName", "surname", "email", "phone"],
  },
  {
    id: "verify",
    title: "Verify Email",
    description: "Enter the verification code sent to your email",
    icon: Mail,
    fields: ["verificationCode"],
  },
  {
    id: "profile",
    title: "Complete Profile",
    description: "Add details specific to your role",
    icon: Shield,
    fields: [], // Dynamic based on role
  },
  {
    id: "welcome",
    title: "Welcome!",
    description: "Your application has been submitted",
    optional: true, // No validation needed
  },
]

export const NEWCOMER_STEP_GROUPS: FormStepGroup[] = [
  {
    id: "identification",
    label: "Identification",
    steps: ["role", "info"],
  },
  {
    id: "verification",
    label: "Verification",
    steps: ["verify"],
  },
  {
    id: "completion",
    label: "Completion",
    steps: ["profile", "welcome"],
  },
]

export const NEWCOMER_CONFIG: MultiStepFormConfig = {
  steps: NEWCOMER_STEPS,
  groups: NEWCOMER_STEP_GROUPS,
  validation: {
    role: roleStepSchema,
    info: infoStepSchema,
    verify: verifyStepSchema,
    profile: profileStepSchema,
  },
  autoSave: true,
  autoSaveInterval: 30000,
  persistenceKey: "newcomer-onboarding-draft",
  analyticsFlowType: "newcomers",
}

// Teacher-specific fields
export const TEACHER_SUBJECTS = [
  { value: "math", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "arabic", label: "Arabic" },
  { value: "social", label: "Social Studies" },
  { value: "art", label: "Art" },
  { value: "pe", label: "Physical Education" },
  { value: "other", label: "Other" },
]

// Parent-specific fields
export const RELATIONSHIP_TYPES = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Legal Guardian" },
  { value: "other", label: "Other" },
]
