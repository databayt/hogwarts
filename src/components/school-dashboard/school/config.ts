// Admin Configuration Constants

export const ADMIN_ROLES = {
  DEVELOPER: "DEVELOPER",
  ADMIN: "ADMIN",
} as const

export const USER_ROLES = {
  DEVELOPER: "DEVELOPER",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  GUARDIAN: "GUARDIAN",
  ACCOUNTANT: "ACCOUNTANT",
  STAFF: "STAFF",
  USER: "USER",
} as const

export const ROLE_PERMISSIONS = {
  DEVELOPER: [
    "all:*", // Full access to everything
  ],
  ADMIN: [
    "school:manage",
    "users:manage",
    "settings:manage",
    "reports:view",
    "audit:view",
    "integration:manage",
    "communication:manage",
    "subscription:manage",
  ],
  TEACHER: [
    "students:view",
    "classes:manage",
    "grades:manage",
    "attendance:manage",
    "assignments:manage",
    "reports:view:own",
  ],
  STUDENT: [
    "profile:view:own",
    "grades:view:own",
    "attendance:view:own",
    "assignments:view:own",
    "assignments:submit",
  ],
  GUARDIAN: [
    "students:view:children",
    "grades:view:children",
    "attendance:view:children",
    "fees:view:children",
    "fees:pay",
  ],
  ACCOUNTANT: [
    "finance:manage",
    "fees:manage",
    "invoices:manage",
    "reports:view:finance",
  ],
  STAFF: ["profile:view:own", "announcements:view"],
  USER: ["profile:view:own"],
} as const

export const SYSTEM_STATUS = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  DOWN: "down",
} as const

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  IMPORT: "IMPORT",
  EXPORT: "EXPORT",
  CONFIGURE: "CONFIGURE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
} as const

export const OAUTH_PROVIDERS = {
  GOOGLE: {
    name: "google",
    displayName: "Google",
    icon: "google",
    scopes: ["email", "profile"],
  },
  FACEBOOK: {
    name: "facebook",
    displayName: "Facebook",
    icon: "facebook",
    scopes: ["email", "public_profile"],
  },
  GITHUB: {
    name: "github",
    displayName: "GitHub",
    icon: "github",
    scopes: ["user:email", "read:user"],
  },
  MICROSOFT: {
    name: "microsoft",
    displayName: "Microsoft",
    icon: "microsoft",
    scopes: ["openid", "profile", "email"],
  },
} as const

export const EMAIL_PROVIDERS = {
  RESEND: {
    name: "resend",
    displayName: "Resend",
    requiresApiKey: true,
  },
  SENDGRID: {
    name: "sendgrid",
    displayName: "SendGrid",
    requiresApiKey: true,
  },
  SES: {
    name: "ses",
    displayName: "Amazon SES",
    requiresApiKey: true,
  },
  SMTP: {
    name: "smtp",
    displayName: "Custom SMTP",
    requiresApiKey: false,
  },
} as const

export const PAYMENT_GATEWAYS = {
  STRIPE: {
    name: "stripe",
    displayName: "Stripe",
    icon: "stripe",
    supportedCurrencies: ["USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"],
  },
  PAYPAL: {
    name: "paypal",
    displayName: "PayPal",
    icon: "paypal",
    supportedCurrencies: ["USD", "EUR", "GBP", "AUD", "CAD"],
  },
  RAZORPAY: {
    name: "razorpay",
    displayName: "Razorpay",
    icon: "razorpay",
    supportedCurrencies: ["INR", "USD", "EUR", "GBP", "SGD", "AED"],
  },
} as const

export const SECURITY_EVENTS = {
  LOGIN_FAILED: "login_failed",
  PASSWORD_RESET: "password_reset",
  PERMISSION_DENIED: "permission_denied",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  TWO_FACTOR_ENABLED: "two_factor_enabled",
  TWO_FACTOR_DISABLED: "two_factor_disabled",
  SESSION_EXPIRED: "session_expired",
  IP_BLOCKED: "ip_blocked",
} as const

export const REPORT_TYPES = {
  USERS: "users",
  FINANCE: "finance",
  ACADEMIC: "academic",
  ATTENDANCE: "attendance",
  ACTIVITY: "activity",
  SECURITY: "security",
  CUSTOM: "custom",
} as const

export const REPORT_FORMATS = {
  PDF: "pdf",
  EXCEL: "excel",
  CSV: "csv",
  JSON: "json",
} as const

export const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  IN_APP: "in-app",
} as const

export const DEFAULT_SECURITY_POLICY = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: false,
  passwordExpiryDays: 90,
  maxLoginAttempts: 5,
  sessionTimeout: 1440, // 24 hours in minutes
  twoFactorRequired: false,
  ipWhitelist: [],
  ipBlacklist: [],
} as const

export const DEFAULT_BILLING_SETTINGS = {
  currency: "USD",
  taxRate: 0,
  invoicePrefix: "INV",
  invoiceStartNumber: 1000,
  paymentTerms: 30,
  reminderDays: [7, 3, 1],
  lateFeePercentage: 5,
} as const

export const SUBSCRIPTION_FEATURES = {
  BASIC: [
    "Up to 100 students",
    "Basic reporting",
    "Email support",
    "Standard features",
  ],
  PROFESSIONAL: [
    "Up to 500 students",
    "Advanced reporting",
    "Priority email support",
    "All standard features",
    "Custom branding",
    "API access",
  ],
  ENTERPRISE: [
    "Unlimited students",
    "Custom reporting",
    "24/7 phone support",
    "All features",
    "White labeling",
    "Dedicated account manager",
    "Custom integrations",
  ],
} as const

export const CACHE_KEYS = {
  ADMIN_STATS: "admin:stats",
  SYSTEM_HEALTH: "admin:system:health",
  AUDIT_LOGS: "admin:audit:logs",
  USER_SESSIONS: "admin:sessions",
  SECURITY_EVENTS: "admin:security:events",
} as const

export const CACHE_TTL = {
  ADMIN_STATS: 60, // 1 minute
  SYSTEM_HEALTH: 30, // 30 seconds
  AUDIT_LOGS: 300, // 5 minutes
  USER_SESSIONS: 60, // 1 minute
  SECURITY_EVENTS: 120, // 2 minutes
} as const
