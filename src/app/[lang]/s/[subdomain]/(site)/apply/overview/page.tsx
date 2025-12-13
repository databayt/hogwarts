import React from 'react';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';
import ApplyOverviewClient from '@/components/site/apply/overview/apply-overview-client';

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams: Promise<{ id?: string }>;
}

const ApplyOverviewPage = async ({ params, searchParams }: Props) => {
  const { lang, subdomain } = await params;
  const { id } = await searchParams;
  const dictionary = await getDictionary(lang);

  return (
    <div className="h-screen overflow-hidden">
      <ApplyOverviewClient
        dictionary={dictionary.school.admission.form}
        lang={lang}
        subdomain={subdomain}
        id={id}
      />
    </div>
  );
};

export default ApplyOverviewPage;
