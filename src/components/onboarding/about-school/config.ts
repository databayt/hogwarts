// About School step constants

export const ABOUT_SCHOOL_CONSTANTS = {
  STEP_NAME: "about-school",
  STEP_TITLE: "About Your School",
  STEP_DESCRIPTION: "Welcome! Let's start building your school profile.",
  ESTIMATED_TIME: "1 minute",
} as const

export const ONBOARDING_BENEFITS = [
  {
    title: "Complete Management System",
    description:
      "Manage students, teachers, classes, and schedules all in one place",
    icon: "building",
  },
  {
    title: "Easy Setup Process",
    description: "Our guided onboarding process takes just 10-15 minutes",
    icon: "clock",
  },
  {
    title: "Secure & Compliant",
    description: "Built with security and educational compliance in mind",
    icon: "shield",
  },
  {
    title: "Multi-tenant Ready",
    description: "Your school gets its own secure environment and subdomain",
    icon: "globe",
  },
] as const

export const ONBOARDING_STEPS_OVERVIEW = [
  {
    group: "Basic Information",
    steps: ["School Name", "Description", "Location"],
    description: "Essential details about your school",
  },
  {
    group: "School Setup",
    steps: ["Capacity", "Branding", "Import Data"],
    description: "Configure your school's operational details",
  },
  {
    group: "Business & Legal",
    steps: ["Pricing", "Legal Terms"],
    description: "Complete the business setup",
  },
] as const

export const WELCOME_MESSAGES = {
  FIRST_TIME: "Welcome to your school management system!",
  RETURNING: "Welcome back! Let's continue setting up your school.",
  ALMOST_DONE: "You're almost there! Just a few more steps.",
} as const
