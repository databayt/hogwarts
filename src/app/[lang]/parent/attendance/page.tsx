import { ParentAttendanceContent } from '@/components/platform/parent-portal/attendance/content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Attendance | Parent Portal',
  description: 'View your children attendance records',
};

export default function ParentAttendancePage() {
  return <ParentAttendanceContent />;
}
