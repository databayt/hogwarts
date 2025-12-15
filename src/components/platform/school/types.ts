import {
  Announcement,
  Classroom,
  Department,
  Guardian,
  School,
  SchoolYear,
  Student,
  Subscription,
  SubscriptionTier,
  Teacher,
  Term,
  User,
  YearLevel,
} from "@prisma/client"

// Admin Dashboard Stats
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTeachers: number
  totalStudents: number
  totalGuardians: number
  totalDepartments: number
  totalClassrooms: number
  activeSessions: number
  failedLogins: number
  systemHealthScore: number
  pendingApprovals: number
  activeIntegrations: number
  totalAnnouncements: number
  activeSubscriptions: number
}

// Configuration Types
export interface SchoolConfiguration {
  school: School & {
    branding?: {
      logo?: string
      primaryColor?: string
      secondaryColor?: string
    }
  }
  academicYears: SchoolYear[]
  terms: Term[]
  yearLevels: YearLevel[]
  departments: Department[]
  classrooms: Classroom[]
}

export interface GradingConfiguration {
  scales: {
    id: string
    name: string
    minScore: number
    maxScore: number
    passingScore: number
  }[]
  scoreRanges: {
    id: string
    grade: string
    minScore: number
    maxScore: number
    gpa: number
    description?: string
  }[]
}

// Membership Types
export interface UserWithDetails extends User {
  teacher?: Teacher | null
  student?: Student | null
  guardian?: Guardian | null
  _count?: {
    sessions: number
  }
}

export interface RolePermission {
  role: string
  permissions: string[]
  description: string
}

export interface BulkImportResult {
  success: number
  failed: number
  errors: {
    row: number
    message: string
  }[]
}

// System Types
export interface SystemHealth {
  database: {
    status: "healthy" | "degraded" | "down"
    responseTime: number
    connections: number
  }
  cache: {
    status: "healthy" | "degraded" | "down"
    hitRate: number
    memory: number
  }
  storage: {
    status: "healthy" | "degraded" | "down"
    used: number
    total: number
  }
  api: {
    status: "healthy" | "degraded" | "down"
    requestsPerMinute: number
    errorRate: number
  }
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: Date
}

export interface BackupInfo {
  id: string
  name: string
  type: "full" | "incremental"
  size: number
  createdAt: Date
  status: "completed" | "in-progress" | "failed"
}

// Integration Types
export interface OAuthProvider {
  name: "google" | "facebook" | "github" | "microsoft"
  enabled: boolean
  clientId: string
  callbackUrl: string
  scopes: string[]
}

export interface EmailSettings {
  provider: "resend" | "sendgrid" | "ses" | "smtp"
  apiKey?: string
  fromEmail: string
  fromName: string
  replyTo?: string
  testMode: boolean
}

export interface PaymentGateway {
  provider: "stripe" | "paypal" | "razorpay"
  enabled: boolean
  publicKey: string
  webhookEndpoint: string
  testMode: boolean
}

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  active: boolean
  secret: string
  failureCount: number
  lastTriggered?: Date
}

// Security Types
export interface SecurityPolicy {
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecialChars: boolean
  passwordExpiryDays: number
  maxLoginAttempts: number
  sessionTimeout: number
  twoFactorRequired: boolean
  ipWhitelist: string[]
  ipBlacklist: string[]
}

export interface SecurityEvent {
  id: string
  type:
    | "login_failed"
    | "password_reset"
    | "permission_denied"
    | "suspicious_activity"
  userId?: string
  ipAddress: string
  userAgent: string
  details: string
  createdAt: Date
}

export interface ActiveSession {
  id: string
  userId: string
  userName: string
  userRole: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActivity: Date
  expires: Date
}

// Reports Types
export interface ReportConfig {
  id: string
  name: string
  type: "users" | "finance" | "academic" | "attendance" | "custom"
  schedule?: "daily" | "weekly" | "monthly"
  recipients: string[]
  filters: Record<string, any>
  columns: string[]
  format: "pdf" | "excel" | "csv"
}

export interface AnalyticsData {
  userGrowth: {
    date: string
    users: number
    teachers: number
    students: number
  }[]
  activityMetrics: {
    date: string
    logins: number
    pageViews: number
    activeUsers: number
  }[]
  performanceMetrics: {
    responseTime: number[]
    errorRate: number[]
    uptime: number
  }
}

// Communication Types
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  type: "welcome" | "reset_password" | "announcement" | "custom"
}

export interface BroadcastMessage {
  id: string
  title: string
  content: string
  recipients: "all" | "teachers" | "students" | "parents" | "custom"
  customRecipients?: string[]
  scheduled?: Date
  status: "draft" | "scheduled" | "sent"
  sentCount: number
}

export interface NotificationSetting {
  type: string
  enabled: boolean
  channels: ("email" | "sms" | "push" | "in-app")[]
  recipients: string[]
}

// Subscription Types
export interface SubscriptionTierWithDetails extends SubscriptionTier {
  _count: {
    subscriptions: number
  }
  features: string[]
}

export interface BillingSettings {
  currency: string
  taxRate: number
  invoicePrefix: string
  invoiceStartNumber: number
  paymentTerms: number
  reminderDays: number[]
  lateFeePercentage: number
}

export interface DiscountCode {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  maxUses: number
  usedCount: number
  validFrom: Date
  validTo: Date
  active: boolean
}

// Admin Action Types
export interface AdminAction {
  type: "create" | "update" | "delete" | "import" | "export" | "configure"
  resource: string
  data?: Record<string, any>
  schoolId: string
  userId: string
  timestamp: Date
}
