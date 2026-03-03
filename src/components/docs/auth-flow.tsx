"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Types
type FlowStepType = "start" | "decision" | "action" | "end" | "branch"

interface Credentials {
  email: string
  password: string
  role?: string
}

interface FlowStepData {
  id: string
  type: FlowStepType
  title: string
  description?: string
  url?: string
  credentials?: Credentials
  branches?: {
    label: string
    condition: string
    steps: FlowStepData[]
  }[]
}

// Copy button component
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy}>
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  )
}

// URL display component
function UrlDisplay({ url }: { url: string }) {
  return (
    <div className="bg-muted/50 mt-2 flex items-center gap-2 rounded-md px-3 py-1.5">
      <code className="text-muted-foreground flex-1 truncate font-mono text-xs">
        {url}
      </code>
      <CopyButton value={url} />
    </div>
  )
}

// Credentials display component
function CredentialsDisplay({ credentials }: { credentials: Credentials }) {
  return (
    <div className="bg-muted/30 mt-2 space-y-1.5 rounded-md p-3">
      <div className="text-muted-foreground mb-2 text-xs font-medium">
        Test Credentials
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">Email:</span>
        <div className="flex items-center gap-1">
          <code className="font-mono text-xs">{credentials.email}</code>
          <CopyButton value={credentials.email} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">Password:</span>
        <div className="flex items-center gap-1">
          <code className="font-mono text-xs">{credentials.password}</code>
          <CopyButton value={credentials.password} />
        </div>
      </div>
      {credentials.role && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">Role:</span>
          <Badge variant="outline" className="text-xs">
            {credentials.role}
          </Badge>
        </div>
      )}
    </div>
  )
}

// Individual flow step component
function FlowStep({
  step,
  isLast = false,
}: {
  step: FlowStepData
  isLast?: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="relative">
      {/* Step card */}
      <div className="relative rounded-lg p-4">
        {/* Step header */}
        <div>
          <h4 className="font-medium">{step.title}</h4>
          {step.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {step.description}
            </p>
          )}
        </div>

        {/* URL */}
        {step.url && <UrlDisplay url={step.url} />}

        {/* Credentials */}
        {step.credentials && (
          <CredentialsDisplay credentials={step.credentials} />
        )}

        {/* Branches */}
        {step.branches && step.branches.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {isOpen ? (
                  <ChevronDown className="me-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="me-2 h-4 w-4" />
                )}
                {step.branches.length} Possible Paths
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {step.branches.map((branch, idx) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="secondary">{branch.label}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {branch.condition}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {branch.steps.map((subStep, subIdx) => (
                      <FlowStep
                        key={subStep.id}
                        step={subStep}
                        isLast={subIdx === branch.steps.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Connector */}
      {!isLast && (
        <div className="flex justify-center py-1">
          <span className="text-muted-foreground text-xs">|</span>
        </div>
      )}
    </div>
  )
}

// Main flow diagram component
export function AuthFlowDiagram({
  title,
  description,
  steps,
}: {
  title: string
  description?: string
  steps: FlowStepData[]
}) {
  return (
    <div className="py-4">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-0">
        {steps.map((step, idx) => (
          <FlowStep
            key={step.id}
            step={step}
            isLast={idx === steps.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// PRESET FLOW DIAGRAMS
// ============================================

// Platform Link Flow
export function PlatformLinkFlow() {
  const steps: FlowStepData[] = [
    {
      id: "start",
      type: "start",
      title: 'Click "Platform" Link',
      description:
        "User clicks Platform link from school marketing site header",
      url: "https://demo.databayt.org/en",
    },
    {
      id: "auth-check",
      type: "decision",
      title: "Is User Logged In?",
      description: "Check if user has an active session",
      branches: [
        {
          label: "NO - Guest",
          condition: "No active session",
          steps: [
            {
              id: "redirect-login",
              type: "action",
              title: "Redirect to Login",
              description: "User is redirected to login page with callback URL",
              url: "https://demo.databayt.org/en/login?callbackUrl=/en/dashboard",
            },
            {
              id: "login-form",
              type: "action",
              title: "Login Form",
              description: "User enters credentials or uses OAuth",
              url: "https://demo.databayt.org/en/login",
              credentials: {
                email: "admin@databayt.org",
                password: "1234",
                role: "ADMIN",
              },
            },
            {
              id: "validate",
              type: "decision",
              title: "Valid Login?",
              branches: [
                {
                  label: "YES",
                  condition: "Credentials valid",
                  steps: [
                    {
                      id: "success-redirect",
                      type: "end",
                      title: "Redirect to Dashboard",
                      description:
                        "User is redirected to role-specific dashboard",
                      url: "https://demo.databayt.org/en/dashboard",
                    },
                  ],
                },
                {
                  label: "NO",
                  condition: "Invalid credentials",
                  steps: [
                    {
                      id: "error",
                      type: "end",
                      title: "Error Message",
                      description: "Show error and allow retry",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "YES - Authenticated",
          condition: "Active session exists",
          steps: [
            {
              id: "school-check",
              type: "decision",
              title: "Correct School?",
              description: "Check if user belongs to this school",
              branches: [
                {
                  label: "YES - Match",
                  condition: "User's schoolId matches subdomain",
                  steps: [
                    {
                      id: "role-check",
                      type: "decision",
                      title: "Check User Role",
                      branches: [
                        {
                          label: "ADMIN",
                          condition: "Full access",
                          steps: [
                            {
                              id: "admin-dash",
                              type: "end",
                              title: "Full Dashboard",
                              description: "Access to all school modules",
                              url: "https://demo.databayt.org/en/dashboard",
                              credentials: {
                                email: "admin@databayt.org",
                                password: "1234",
                                role: "ADMIN",
                              },
                            },
                          ],
                        },
                        {
                          label: "TEACHER",
                          condition: "Teacher access",
                          steps: [
                            {
                              id: "teacher-dash",
                              type: "end",
                              title: "Teacher Dashboard",
                              description:
                                "Classes, lessons, attendance, grades",
                              url: "https://demo.databayt.org/en/dashboard",
                              credentials: {
                                email: "teacher@databayt.org",
                                password: "1234",
                                role: "TEACHER",
                              },
                            },
                          ],
                        },
                        {
                          label: "STUDENT",
                          condition: "Student access",
                          steps: [
                            {
                              id: "student-dash",
                              type: "end",
                              title: "Student Dashboard",
                              description: "My classes, grades, assignments",
                              url: "https://demo.databayt.org/en/dashboard",
                              credentials: {
                                email: "student@databayt.org",
                                password: "1234",
                                role: "STUDENT",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  label: "NO - Wrong School",
                  condition: "User belongs to different school",
                  steps: [
                    {
                      id: "access-denied",
                      type: "end",
                      title: "Access Denied",
                      description: "User cannot access this school's dashboard",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  return (
    <AuthFlowDiagram
      title="Platform Link Flow"
      description="All possible scenarios when clicking 'Platform' from school marketing site"
      steps={steps}
    />
  )
}

// Get Started Flow
export function GetStartedFlow() {
  const steps: FlowStepData[] = [
    {
      id: "start",
      type: "start",
      title: 'Click "Get Started"',
      description: "User clicks Get Started button from SaaS marketing hero",
      url: "https://ed.databayt.org/en",
    },
    {
      id: "auth-check",
      type: "decision",
      title: "Is User Logged In?",
      branches: [
        {
          label: "NO - Guest",
          condition: "No active session",
          steps: [
            {
              id: "redirect-login",
              type: "action",
              title: "Redirect to Login",
              description: "Callback URL preserved for onboarding",
              url: "https://ed.databayt.org/en/login?callbackUrl=/en/onboarding",
            },
            {
              id: "auth-options",
              type: "action",
              title: "Choose Auth Method",
              description: "Google OAuth, Facebook OAuth, or Email/Password",
              url: "https://ed.databayt.org/en/login",
            },
            {
              id: "user-created",
              type: "action",
              title: "User Created/Found",
              description: "New user created with schoolId: null",
            },
            {
              id: "onboarding",
              type: "action",
              title: "Onboarding Wizard",
              description: "16-step wizard to create school",
              url: "https://ed.databayt.org/en/onboarding",
            },
            {
              id: "school-created",
              type: "end",
              title: "School Created",
              description: "User becomes ADMIN, redirected to school dashboard",
              url: "https://{subdomain}.databayt.org/en/dashboard",
            },
          ],
        },
        {
          label: "YES - Has School",
          condition: "User has schoolId",
          steps: [
            {
              id: "redirect-school",
              type: "end",
              title: "Redirect to School",
              description: "User already has a school, go to dashboard",
              url: "https://{school}.databayt.org/en/dashboard",
            },
          ],
        },
        {
          label: "YES - No School",
          condition: "User logged in but no schoolId",
          steps: [
            {
              id: "continue-onboarding",
              type: "end",
              title: "Continue to Onboarding",
              description: "Complete the school creation process",
              url: "https://ed.databayt.org/en/onboarding",
            },
          ],
        },
      ],
    },
  ]

  return (
    <AuthFlowDiagram
      title="Get Started Flow"
      description="School owner journey from marketing site to school creation"
      steps={steps}
    />
  )
}

// Live Demo Flow
export function LiveDemoFlow() {
  const steps: FlowStepData[] = [
    {
      id: "start",
      type: "start",
      title: 'Click "Live Demo"',
      description: "User clicks Live Demo button from SaaS marketing hero",
      url: "https://ed.databayt.org/en",
    },
    {
      id: "new-tab",
      type: "action",
      title: "Opens New Tab",
      description: "Demo school site opens in new browser tab",
      url: "https://demo.databayt.org/en",
    },
    {
      id: "browse",
      type: "action",
      title: "Browse Demo School",
      description:
        "Public marketing pages: homepage, about, academic programs, faculty",
      url: "https://demo.databayt.org/en",
    },
    {
      id: "decision",
      type: "decision",
      title: "User Action",
      branches: [
        {
          label: "Platform",
          condition: "Click Platform link",
          steps: [
            {
              id: "platform-flow",
              type: "action",
              title: "Platform Link Flow",
              description: "See Platform Link Flow diagram above",
              url: "https://demo.databayt.org/en/dashboard",
              credentials: {
                email: "admin@databayt.org",
                password: "1234",
                role: "ADMIN",
              },
            },
          ],
        },
        {
          label: "Apply",
          condition: "Click Apply button",
          steps: [
            {
              id: "apply",
              type: "end",
              title: "Application Form",
              description: "Start admission application",
              url: "https://demo.databayt.org/en/apply",
            },
          ],
        },
        {
          label: "Continue Browsing",
          condition: "Explore more pages",
          steps: [
            {
              id: "browse-more",
              type: "end",
              title: "Explore Pages",
              description: "Faculty, houses, events, contact",
              url: "https://demo.databayt.org/en",
            },
          ],
        },
      ],
    },
  ]

  return (
    <AuthFlowDiagram
      title="Live Demo Flow"
      description="User exploring the demo school site"
      steps={steps}
    />
  )
}

// Login Flow
export function LoginFlow() {
  const steps: FlowStepData[] = [
    {
      id: "start",
      type: "start",
      title: "Visit Login Page",
      description: "User navigates to login page from any entry point",
      url: "https://ed.databayt.org/en/login",
    },
    {
      id: "auth-options",
      type: "action",
      title: "Choose Auth Method",
      description: "Select Google, Facebook, or Email/Password",
      url: "https://ed.databayt.org/en/login",
    },
    {
      id: "authenticate",
      type: "decision",
      title: "Authentication",
      branches: [
        {
          label: "OAuth",
          condition: "Google or Facebook",
          steps: [
            {
              id: "oauth-redirect",
              type: "action",
              title: "OAuth Provider",
              description: "Redirect to Google/Facebook consent screen",
            },
            {
              id: "oauth-callback",
              type: "action",
              title: "Callback",
              description: "Handle OAuth callback and create/find user",
              url: "https://ed.databayt.org/api/auth/callback/google",
            },
          ],
        },
        {
          label: "Credentials",
          condition: "Email + Password",
          steps: [
            {
              id: "validate-creds",
              type: "action",
              title: "Validate Credentials",
              description: "Check email exists and password matches",
              credentials: {
                email: "dev@databayt.org",
                password: "1234",
                role: "DEVELOPER",
              },
            },
          ],
        },
      ],
    },
    {
      id: "redirect-decision",
      type: "decision",
      title: "Redirect Decision",
      description: "Determine where to send the user",
      branches: [
        {
          label: "DEVELOPER",
          condition: "role === DEVELOPER",
          steps: [
            {
              id: "operator-dash",
              type: "end",
              title: "Operator Dashboard",
              description: "Platform admin with all schools access",
              url: "https://ed.databayt.org/en/o",
              credentials: {
                email: "dev@databayt.org",
                password: "1234",
                role: "DEVELOPER",
              },
            },
          ],
        },
        {
          label: "Has School",
          condition: "schoolId exists",
          steps: [
            {
              id: "school-dash",
              type: "end",
              title: "School Dashboard",
              description: "Redirect to user's school",
              url: "https://{school}.databayt.org/en/dashboard",
              credentials: {
                email: "admin@databayt.org",
                password: "1234",
                role: "ADMIN",
              },
            },
          ],
        },
        {
          label: "No School",
          condition: "schoolId is null",
          steps: [
            {
              id: "onboarding",
              type: "end",
              title: "Onboarding",
              description: "Create or join a school",
              url: "https://ed.databayt.org/en/onboarding",
              credentials: {
                email: "user@databayt.org",
                password: "1234",
                role: "USER",
              },
            },
          ],
        },
      ],
    },
  ]

  return (
    <AuthFlowDiagram
      title="Login Flow"
      description="Complete authentication flow with role-based redirects"
      steps={steps}
    />
  )
}

// Logout Flow
export function LogoutFlow() {
  const steps: FlowStepData[] = [
    {
      id: "start",
      type: "start",
      title: "Click Logout",
      description: "User clicks logout from avatar dropdown menu",
    },
    {
      id: "context-check",
      type: "decision",
      title: "Determine Context",
      description: "Where is the user logging out from?",
      branches: [
        {
          label: "Marketing/Operator",
          condition: "Main domain (ed.databayt.org)",
          steps: [
            {
              id: "marketing-logout",
              type: "end",
              title: "Redirect to Homepage",
              description: "Session cleared, redirect to marketing homepage",
              url: "https://ed.databayt.org/en",
            },
          ],
        },
        {
          label: "School Platform",
          condition: "School subdomain ({school}.databayt.org)",
          steps: [
            {
              id: "school-logout",
              type: "end",
              title: "Redirect to School Site",
              description: "Session cleared, redirect to school public page",
              url: "https://demo.databayt.org/en",
            },
          ],
        },
      ],
    },
  ]

  return (
    <AuthFlowDiagram
      title="Logout Flow"
      description="Context-aware logout with appropriate redirects"
      steps={steps}
    />
  )
}

// DEVELOPER Dashboard Flow
export function DeveloperDashboardFlow() {
  const steps: FlowStepData[] = [
    {
      id: "start",
      type: "start",
      title: "Access SaaS Dashboard",
      description:
        "DEVELOPER navigates to the SaaS dashboard via login or direct URL",
      url: "https://ed.databayt.org/en/dashboard",
    },
    {
      id: "auth-method",
      type: "decision",
      title: "How Did User Arrive?",
      branches: [
        {
          label: "Via Login Icon",
          condition: "Click login from SaaS marketing",
          steps: [
            {
              id: "login-saas",
              type: "action",
              title: "Login with context=saas",
              description: "Login page knows user came from SaaS site",
              url: "https://ed.databayt.org/en/login?context=saas",
              credentials: {
                email: "dev@databayt.org",
                password: "1234",
                role: "DEVELOPER",
              },
            },
            {
              id: "role-check-login",
              type: "decision",
              title: "Check Role",
              branches: [
                {
                  label: "DEVELOPER",
                  condition: "role === DEVELOPER",
                  steps: [
                    {
                      id: "redirect-dash",
                      type: "end",
                      title: "Redirect to /dashboard",
                      description: "Auto-redirect after login",
                      url: "https://ed.databayt.org/en/dashboard",
                    },
                  ],
                },
                {
                  label: "Other Role",
                  condition: "USER, ADMIN, etc.",
                  steps: [
                    {
                      id: "stay-marketing",
                      type: "end",
                      title: "Stay on Marketing Page",
                      description:
                        "Non-DEVELOPER users stay on /en after SaaS login",
                      url: "https://ed.databayt.org/en",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Direct URL",
          condition: "Navigate to /dashboard directly",
          steps: [
            {
              id: "protected-route",
              type: "action",
              title: "Protected Route Check",
              description: "Redirect to login with callbackUrl",
              url: "https://ed.databayt.org/en/login?callbackUrl=/en/dashboard",
            },
            {
              id: "role-check-direct",
              type: "decision",
              title: "Check Role After Login",
              branches: [
                {
                  label: "DEVELOPER",
                  condition: "role === DEVELOPER",
                  steps: [
                    {
                      id: "access-dash",
                      type: "end",
                      title: "Access Dashboard",
                      description: "Callback URL honored, dashboard renders",
                      url: "https://ed.databayt.org/en/dashboard",
                    },
                  ],
                },
                {
                  label: "Other Role",
                  condition: "USER, ADMIN, etc.",
                  steps: [
                    {
                      id: "access-denied",
                      type: "end",
                      title: "Access Denied",
                      description: "Non-DEVELOPER redirected to /access-denied",
                      url: "https://ed.databayt.org/en/access-denied",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  return (
    <AuthFlowDiagram
      title="DEVELOPER Dashboard Flow"
      description="SaaS dashboard access — DEVELOPER-only with two entry paths"
      steps={steps}
    />
  )
}

// Onboarding Wizard Flow
export function OnboardingWizardFlow() {
  const steps: FlowStepData[] = [
    {
      id: "hub",
      type: "start",
      title: "Onboarding Hub",
      description: 'User arrives after clicking "Get Started" and logging in',
      url: "https://ed.databayt.org/en/onboarding",
    },
    {
      id: "about",
      type: "action",
      title: "1. About School",
      description: "Overview and introduction",
    },
    {
      id: "title",
      type: "action",
      title: "2. Title (Required)",
      description: "School name — the only required field in this section",
    },
    {
      id: "details",
      type: "action",
      title: "3-5. Description, Location, Stand Out",
      description:
        "School description & type, address & country, unique selling points",
    },
    {
      id: "setup",
      type: "action",
      title: "6-9. Capacity, Branding, Import, Finish Setup",
      description:
        "Max students/teachers, logo & colors, data import, final configuration",
    },
    {
      id: "community",
      type: "action",
      title: "10-11. Join, Visibility",
      description: "Invite staff/teachers, set public or private",
    },
    {
      id: "billing",
      type: "action",
      title: "12-13. Price, Discount",
      description: "Tuition fees and discount rules",
    },
    {
      id: "legal",
      type: "action",
      title: "14. Legal (Required)",
      description: "Terms of service and privacy policy acceptance",
    },
    {
      id: "subdomain",
      type: "action",
      title: "15. Subdomain (Required)",
      description: "Reserve {name}.databayt.org",
    },
    {
      id: "done",
      type: "end",
      title: "Congratulations!",
      description:
        "School created, user role upgraded from USER to ADMIN, redirected to new school dashboard",
      url: "https://{subdomain}.databayt.org/en/dashboard",
    },
  ]

  return (
    <AuthFlowDiagram
      title="Onboarding Wizard Flow"
      description="15-step school creation wizard — from hub to live school"
      steps={steps}
    />
  )
}

// Test Credentials Reference
export function TestCredentialsReference() {
  const credentials = [
    {
      email: "dev@databayt.org",
      password: "1234",
      role: "DEVELOPER",
      school: "Platform Admin",
    },
    {
      email: "admin@databayt.org",
      password: "1234",
      role: "ADMIN",
      school: "Demo School",
    },
    {
      email: "teacher@databayt.org",
      password: "1234",
      role: "TEACHER",
      school: "Demo School",
    },
    {
      email: "student@databayt.org",
      password: "1234",
      role: "STUDENT",
      school: "Demo School",
    },
    {
      email: "parent@databayt.org",
      password: "1234",
      role: "GUARDIAN",
      school: "Demo School",
    },
    {
      email: "accountant@databayt.org",
      password: "1234",
      role: "ACCOUNTANT",
      school: "Demo School",
    },
    {
      email: "staff@databayt.org",
      password: "1234",
      role: "STAFF",
      school: "Demo School",
    },
    {
      email: "user@databayt.org",
      password: "1234",
      role: "USER",
      school: "None (Onboarding)",
    },
  ]

  return (
    <div className="py-4">
      <h3 className="font-semibold">Test Credentials</h3>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        All accounts use password:{" "}
        <code className="bg-muted rounded px-1">1234</code>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {credentials.map((cred) => (
          <div
            key={cred.email}
            className="bg-muted/30 flex items-center justify-between rounded-lg p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm">{cred.email}</code>
                <CopyButton value={cred.email} />
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-xs">
                  {cred.role}
                </Badge>
                <span>{cred.school}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// URLs Reference
export function UrlsReference() {
  const urls = [
    {
      label: "SaaS Marketing",
      url: "https://ed.databayt.org/en",
      description: "Main marketing site",
    },
    {
      label: "Operator Dashboard",
      url: "https://ed.databayt.org/en/o",
      description: "Platform admin (DEVELOPER only)",
    },
    {
      label: "Login",
      url: "https://ed.databayt.org/en/login",
      description: "Authentication page",
    },
    {
      label: "Onboarding",
      url: "https://ed.databayt.org/en/onboarding",
      description: "School creation wizard",
    },
    {
      label: "Demo School Site",
      url: "https://demo.databayt.org/en",
      description: "Demo school marketing",
    },
    {
      label: "Demo Dashboard",
      url: "https://demo.databayt.org/en/dashboard",
      description: "Demo school platform",
    },
  ]

  return (
    <div className="py-4">
      <h3 className="font-semibold">Key URLs</h3>
      <div className="mt-4 space-y-3">
        {urls.map((item) => (
          <div key={item.url} className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.label}</span>
              <CopyButton value={item.url} />
            </div>
            <code className="text-muted-foreground mt-1 block text-sm">
              {item.url}
            </code>
            <p className="text-muted-foreground mt-1 text-xs">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
