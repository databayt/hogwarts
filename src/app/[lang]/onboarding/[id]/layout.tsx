"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import HostFooter from '@/components/onboarding/host-footer';
import { HostValidationProvider } from '@/components/onboarding/host-validation-context';
import { ListingProvider, useListing } from '@/components/onboarding/use-listing';
import { ErrorBoundary } from '@/components/onboarding/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useDictionary } from '@/components/internationalization/use-dictionary';
import { useLocale } from '@/components/internationalization/use-locale';

interface HostLayoutProps {
  children: React.ReactNode;
}

function HostLayoutContent({ children }: HostLayoutProps) {
  const params = useParams();
  const { loadListing, isLoading, error } = useListing();
  const { dictionary } = useDictionary();
  const { locale } = useLocale();
  const listingId = params.id as string | null;
  const dict = (dictionary?.school?.onboarding || {}) as any;


  useEffect(() => {
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId, loadListing]);

  // Get current page from pathname
  const getCurrentPage = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || 'about-school';
    }
    return 'about-school';
  };

  // Render appropriate skeleton based on current page
  const renderPageSkeleton = () => {
    const currentPage = getCurrentPage();

    // Two-column with image (about-school, stand-out, finish-setup)
    if (['about-school', 'stand-out', 'finish-setup'].includes(currentPage)) {
      return (
        <div className="w-full -mt-6 sm:-mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 lg:gap-12">
            <div className="space-y-4 sm:space-y-6">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="w-full sm:w-3/4 max-w-xl mx-auto h-[300px] sm:aspect-video flex items-center justify-center">
              <Skeleton className="w-48 h-48 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    // Two-column with form (title, description, location, capacity)
    if (['title', 'description', 'location', 'capacity'].includes(currentPage)) {
      return (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Branding page
    if (currentPage === 'branding') {
      return (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="space-y-5">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      );
    }

    // Import page
    if (currentPage === 'import') {
      return (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div>
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      );
    }

    // Join and Visibility pages (multi-column with options)
    if (['join', 'visibility'].includes(currentPage)) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-16 items-start">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      );
    }

    // Price page
    if (currentPage === 'price') {
      return (
        <div className="space-y-6">
          <Skeleton className="h-20 w-48" />
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      );
    }

    // Discount page
    if (currentPage === 'discount') {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      );
    }

    // Legal page
    if (currentPage === 'legal') {
      return (
        <div>
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-20 items-start">
            <div className="lg:col-span-2">
              <Skeleton className="h-6 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <div className="lg:col-span-3 space-y-3 sm:space-y-4">
              <Skeleton className="h-6 w-full mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default skeleton (two-column with image)
    return (
      <div className="w-full -mt-6 sm:-mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 lg:gap-12">
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="w-full sm:w-3/4 max-w-xl mx-auto h-[300px] sm:aspect-video flex items-center justify-center">
            <Skeleton className="w-48 h-48 rounded-full" />
          </div>
        </div>
      </div>
    );
  };

  // Show loading state while fetching school data
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 min-h-screen">
        <main className="h-screen pt-16">
          {renderPageSkeleton()}
        </main>
        <HostFooter dictionary={dictionary?.school} locale={locale} />
      </div>
    );
  }

  // Show error state if loading failed
  if (error) {
    return (
      <div className="px-4 sm:px-6 md:px-12 min-h-screen">
        <main className="h-screen pt-16 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2>{dict.unableToLoadSchool || "Unable to Load School"}</h2>
            <p className="muted mb-4">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => listingId && loadListing(listingId)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {dict.tryAgain || "Try Again"}
              </button>
              <button
                onClick={() => window.location.href = '/onboarding/overview'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                {dict.backToOverview || "Back to Overview"}
              </button>
            </div>
          </div>
        </main>
        <HostFooter dictionary={dictionary?.school} locale={locale} />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 md:px-12 h-screen flex flex-col">
      <main className="flex-1 flex items-center w-full pb-20">
        {children}
      </main>
      <HostFooter dictionary={dictionary?.school} locale={locale} />
    </div>
  );
}

const HostLayout = ({ children }: HostLayoutProps) => {
  return (
    <ErrorBoundary>
      <ListingProvider>
        <HostValidationProvider>
          <HostLayoutContent>
            {children}
          </HostLayoutContent>
        </HostValidationProvider>
      </ListingProvider>
    </ErrorBoundary>
  );
};

export default HostLayout;
