"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Ellipsis,
  Eye,
  Pencil,
  Trash2,
  Phone,
  BookOpen,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import Link from "next/link";

// Enhanced TeacherRow with practical fields
export type TeacherRow = {
  id: string;
  name: string;
  givenName: string;
  surname: string;
  emailAddress: string;
  phone: string | null;
  department: string | null;
  departmentId: string | null;
  subjectCount: number;
  classCount: number;
  employmentStatus: string;
  employmentType: string;
  hasAccount: boolean;
  userId: string | null;
  profilePhotoUrl: string | null;
  joiningDate: string | null;
  createdAt: string;
};

export interface TeacherColumnCallbacks {
  onView?: (row: TeacherRow) => void;
  onEdit?: (row: TeacherRow) => void;
  onDelete?: (row: TeacherRow) => void;
  onToggleStatus?: (row: TeacherRow) => void;
}

export const getTeacherColumns = (
  dictionary?: Dictionary['school']['teachers'],
  lang?: Locale,
  callbacks?: TeacherColumnCallbacks
): ColumnDef<TeacherRow>[] => {
  const isRtl = lang === 'ar';

  const t = {
    name: dictionary?.fullName || (isRtl ? 'الاسم' : 'Name'),
    email: dictionary?.email || (isRtl ? 'البريد الإلكتروني' : 'Email'),
    phone: isRtl ? 'الهاتف' : 'Phone',
    department: isRtl ? 'القسم' : 'Department',
    subjects: isRtl ? 'المواد' : 'Subjects',
    classes: isRtl ? 'الفصول' : 'Classes',
    status: dictionary?.status || (isRtl ? 'الحالة' : 'Status'),
    account: isRtl ? 'الحساب' : 'Account',
    joined: isRtl ? 'تاريخ الانضمام' : 'Joined',
    created: dictionary?.created || (isRtl ? 'تاريخ الإنشاء' : 'Created'),
    actions: isRtl ? 'إجراءات' : 'Actions',
    view: isRtl ? 'عرض الملف' : 'View Profile',
    edit: isRtl ? 'تعديل' : 'Edit',
    delete: isRtl ? 'حذف' : 'Delete',
    activate: isRtl ? 'تفعيل' : 'Activate',
    deactivate: isRtl ? 'إلغاء التفعيل' : 'Deactivate',
    active: dictionary?.active || (isRtl ? 'نشط' : 'Active'),
    inactive: dictionary?.inactive || (isRtl ? 'غير نشط' : 'Inactive'),
    fullTime: isRtl ? 'دوام كامل' : 'Full-time',
    partTime: isRtl ? 'دوام جزئي' : 'Part-time',
    contract: isRtl ? 'عقد' : 'Contract',
    hasAccount: isRtl ? 'لديه حساب' : 'Has Account',
    noAccount: isRtl ? 'بدون حساب' : 'No Account',
    noDepartment: isRtl ? 'غير معين' : 'Unassigned',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'ACTIVE';
    return {
      label: isActive ? t.active : t.inactive,
      variant: isActive ? 'default' : 'secondary',
      className: isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600',
      icon: isActive ? CheckCircle : XCircle
    };
  };

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return { label: t.fullTime, className: 'bg-blue-100 text-blue-800' };
      case 'PART_TIME':
        return { label: t.partTime, className: 'bg-purple-100 text-purple-800' };
      case 'CONTRACT':
        return { label: t.contract, className: 'bg-orange-100 text-orange-800' };
      default:
        return { label: type, className: 'bg-gray-100 text-gray-600' };
    }
  };

  return [
    // Teacher Name with Avatar
    {
      accessorKey: "name",
      id: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.name} />,
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={teacher.profilePhotoUrl || ''} alt={teacher.name} />
              <AvatarFallback className="text-xs bg-primary/10">
                {getInitials(teacher.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link
                href={`/${lang}/teachers/${teacher.id}`}
                className="font-medium hover:underline"
              >
                {teacher.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {teacher.emailAddress !== '-' ? teacher.emailAddress : ''}
              </span>
            </div>
          </div>
        );
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
      size: 250,
    },

    // Department
    {
      accessorKey: "department",
      id: 'department',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.department} />,
      cell: ({ row }) => {
        const dept = row.original.department;
        if (!dept) {
          return (
            <span className="text-xs text-muted-foreground italic">
              {t.noDepartment}
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{dept}</span>
          </div>
        );
      },
      meta: { label: t.department, variant: "text" },
      enableColumnFilter: true,
    },

    // Contact (Phone)
    {
      accessorKey: "phone",
      id: 'phone',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.phone} />,
      cell: ({ row }) => {
        const phone = row.original.phone;
        if (!phone) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-mono" dir="ltr">{phone}</span>
          </div>
        );
      },
      meta: { label: t.phone, variant: "text" },
    },

    // Subjects & Classes Count
    {
      id: 'workload',
      header: () => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>{t.subjects}</span>
        </div>
      ),
      cell: ({ row }) => {
        const { subjectCount, classCount } = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-sm font-medium">{subjectCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{subjectCount} {t.subjects}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-sm font-medium">{classCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{classCount} {t.classes}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },

    // Employment Status
    {
      accessorKey: "employmentStatus",
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.status} />,
      cell: ({ row }) => {
        const status = row.original.employmentStatus;
        const badge = getStatusBadge(status);
        const Icon = badge.icon;
        return (
          <Badge variant="secondary" className={`gap-1 ${badge.className}`}>
            <Icon className="h-3 w-3" />
            {badge.label}
          </Badge>
        );
      },
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: 'active' },
          { label: t.inactive, value: 'inactive' }
        ]
      },
      enableColumnFilter: true,
    },

    // Account Status
    {
      accessorKey: "hasAccount",
      id: 'account',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.account} />,
      cell: ({ row }) => {
        const hasAccount = row.original.hasAccount;
        return (
          <Badge
            variant="outline"
            className={hasAccount ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-500'}
          >
            {hasAccount ? (
              <>
                <UserCheck className="h-3 w-3 mr-1" />
                {t.hasAccount}
              </>
            ) : (
              <>
                <UserX className="h-3 w-3 mr-1" />
                {t.noAccount}
              </>
            )}
          </Badge>
        );
      },
      enableSorting: false,
    },

    // Joined Date
    {
      accessorKey: "joiningDate",
      id: 'joiningDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.joined} />,
      cell: ({ row }) => {
        const date = row.original.joiningDate;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {new Date(date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'short'
            })}
          </span>
        );
      },
      meta: { label: t.joined, variant: "text" }
    },

    // Actions
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const teacher = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"}>
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* View Profile */}
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/teachers/${teacher.id}`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t.view}
                </Link>
              </DropdownMenuItem>

              {/* Edit */}
              <DropdownMenuItem
                onClick={() => callbacks?.onEdit?.(teacher)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t.edit}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Toggle Status */}
              <DropdownMenuItem
                onClick={() => callbacks?.onToggleStatus?.(teacher)}
                className="flex items-center gap-2"
              >
                {teacher.employmentStatus === 'ACTIVE' ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    {t.deactivate}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {t.activate}
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                onClick={() => callbacks?.onDelete?.(teacher)}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ];
};

// NOTE: Do NOT export pre-generated columns. Always use getTeacherColumns()
// inside useMemo in client components to avoid SSR hook issues.
