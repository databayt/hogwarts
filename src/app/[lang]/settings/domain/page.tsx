import { DomainRequestContent } from '@/components/platform/settings/domain-request/content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Domain Settings | Hogwarts',
  description: 'Manage your school custom domain',
};

export default function DomainSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your school's custom domain and subdomain requests
        </p>
      </div>
      <DomainRequestContent />
    </div>
  );
}