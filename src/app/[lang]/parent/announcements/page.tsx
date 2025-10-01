import { ParentAnnouncementsContent } from '@/components/platform/parent-portal/announcements/content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Announcements | Parent Portal',
  description: 'View school and class announcements for your children',
};

export default function ParentAnnouncementsPage() {
  return <ParentAnnouncementsContent />;
}
