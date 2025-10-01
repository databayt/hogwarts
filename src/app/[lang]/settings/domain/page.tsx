import { DomainRequestContent } from '@/components/platform/settings/domain-request/content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Domain Settings | Hogwarts',
  description: 'Manage your school custom domain',
};

export default function DomainSettingsPage() {
  return <DomainRequestContent />;
}