/**
 * Type definitions for the Sales/Leads feature
 * Central location for all TypeScript types and interfaces
 */

import type {
  LeadStatusKey,
  LeadSourceKey,
  LeadPriorityKey,
  LeadTypeKey,
} from './constants';

// Base lead type (matches Prisma model)
export interface Lead {
  id: string;
  schoolId: string;

  // Contact Information
  name: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;

  // Organization Details
  company?: string | null;
  title?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;

  // Classification
  leadType: LeadTypeKey;
  industry?: string | null;
  location?: string | null;
  country?: string | null;

  // Pipeline Status
  status: LeadStatusKey;
  source: LeadSourceKey;
  priority: LeadPriorityKey;

  // Scoring
  score: number;
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Assignment
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    username?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;

  // Activity Tracking
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;

  // Notes and Tags
  notes?: string | null;
  tags: string[];

  // Import Tracking
  importId?: string | null;
  importedAt?: Date | null;

  // Metadata
  metadata?: Record<string, unknown> | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Lead creation input (omit auto-generated fields)
export type CreateLeadInput = Omit<
  Lead,
  'id' | 'schoolId' | 'createdAt' | 'updatedAt' | 'assignedTo'
>;

// Lead update input (all fields optional)
export type UpdateLeadInput = Partial<CreateLeadInput>;

// Lead filter options
export interface LeadFilters {
  search?: string;
  status?: LeadStatusKey;
  source?: LeadSourceKey;
  priority?: LeadPriorityKey;
  leadType?: LeadTypeKey;
  scoreMin?: number;
  scoreMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  assignedToId?: string;
  verified?: boolean;
}

// Lead sort options
export interface LeadSortOptions {
  field: keyof Lead;
  direction: 'asc' | 'desc';
}

// Pagination options
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
}

// Lead list response
export interface LeadListResponse {
  leads: Lead[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Lead Activity type
export interface LeadActivity {
  id: string;
  schoolId: string;
  leadId: string;
  type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdById: string;
  createdBy?: {
    id: string;
    username?: string | null;
    email?: string | null;
    image?: string | null;
  };
  createdAt: Date;
}

// Bulk operation types
export interface BulkOperation {
  type: 'update' | 'delete' | 'export' | 'tag';
  leadIds: string[];
  data?: Record<string, unknown>;
}

// Import/Export types
export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    reason: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  fields?: (keyof Lead)[];
  filters?: LeadFilters;
}

// Dashboard analytics
export interface LeadAnalytics {
  totalLeads: number;
  newLeadsThisWeek: number;
  conversionRate: number;
  averageScore: number;
  topSources: Array<{
    source: LeadSourceKey;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: LeadStatusKey;
    count: number;
    percentage: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
}

// Form state types
export interface LeadFormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  data: Partial<Lead>;
}

// Table column visibility
export interface ColumnVisibility {
  [key: string]: boolean;
}

// Table row selection
export interface RowSelection {
  [key: string]: boolean;
}

// Search suggestions
export interface SearchSuggestion {
  type: 'lead' | 'company' | 'tag';
  value: string;
  metadata?: Record<string, unknown>;
}
