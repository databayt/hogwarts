import { z } from "zod";

// User settings validation schemas
export const userNameSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(32, "Name must be 32 characters or less")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
});

// Dashboard filter schemas
export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
}).refine((data) => data.to >= data.from, {
  message: "End date must be after start date",
});

export const dashboardFilterSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  studentId: z.string().optional(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  notificationTypes: z.object({
    announcements: z.boolean().default(true),
    grades: z.boolean().default(true),
    attendance: z.boolean().default(true),
    assignments: z.boolean().default(true),
    events: z.boolean().default(true),
    emergencies: z.boolean().default(true),
  }),
});

// Dashboard widget configuration schema
export const dashboardWidgetSchema = z.object({
  id: z.string(),
  type: z.enum([
    "stats",
    "chart",
    "table",
    "calendar",
    "announcements",
    "tasks",
  ]),
  title: z.string(),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(1).max(12),
    h: z.number().min(1).max(12),
  }),
  settings: z.record(z.string(), z.any()).optional(),
  visible: z.boolean().default(true),
});

export const dashboardLayoutSchema = z.object({
  widgets: z.array(dashboardWidgetSchema),
  columns: z.number().min(1).max(12).default(12),
  rowHeight: z.number().min(10).max(200).default(60),
});

// Quick action schemas
export const quickActionSchema = z.object({
  action: z.enum([
    "take_attendance",
    "create_announcement",
    "add_grade",
    "schedule_exam",
    "message_parent",
    "generate_report",
  ]),
  data: z.record(z.string(), z.any()).optional(),
});

// Dashboard search schema
export const dashboardSearchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum([
    "all",
    "students",
    "teachers",
    "classes",
    "subjects",
    "assignments",
    "exams",
  ]).default("all"),
});

// Export types
export type UserName = z.infer<typeof userNameSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>;
export type DashboardLayout = z.infer<typeof dashboardLayoutSchema>;
export type QuickAction = z.infer<typeof quickActionSchema>;
export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;