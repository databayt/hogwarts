"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ApplyFooter from '@/components/site/apply/apply-footer';
import { ApplyValidationProvider } from '@/components/site/apply/validation-context';
import { ApplicationProvider, useApplication } from '@/components/site/apply/application-context';
import ErrorBoundary from '@/components/site/apply/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useDictionary } from '@/components/internationalization/use-dictionary';
import { useLocale } from '@/components/internationalization/use-locale';

interface ApplyLayoutProps {
  children: React.ReactNode;
}

function ApplyLayoutContent({ children }: ApplyLayoutProps) {
  const params = useParams();
  const { initSession, session } = useApplication();
  const { isLoading, error } = session;
  const { dictionary } = useDictionary();
  const { locale } = useLocale();
  const campaignId = params.campaignId as string;
  const subdomain = params.subdomain as string;
  const isRTL = locale === 'ar';

  const dict = (dictionary as Record<string, unknown> | null)?.apply as Record<string, string> | undefined ?? {};

  useEffect(() => {
    if (campaignId && subdomain && !session.sessionToken) {
      initSession(subdomain, campaignId);
    }
  }, [campaignId, subdomain, initSession, session.sessionToken]);

  // Render skeleton based on loading state
  const renderSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );

  // Show loading state while initializing session
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 min-h-screen">
        <main className="h-screen pt-16">
          {renderSkeleton()}
        </main>
        <ApplyFooter dictionary={dictionary ?? undefined} locale={locale} />
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="px-4 sm:px-6 md:px-12 min-h-screen">
        <main className="h-screen pt-16 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">
              {dict.unableToLoad || (isRTL ? 'تعذر تحميل الطلب' : 'Unable to Load Application')}
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => campaignId && subdomain && initSession(subdomain, campaignId)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {dict.tryAgain || (isRTL ? 'حاول مرة أخرى' : 'Try Again')}
              </button>
              <button
                onClick={() => window.location.href = `/${locale}/apply`}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                {dict.backToCampaigns || (isRTL ? 'العودة للحملات' : 'Back to Campaigns')}
              </button>
            </div>
          </div>
        </main>
        <ApplyFooter dictionary={dictionary ?? undefined} locale={locale} />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 md:px-12 min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center w-full py-8 pb-32">
        {children}
      </main>
      <ApplyFooter dictionary={dictionary ?? undefined} locale={locale} />
    </div>
  );
}

export default function ApplyLayout({ children }: ApplyLayoutProps) {
  return (
    <ErrorBoundary>
      <ApplicationProvider>
        <ApplyValidationProvider>
          <ApplyLayoutContent>
            {children}
          </ApplyLayoutContent>
        </ApplyValidationProvider>
      </ApplicationProvider>
    </ErrorBoundary>
  );
}
