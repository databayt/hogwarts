import { ParentAttendanceContent } from '@/components/platform/parent-portal/attendance/content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Attendance | Parent Portal',
  description: 'View your children attendance records',
};

export default function ParentAttendancePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Student Attendance</h1>
        <p className="text-muted-foreground mt-2">
          View and track your children's attendance records
        </p>
      </div>
      <ParentAttendanceContent />
    </div>
  );
}