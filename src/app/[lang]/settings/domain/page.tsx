import { DomainRequestContent } from '@/components/platform/settings/domain-request/content';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Domain Settings | Hogwarts',
  description: 'Manage your school custom domain',
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function DomainSettings({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <DomainRequestContent dictionary={dictionary} lang={lang} />;
}