"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Calendar,
  CalendarOff,
  School,
  AlertCircle,
  FileText,
  Plus,
  ChevronRight,
  QrCode,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type?: 'no-students' | 'no-classes' | 'no-attendance' | 'no-data' | 'no-analytics';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  showIcon?: boolean;
  dictionary?: any;
}

export function AttendanceEmptyState({
  type = 'no-data',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  showIcon = true,
  dictionary
}: EmptyStateProps) {
  const emptyStates = {
    'no-students': {
      icon: Users,
      defaultTitle: dictionary?.noStudents || 'No Students in Class',
      defaultDescription: dictionary?.noStudentsDesc || 'This class has no enrolled students. Add students to begin tracking attendance.',
      defaultActionLabel: dictionary?.addStudents || 'Add Students',
      defaultActionHref: '/students'
    },
    'no-classes': {
      icon: School,
      defaultTitle: dictionary?.noClasses || 'No Classes Available',
      defaultDescription: dictionary?.noClassesDesc || 'Create a class to start tracking attendance for your students.',
      defaultActionLabel: dictionary?.createClass || 'Create Class',
      defaultActionHref: '/classes'
    },
    'no-attendance': {
      icon: Calendar,
      defaultTitle: dictionary?.noAttendance || 'No Attendance Records',
      defaultDescription: dictionary?.noAttendanceDesc || 'No attendance has been marked for this date. Start by marking attendance for students.',
      defaultActionLabel: dictionary?.markAttendance || 'Mark Attendance',
      defaultActionHref: '#'
    },
    'no-data': {
      icon: FileText,
      defaultTitle: dictionary?.noData || 'No Data Available',
      defaultDescription: dictionary?.noDataDesc || 'There is no data to display at the moment.',
      defaultActionLabel: dictionary?.refresh || 'Refresh',
      defaultActionHref: '#'
    },
    'no-analytics': {
      icon: BarChart3,
      defaultTitle: dictionary?.noAnalytics || 'No Analytics Data',
      defaultDescription: dictionary?.noAnalyticsDesc || 'Start marking attendance to see analytics and insights.',
      defaultActionLabel: dictionary?.viewAttendance || 'View Attendance',
      defaultActionHref: '/attendance'
    }
  };

  const currentState = emptyStates[type];
  const Icon = currentState.icon;
  const finalTitle = title || currentState.defaultTitle;
  const finalDescription = description || currentState.defaultDescription;
  const finalActionLabel = actionLabel || currentState.defaultActionLabel;
  const finalActionHref = actionHref || currentState.defaultActionHref;

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {showIcon && (
          <div className="mb-4 rounded-full bg-muted p-3">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold">{finalTitle}</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {finalDescription}
        </p>
        {(onAction || finalActionHref !== '#') && (
          finalActionHref !== '#' ? (
            <Link href={finalActionHref}>
              <Button size="sm">
                {finalActionLabel}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={onAction}>
              {finalActionLabel}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}

export function NoClassesEmptyState({ dictionary }: { dictionary?: any }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <School className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>{dictionary?.noClasses || 'No Classes Available'}</CardTitle>
          <CardDescription className="mt-2">
            {dictionary?.noClassesDesc || 'You need to create classes before you can track attendance.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/classes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {dictionary?.createFirstClass || 'Create Your First Class'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function NoStudentsEmptyState({ dictionary }: { dictionary?: any }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-orange-100 p-3">
          <AlertCircle className="h-10 w-10 text-orange-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          {dictionary?.noStudentsInClass || 'No Students in This Class'}
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {dictionary?.noStudentsInClassDesc || 'This class doesn\'t have any enrolled students yet. Add students to start tracking their attendance.'}
        </p>
        <div className="flex gap-3">
          <Link href="/students/enroll">
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              {dictionary?.enrollStudents || 'Enroll Students'}
            </Button>
          </Link>
          <Link href="/students">
            <Button size="sm">
              {dictionary?.manageStudents || 'Manage Students'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function NoAttendanceDataEmptyState({ dictionary }: { dictionary?: any }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-blue-100 p-3">
          <CalendarOff className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          {dictionary?.noAttendanceToday || 'No Attendance Marked Today'}
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {dictionary?.noAttendanceTodayDesc || 'Attendance hasn\'t been marked for this date yet. You can mark attendance now or view records from other dates.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            {dictionary?.changDate || 'Change Date'}
          </Button>
          <Button size="sm">
            {dictionary?.startMarking || 'Start Marking'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function QRCodeEmptyState({ dictionary }: { dictionary?: any }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-purple-100 p-3">
          <QrCode className="h-10 w-10 text-purple-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          {dictionary?.noQRSessions || 'No Active QR Sessions'}
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {dictionary?.noQRSessionsDesc || 'Generate a QR code to allow students to mark their attendance by scanning.'}
        </p>
        <Button>
          <QrCode className="mr-2 h-4 w-4" />
          {dictionary?.generateQR || 'Generate QR Code'}
        </Button>
      </CardContent>
    </Card>
  );
}