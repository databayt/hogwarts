"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis, Users, GraduationCap, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export type ClassRow = {
  id: string;
  name: string;
  nameAr: string | null;
  subjectName: string;
  subjectNameAr: string | null;
  teacherName: string;
  termName: string;
  courseCode: string | null;
  credits: string | number | null;
  evaluationType: string;
  enrolledStudents: number;
  maxCapacity: number;
  createdAt: string;
};

/**
 * Get localized class name based on locale
 */
export function getLocalizedClassName(row: ClassRow, locale: Locale): string {
  if (locale === 'ar') {
    return row.nameAr || row.name || '';
  }
  return row.name || row.nameAr || '';
}

/**
 * Get localized subject name based on locale
 */
export function getLocalizedSubjectName(row: ClassRow, locale: Locale): string {
  if (locale === 'ar') {
    return row.subjectNameAr || row.subjectName || '';
  }
  return row.subjectName || row.subjectNameAr || '';
}

export interface ClassColumnCallbacks {
  onDelete?: (row: ClassRow) => void;
}

export const getClassColumns = (dictionary?: Dictionary['school']['classes'], lang?: Locale, callbacks?: ClassColumnCallbacks): ColumnDef<ClassRow>[] => {
  const t = {
    className: dictionary?.className || (lang === 'ar' ? 'اسم الفصل' : 'Class Name'),
    courseCode: dictionary?.courseCode || (lang === 'ar' ? 'رمز المقرر' : 'Course Code'),
    subject: dictionary?.subject || (lang === 'ar' ? 'المادة' : 'Subject'),
    teacher: dictionary?.teacher || (lang === 'ar' ? 'المعلم' : 'Teacher'),
    credits: dictionary?.credits || (lang === 'ar' ? 'الساعات' : 'Credits'),
    evaluation: dictionary?.evaluation || (lang === 'ar' ? 'التقييم' : 'Evaluation'),
    enrolled: dictionary?.enrolled || (lang === 'ar' ? 'المسجلين' : 'Enrolled'),
    term: dictionary?.term || (lang === 'ar' ? 'الفصل الدراسي' : 'Term'),
    created: dictionary?.created || (lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'),
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    viewStudents: lang === 'ar' ? 'عرض الطلاب' : 'View Students',
    viewGrades: lang === 'ar' ? 'عرض الدرجات' : 'View Grades',
    viewAttendance: lang === 'ar' ? 'عرض الحضور' : 'View Attendance',
  };

  return [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.className} />,
    meta: { label: t.className, variant: "text" },
    id: 'name',
    cell: ({ row }) => {
      const displayName = lang ? getLocalizedClassName(row.original, lang) : row.original.name;
      return <span>{displayName}</span>;
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "courseCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.courseCode} />,
    meta: { label: t.courseCode, variant: "text" },
    id: 'courseCode',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return value ? <span className="font-mono text-xs">{value}</span> : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "subjectName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.subject} />,
    meta: { label: t.subject, variant: "text" },
    id: 'subjectName',
    cell: ({ row }) => {
      const displayName = lang ? getLocalizedSubjectName(row.original, lang) : row.original.subjectName;
      return <span>{displayName}</span>;
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "teacherName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.teacher} />,
    meta: { label: t.teacher, variant: "text" },
    id: 'teacherName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "credits",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.credits} />,
    meta: { label: t.credits, variant: "number" },
    id: 'credits',
    cell: ({ getValue }) => {
      const value = getValue<string | number | null>();
      return value ? <span className="tabular-nums">{value}</span> : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "evaluationType",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.evaluation} />,
    meta: { label: t.evaluation, variant: "text" },
    id: 'evaluationType',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return <span className="text-xs">{value}</span>;
    },
  },
  {
    accessorKey: "enrolledStudents",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.enrolled} />,
    meta: { label: t.enrolled, variant: "number" },
    id: 'enrolledStudents',
    cell: ({ row }) => {
      const enrolled = row.original.enrolledStudents;
      const max = row.original.maxCapacity;
      return (
        <span className="tabular-nums text-xs">
          {enrolled}/{max}
        </span>
      );
    },
  },
  {
    accessorKey: "termName",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.term} />,
    meta: { label: t.term, variant: "text" },
    id: 'termName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t.created} />,
    meta: { label: t.created, variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{t.actions}</span>,
    cell: ({ row }) => {
      const classItem = row.original;
      const { openModal } = useModal();

      const onEdit = () => openModal(classItem.id);

      const onDelete = () => {
        callbacks?.onDelete?.(classItem);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${lang}/classes/${classItem.id}`}>
                {t.view}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${lang}/students?classId=${classItem.id}`}>
                <Users className="mr-2 h-4 w-4" />
                {t.viewStudents}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${lang}/grades?classId=${classItem.id}`}>
                <GraduationCap className="mr-2 h-4 w-4" />
                {t.viewGrades}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${lang}/attendance?classId=${classItem.id}`}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                {t.viewAttendance}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete}>{t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  ];
};



