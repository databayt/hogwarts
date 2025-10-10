"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, Trash2, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { OnboardingSchoolData } from './types';
import { formatCurrency } from './util';

// Column definitions for school data tables (for admin/management views)
export interface SchoolColumn {
  key: keyof OnboardingSchoolData;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: OnboardingSchoolData) => React.ReactNode;
}

export const schoolColumns: SchoolColumn[] = [
  {
    key: 'name',
    title: 'School Name',
    sortable: true,
    filterable: true,
    render: (value, row) => (
      <div className="flex flex-col">
        <span className="font-medium">{value || 'Unnamed School'}</span>
        {row.domain && (
          <span className="text-xs text-muted-foreground">{row.domain}</span>
        )}
      </div>
    ),
  },
  {
    key: 'schoolType',
    title: 'Type',
    sortable: true,
    filterable: true,
    render: (value, row) => {
      if (!value) return '-';
      return (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      );
    },
  },
  {
    key: 'maxStudents',
    title: 'Capacity',
    sortable: true,
    render: (value, row) => {
      if (!value && !row.maxTeachers) return '-';
      return (
        <div className="text-sm">
          <div>{value || 0} students</div>
          <div className="text-muted-foreground">{row.maxTeachers || 0} teachers</div>
        </div>
      );
    },
  },
  {
    key: 'address',
    title: 'Location',
    filterable: true,
    render: (value, row) => {
      if (!value && !row.city) return '-';
      return (
        <div className="text-sm">
          <div className="truncate max-w-[200px]">{value || '-'}</div>
          {(row.city || row.state) && (
            <div className="text-muted-foreground">
              {[row.city, row.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: 'tuitionFee',
    title: 'Tuition',
    sortable: true,
    render: (value, row) => {
      if (!value || !row.currency) return '-';
      return (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(value, row.currency)}
          </div>
          {row.paymentSchedule && (
            <div className="text-muted-foreground text-xs">
              per {row.paymentSchedule}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: 'createdAt',
    title: 'Created',
    sortable: true,
    render: (value) => {
      if (!value) return '-';
      return (
        <div className="text-sm">
          {new Date(value).toLocaleDateString()}
        </div>
      );
    },
  },
];

// Action column component for table rows
interface SchoolActionsProps {
  school: OnboardingSchoolData;
  onView?: (school: OnboardingSchoolData) => void;
  onEdit?: (school: OnboardingSchoolData) => void;
  onDuplicate?: (school: OnboardingSchoolData) => void;
  onDelete?: (school: OnboardingSchoolData) => void;
}

export function SchoolActions({ 
  school, 
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete 
}: SchoolActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => navigator.clipboard.writeText(school.id || '')}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy School ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onView && (
          <DropdownMenuItem onClick={() => onView(school)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(school)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit School
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={() => onDuplicate(school)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onDelete && (
          <DropdownMenuItem 
            onClick={() => onDelete(school)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Status column component
interface SchoolStatusProps {
  completionPercentage?: number;
  isPublished?: boolean;
  draft?: boolean;
}

export function SchoolStatus({ 
  completionPercentage = 0, 
  isPublished = false, 
  draft = true 
}: SchoolStatusProps) {
  const getStatusColor = () => {
    if (isPublished) return 'default';
    if (completionPercentage >= 80) return 'secondary';
    if (completionPercentage >= 40) return 'outline';
    return 'destructive';
  };

  const getStatusText = () => {
    if (isPublished) return 'Published';
    if (draft) return 'Draft';
    if (completionPercentage >= 80) return 'Ready';
    if (completionPercentage >= 40) return 'In Progress';
    return 'Incomplete';
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={getStatusColor()} className="text-xs">
        {getStatusText()}
      </Badge>
      <div className="text-xs text-muted-foreground">
        {completionPercentage}% complete
      </div>
    </div>
  );
}

// Utility function to generate CSV export data
export function generateSchoolsCSV(schools: OnboardingSchoolData[]): string {
  const headers = [
    'School Name',
    'Type', 
    'Level',
    'Address',
    'City',
    'State',
    'Students',
    'Teachers',
    'Tuition Fee',
    'Currency',
    'Created',
    'Updated'
  ];

  const rows = schools.map(school => [
    school.name || '',
    school.schoolType || '',
    school.schoolLevel || '',
    school.address || '',
    school.city || '',
    school.state || '',
    school.maxStudents || '',
    school.maxTeachers || '',
    school.tuitionFee || '',
    school.currency || '',
    school.createdAt ? new Date(school.createdAt).toLocaleDateString() : '',
    school.updatedAt ? new Date(school.updatedAt).toLocaleDateString() : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

// Export helper function
export function exportSchoolsToCSV(schools: OnboardingSchoolData[], filename?: string) {
  const csv = generateSchoolsCSV(schools);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `schools-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}