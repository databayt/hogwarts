import { ParentAnnouncementsContent } from '@/components/platform/parent-portal/announcements/content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Announcements | Parent Portal',
  description: 'View school and class announcements for your children',
};

export default function ParentAnnouncementsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground mt-2">
          Stay updated with school and class announcements
        </p>
      </div>
      <ParentAnnouncementsContent />
    </div>
  );
}