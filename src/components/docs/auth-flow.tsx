"use client"

import { useState } from "react"
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  GitBranch,
  Key,
  Link2,
  Lock,
  LogIn,
  Shield,
  User,
  Users,
  X,
} from "lucide-react"

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
type FlowStatus = "success" | "error" | "warning" | "info" | "neutral"

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
  status?: FlowStatus
  icon?: React.ReactNode
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
    <div className="bg-muted/50 mt-2 flex items-center gap-2 rounded-md border px-3 py-1.5">
      <Link2 className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
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
    <div className="bg-muted/30 mt-2 space-y-1.5 rounded-md border p-3">
      <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
        <Key className="h-3 w-3" />
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

// Status badge component
function StatusBadge({ status }: { status: FlowStatus }) {
  const variants: Record<FlowStatus, { className: string; label: string }> = {
    success: {
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      label: "Success",
    },
    error: {
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      label: "Error",
    },
    warning: {
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      label: "Warning",
    },
    info: {
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: "Info",
    },
    neutral: { className: "bg-muted text-muted-foreground", label: "Neutral" },
  }

  return (
    <Badge
      variant="outline"
      className={cn("text-xs", variants[status].className)}
    >
      {variants[status].label}
    </Badge>
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

  const getStepIcon = () => {
    if (step.icon) return step.icon
    switch (step.type) {
      case "start":
        return <User className="h-4 w-4" />
      case "decision":
        return <GitBranch className="h-4 w-4" />
      case "action":
        return <ArrowRight className="h-4 w-4" />
      case "end":
        return <Check className="h-4 w-4" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  const getStepColor = () => {
    switch (step.type) {
      case "start":
        return "border-blue-500 bg-blue-500/10"
      case "decision":
        return "border-amber-500 bg-amber-500/10"
      case "action":
        return "border-border bg-background"
      case "end":
        return "border-green-500 bg-green-500/10"
      default:
        return "border-border bg-background"
    }
  }

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="bg-border absolute top-12 bottom-0 left-5 w-px" />
      )}

      {/* Step card */}
      <div className={cn("relative rounded-lg border-2 p-4", getStepColor())}>
        {/* Step header */}
        <div className="flex items-start gap-3">
          <div className="bg-background flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2">
            {getStepIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{step.title}</h4>
              {step.status && <StatusBadge status={step.status} />}
            </div>
            {step.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {step.description}
              </p>
            )}
          </div>
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
              <Button variant="outline" size="sm" className="w-full">
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
                <div key={idx} className="bg-muted/30 rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant={idx === 0 ? "default" : "secondary"}>
                      {branch.label}
                    </Badge>
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

      {/* Arrow to next step */}
      {!isLast && (
        <div className="flex justify-center py-2">
          <ArrowDown className="text-muted-foreground h-5 w-5" />
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
    <div className="rounded-xl border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
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
      icon: <ExternalLink className="h-4 w-4" />,
    },
    {
      id: "auth-check",
      type: "decision",
      title: "Is User Logged In?",
      description: "Check if user has an active session",
      icon: <Shield className="h-4 w-4" />,
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
                      status: "success",
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
                      status: "error",
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
                              status: "success",
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
                              status: "success",
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
                              status: "success",
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
                      status: "error",
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
      icon: <ExternalLink className="h-4 w-4" />,
    },
    {
      id: "auth-check",
      type: "decision",
      title: "Is User Logged In?",
      icon: <Shield className="h-4 w-4" />,
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
              status: "info",
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
              status: "success",
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
              status: "success",
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
              status: "info",
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
      icon: <ExternalLink className="h-4 w-4" />,
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
              status: "info",
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
              status: "neutral",
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
      icon: <LogIn className="h-4 w-4" />,
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
              status: "success",
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
              status: "success",
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
              status: "info",
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
      icon: <Lock className="h-4 w-4" />,
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
              status: "success",
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
              status: "success",
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
    <div className="rounded-xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Key className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Test Credentials</h3>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Use these accounts to test different user journeys. All accounts use
        password: <code className="bg-muted rounded px-1">1234</code>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {credentials.map((cred) => (
          <div
            key={cred.email}
            className="bg-muted/30 flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm">{cred.email}</code>
                <CopyButton value={cred.email} />
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
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
    <div className="rounded-xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Key URLs</h3>
      </div>
      <div className="space-y-3">
        {urls.map((item) => (
          <div key={item.url} className="bg-muted/30 rounded-lg border p-3">
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
