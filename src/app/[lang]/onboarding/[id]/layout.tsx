"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import HostFooter from '@/components/onboarding/host-footer';
import { HostValidationProvider } from '@/components/onboarding/host-validation-context';
import { ListingProvider, useListing } from '@/components/onboarding/use-listing';
import { ErrorBoundary } from '@/components/onboarding/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useDictionary } from '@/components/internationalization/use-dictionary';

interface HostLayoutProps {
  children: React.ReactNode;
}

function HostLayoutContent({ children }: HostLayoutProps) {
  const params = useParams();
  const { loadListing, isLoading, error } = useListing();
  const { dictionary } = useDictionary();
  const listingId = params.id as string | null;


  useEffect(() => {
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId, loadListing]);


  // Show loading state while fetching school data
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 min-h-screen">
        <main className="h-screen pt-16">
          <div className="w-full -mt-6 sm:-mt-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 lg:gap-12">
              {/* Left Side - Text Content Skeleton */}
              <div className="space-y-4 sm:space-y-6">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* Right Side - Image Skeleton */}
              <div className="w-full sm:w-3/4 max-w-xl mx-auto h-[300px] sm:aspect-video flex items-center justify-center">
                <Skeleton className="w-48 h-48 rounded-full" />
              </div>
            </div>
          </div>
        </main>
        <HostFooter dictionary={dictionary?.school} />
      </div>
    );
  }

  // Show error state if loading failed
  if (error) {
    return (
      <div className="px-4 sm:px-6 md:px-12 min-h-screen">
        <main className="h-screen pt-16 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Unable to Load School</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => listingId && loadListing(listingId)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/onboarding/overview'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Back to Overview
              </button>
            </div>
          </div>
        </main>
        <HostFooter dictionary={dictionary?.school} />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 min-h-screen">
      <main className="h-screen pt-16 ">
        {children}
      </main>
      <HostFooter dictionary={dictionary?.school} />
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
